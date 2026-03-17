import type { 
  Destination, 
  DaySchedule, 
  RouteStop, 
  RegionAllocation,
  TravelIntensity,
  BudgetTier,
  Category
} from '@/types';
import { ROUTING_CONSTRAINTS, INTENSITY_LIMITS, BUDGET_CONFIG } from '@/data/constants';
import { distanceKm } from './distance';
import { scoreDestination } from './scoring';
import { optimizeRoute2Opt } from './routing';

/**
 * Day Scheduling Module
 * 
 * This module implements Phase B of the hierarchical planning approach.
 * For each region block, it generates an ordered list of stops per day
 * that respects time, distance, and variety constraints.
 * 
 * Constraints enforced:
 * - Max daily driving distance: 250 km
 * - Max daily visit time: 8 hours
 * - Region consistency: start and end in same region
 * - Category variety: max 2 same category per day
 * - Rest gap: long stops need short stops between them
 */

/**
 * Convert minutes to HH:MM format
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if adding a destination would violate category constraints
 */
function wouldViolateCategoryConstraint(
  currentStops: Destination[],
  candidate: Destination
): boolean {
  // Count categories in current stops
  const categoryCounts = new Map<Category, number>();
  
  for (const stop of currentStops) {
    for (const cat of stop.categories) {
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    }
  }
  
  // Check if candidate would exceed limit
  for (const cat of candidate.categories) {
    const count = categoryCounts.get(cat) || 0;
    if (count >= ROUTING_CONSTRAINTS.MAX_SAME_CATEGORY_PER_DAY) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if adding a stop would violate rest gap constraint
 */
function wouldViolateRestGapConstraint(
  stops: RouteStop[],
  candidate: Destination
): boolean {
  if (stops.length < 1) return false;
  
  const lastStop = stops[stops.length - 1];
  const lastDuration = lastStop.duration;
  
  // If last stop was long (>90 min) and candidate is also long
  if (lastDuration > ROUTING_CONSTRAINTS.LONG_STOP_THRESHOLD_MINUTES &&
      candidate.avg_visit_duration_minutes > ROUTING_CONSTRAINTS.LONG_STOP_THRESHOLD_MINUTES) {
    return true;
  }
  
  return false;
}

/**
 * Calculate driving time estimate (in minutes) for a distance
 */
function estimateDrivingTime(distanceKm: number): number {
  return Math.round((distanceKm / ROUTING_CONSTRAINTS.AVERAGE_DRIVING_SPEED_KMH) * 60);
}

/**
 * Select stops for a single day
 * 
 * @param availableDestinations - Destinations available for selection
 * @param userCategories - User's preferred categories
 * @param travelMonth - Travel month
 * @param intensity - Travel intensity level
 * @param maxDrivingKm - Maximum driving distance
 * @param maxVisitMinutes - Maximum visit time
 * @returns Selected stops with route
 */
function selectDayStops(
  availableDestinations: Destination[],
  userCategories: Category[],
  travelMonth: number,
  intensity: TravelIntensity,
  maxDrivingKm: number = ROUTING_CONSTRAINTS.MAX_DAILY_DRIVING_KM,
  maxVisitMinutes: number = ROUTING_CONSTRAINTS.MAX_DAILY_VISIT_HOURS * 60
): { stops: RouteStop[]; usedDestinations: Destination[] } {
  const maxStops = INTENSITY_LIMITS[intensity];
  const selected: Destination[] = [];
  const usedIds = new Set<string>();
  
  let totalDistance = 0;
  let totalVisitTime = 0;
  
  // Score and sort destinations
  const scored = availableDestinations
    .map(d => scoreDestination(d, userCategories, travelMonth, selected, selected))
    .sort((a, b) => b.score - a.score);
  
  // Select destinations iteratively
  for (const dest of scored) {
    // Check if we've reached the limit
    if (selected.length >= maxStops) break;
    
    // Check budget constraints
    if (usedIds.has(dest.id)) continue;
    
    // Check category constraint
    if (wouldViolateCategoryConstraint(selected, dest)) {
      continue;
    }
    
    // Calculate additional distance
    let additionalDistance = 0;
    if (selected.length > 0) {
      const lastSelected = selected[selected.length - 1];
      additionalDistance = distanceKm(
        { lat: lastSelected.lat, lng: lastSelected.lng },
        { lat: dest.lat, lng: dest.lng }
      );
    }
    
    // Check distance constraint
    const potentialDistance = totalDistance + additionalDistance + 
      (selected.length > 0 ? 0 : 0); // Return distance handled separately
    
    if (potentialDistance > maxDrivingKm) {
      continue;
    }
    
    // Check time constraint
    const additionalTime = dest.avg_visit_duration_minutes + 
      estimateDrivingTime(additionalDistance);
    
    if (totalVisitTime + additionalTime > maxVisitMinutes) {
      continue;
    }
    
    // Check rest gap constraint
    if (wouldViolateRestGapConstraint(
      selected.map((s, idx) => ({
        destination: s,
        arrivalTime: '',
        departureTime: '',
        duration: s.avg_visit_duration_minutes,
        travelDistanceFromPrevious: idx === 0 ? 0 : additionalDistance,
        scoreBreakdown: { interest: 0, season: 0, crowd: 0, cost: 0, detour: 0, diversity: 0 }
      })),
      dest
    )) {
      // Try to find a short stop to insert
      const shortStop = scored.find(d => 
        !usedIds.has(d.id) &&
        d.avg_visit_duration_minutes < ROUTING_CONSTRAINTS.SHORT_STOP_THRESHOLD_MINUTES &&
        !wouldViolateCategoryConstraint(selected, d)
      );
      
      if (shortStop) {
        selected.push(shortStop);
        usedIds.add(shortStop.id);
        totalDistance += distanceKm(
          { lat: selected[selected.length - 2]?.lat || 0, lng: selected[selected.length - 2]?.lng || 0 },
          { lat: shortStop.lat, lng: shortStop.lng }
        );
        totalVisitTime += shortStop.avg_visit_duration_minutes;
      } else {
        continue;
      }
    }
    
    // Add the destination
    selected.push(dest);
    usedIds.add(dest.id);
    totalDistance += additionalDistance;
    totalVisitTime += dest.avg_visit_duration_minutes;
  }
  
  return { 
    stops: [], // Will be populated in createDaySchedule
    usedDestinations: selected 
  };
}

/**
 * Create a day schedule from selected destinations
 */
function createDaySchedule(
  dayNumber: number,
  region: string,
  destinations: Destination[],
  userCategories: Category[],
  travelMonth: number,
  startHour: number = 9 // Default start at 9 AM
): DaySchedule {
  if (destinations.length === 0) {
    return {
      dayNumber,
      region: region as any,
      stops: [],
      totalDistance: 0,
      totalVisitTime: 0,
      totalDrivingTime: 0,
    };
  }
  
  // Optimize route order
  const optimizedRoute = optimizeRoute2Opt(destinations);
  
  // Create stops with timestamps
  const stops: RouteStop[] = [];
  let currentMinutes = startHour * 60; // Start time in minutes from midnight
  let totalDistance = 0;
  let totalVisitTime = 0;
  let totalDrivingTime = 0;
  
  for (let i = 0; i < optimizedRoute.length; i++) {
    const dest = optimizedRoute[i];
    const scored = scoreDestination(dest, userCategories, travelMonth, optimizedRoute.slice(0, i), optimizedRoute.slice(0, i));
    
    // Calculate travel from previous
    let travelDistance = 0;
    if (i > 0) {
      const prev = optimizedRoute[i - 1];
      travelDistance = distanceKm(
        { lat: prev.lat, lng: prev.lng },
        { lat: dest.lat, lng: dest.lng }
      );
    }
    
    const travelTime = estimateDrivingTime(travelDistance);
    
    // Update times
    currentMinutes += travelTime;
    const arrivalTime = minutesToTime(currentMinutes);
    
    totalDistance += travelDistance;
    totalDrivingTime += travelTime;
    
    // Visit duration
    const visitDuration = dest.avg_visit_duration_minutes;
    currentMinutes += visitDuration;
    const departureTime = minutesToTime(currentMinutes);
    
    totalVisitTime += visitDuration;
    
    stops.push({
      destination: dest,
      arrivalTime,
      departureTime,
      duration: visitDuration,
      travelDistanceFromPrevious: travelDistance,
      scoreBreakdown: scored.scoreBreakdown,
    });
  }
  
  return {
    dayNumber,
    region: region as any,
    stops,
    totalDistance,
    totalVisitTime,
    totalDrivingTime,
  };
}

/**
 * Generate schedules for all days
 */
export function generateDaySchedules(
  regionAllocations: RegionAllocation[],
  allDestinations: Destination[],
  userCategories: Category[],
  travelMonth: number,
  intensity: TravelIntensity,
  budgetTier: BudgetTier
): DaySchedule[] {
  const schedules: DaySchedule[] = [];
  const usedDestinationIds = new Set<string>();
  
  for (const allocation of regionAllocations) {
    // Get destinations for this region
    const regionDestinations = allDestinations.filter(
      d => d.region.en === allocation.region && !usedDestinationIds.has(d.id)
    );
    
    // Generate schedule for each day in this region
    for (let dayOffset = 0; dayOffset < allocation.dayCount; dayOffset++) {
      const dayNumber = allocation.startDay + dayOffset;
      
      // Select stops for this day
      const { usedDestinations } = selectDayStops(
        regionDestinations.filter(d => !usedDestinationIds.has(d.id)),
        userCategories,
        travelMonth,
        intensity
      );
      
      // Create schedule
      const schedule = createDaySchedule(
        dayNumber,
        allocation.region,
        usedDestinations,
        userCategories,
        travelMonth,
        9 + (dayOffset * 1) // Slightly later start each day
      );
      
      // Mark destinations as used
      for (const stop of schedule.stops) {
        usedDestinationIds.add(stop.destination.id);
      }
      
      schedules.push(schedule);
    }
  }
  
  // Apply budget constraints
  return applyBudgetConstraints(schedules, budgetTier, userCategories, travelMonth);
}

/**
 * Apply budget constraints to the schedule
 * Remove or replace expensive stops if over budget
 */
function applyBudgetConstraints(
  schedules: DaySchedule[],
  budgetTier: BudgetTier,
  userCategories: Category[],
  travelMonth: number
): DaySchedule[] {
  // Calculate current cost
  let totalTicketCost = 0;
  for (const schedule of schedules) {
    for (const stop of schedule.stops) {
      totalTicketCost += stop.destination.ticket_cost_omr;
    }
  }
  
  const budgetThreshold = BUDGET_CONFIG.budgetThresholds[budgetTier];
  
  // If under budget, no changes needed
  if (totalTicketCost <= budgetThreshold * 0.3) { // Allow 30% of budget for tickets
    return schedules;
  }
  
  // Need to reduce costs - sort stops by ticket cost and remove expensive ones
  const allStops = schedules.flatMap(s => 
    s.stops.map(stop => ({ schedule: s, stop }))
  );
  
  // Sort by ticket cost (descending)
  allStops.sort((a, b) => 
    b.stop.destination.ticket_cost_omr - a.stop.destination.ticket_cost_omr
  );
  
  // Remove stops until under budget
  let adjustedSchedules = [...schedules];
  for (const { schedule, stop } of allStops) {
    if (totalTicketCost <= budgetThreshold * 0.3) break;
    
    // Don't remove if it's the only stop in a day
    if (schedule.stops.length <= 1) continue;
    
    // Remove the stop
    const scheduleIndex = adjustedSchedules.findIndex(s => s.dayNumber === schedule.dayNumber);
    if (scheduleIndex >= 0) {
      const stopIndex = adjustedSchedules[scheduleIndex].stops.findIndex(
        s => s.destination.id === stop.destination.id
      );
      if (stopIndex >= 0) {
        totalTicketCost -= stop.destination.ticket_cost_omr;
        adjustedSchedules[scheduleIndex].stops.splice(stopIndex, 1);
        
        // Recalculate distances
        adjustedSchedules[scheduleIndex].totalDistance = calculateScheduleDistance(
          adjustedSchedules[scheduleIndex].stops
        );
      }
    }
  }
  
  return adjustedSchedules;
}

/**
 * Calculate total distance for a schedule's stops
 */
function calculateScheduleDistance(stops: RouteStop[]): number {
  return stops.reduce((sum, stop) => sum + stop.travelDistanceFromPrevious, 0);
}

/**
 * Validate a day schedule against all constraints
 */
export function validateDaySchedule(schedule: DaySchedule, intensity: TravelIntensity): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check stop count
  const maxStops = INTENSITY_LIMITS[intensity];
  if (schedule.stops.length > maxStops) {
    errors.push(`Day ${schedule.dayNumber}: ${schedule.stops.length} stops exceed limit of ${maxStops}`);
  }
  
  // Check driving distance
  if (schedule.totalDistance > ROUTING_CONSTRAINTS.MAX_DAILY_DRIVING_KM) {
    errors.push(`Day ${schedule.dayNumber}: ${schedule.totalDistance.toFixed(0)}km exceeds ${ROUTING_CONSTRAINTS.MAX_DAILY_DRIVING_KM}km limit`);
  }
  
  // Check visit time
  if (schedule.totalVisitTime > ROUTING_CONSTRAINTS.MAX_DAILY_VISIT_HOURS * 60) {
    errors.push(`Day ${schedule.dayNumber}: ${(schedule.totalVisitTime / 60).toFixed(1)}h exceeds ${ROUTING_CONSTRAINTS.MAX_DAILY_VISIT_HOURS}h limit`);
  }
  
  // Check category variety
  const categoryCounts = new Map<string, number>();
  for (const stop of schedule.stops) {
    for (const cat of stop.destination.categories) {
      const count = (categoryCounts.get(cat) || 0) + 1;
      categoryCounts.set(cat, count);
      if (count > ROUTING_CONSTRAINTS.MAX_SAME_CATEGORY_PER_DAY) {
        errors.push(`Day ${schedule.dayNumber}: Category "${cat}" appears ${count} times (max: ${ROUTING_CONSTRAINTS.MAX_SAME_CATEGORY_PER_DAY})`);
      }
    }
  }
  
  // Check rest gaps
  for (let i = 0; i < schedule.stops.length - 1; i++) {
    const current = schedule.stops[i];
    const next = schedule.stops[i + 1];
    
    if (current.duration > ROUTING_CONSTRAINTS.LONG_STOP_THRESHOLD_MINUTES &&
        next.duration > ROUTING_CONSTRAINTS.LONG_STOP_THRESHOLD_MINUTES) {
      errors.push(`Day ${schedule.dayNumber}: Two consecutive long stops without rest gap`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
