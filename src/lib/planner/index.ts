/**
 * Main Itinerary Planner Module
 * 
 * This module orchestrates the entire planning process:
 * 1. Validates inputs
 * 2. Allocates regions (Phase A)
 * 3. Generates day schedules (Phase B)
 * 4. Calculates costs
 * 5. Returns the complete itinerary
 * 
 * The planner is fully deterministic - same inputs always produce identical outputs.
 */

import type { 
  Itinerary, 
  PlannerInputs, 
  Destination
} from '@/types';
import { getAllDestinations, getDestinationById } from '@/lib/data';
import { allocateRegions, validateAllocation } from './regionAllocation';
import { generateDaySchedules, validateDaySchedule } from './scheduling';
import { calculateCostBreakdown } from './budget';

/**
 * Generate a complete itinerary from user inputs
 * 
 * This is the main entry point for the planning algorithm.
 * 
 * @param inputs - User's planning preferences
 * @returns Complete itinerary with day schedules and cost breakdown
 */
export function generateItinerary(inputs: PlannerInputs): Itinerary {
  // Get all destinations, prioritizing saved ones
  const allDestinations = [...getAllDestinations()];
  
  // If user has saved destinations, prioritize them
  const savedDestinations = inputs.savedDestinationIds
    .map((id) => getDestinationById(id))
    .filter((d): d is Destination => d !== undefined);
  
  // Determine which destinations to consider
  let availableDestinations: Destination[];
  
  if (savedDestinations.length > 0) {
    // Use saved destinations plus others with matching categories
    const savedCategories = new Set(savedDestinations.flatMap(d => d.categories));
    const additionalDestinations = allDestinations.filter(d => 
      !inputs.savedDestinationIds.includes(d.id) &&
      d.categories.some(c => inputs.preferredCategories.includes(c) || savedCategories.has(c))
    );
    availableDestinations = [...savedDestinations, ...additionalDestinations];
  } else {
    // Use destinations matching preferred categories
    availableDestinations = allDestinations.filter(d =>
      d.categories.some(c => inputs.preferredCategories.includes(c))
    );
  }
  
  // If no matches, use all destinations
  if (availableDestinations.length === 0) {
    availableDestinations = allDestinations;
  }
  
  // Phase A: Region Allocation
  const regionAllocations = allocateRegions(
    inputs.tripDuration,
    availableDestinations,
    inputs.travelMonth,
    inputs.preferredCategories
  );
  
  // Validate allocation
  const allocationValidation = validateAllocation(regionAllocations, inputs.tripDuration);
  if (!allocationValidation.valid) {
    console.warn('Region allocation warnings:', allocationValidation.errors);
  }
  
  // Phase B: Day Scheduling
  const daySchedules = generateDaySchedules(
    regionAllocations,
    availableDestinations,
    inputs.preferredCategories,
    inputs.travelMonth,
    inputs.travelIntensity,
    inputs.budgetTier
  );
  
  // Validate schedules
  for (const schedule of daySchedules) {
    const validation = validateDaySchedule(schedule, inputs.travelIntensity);
    if (!validation.valid) {
      console.warn(`Day ${schedule.dayNumber} warnings:`, validation.errors);
    }
  }
  
  // Calculate totals
  const totalDistance = daySchedules.reduce((sum, s) => sum + s.totalDistance, 0);
  
  // Calculate costs
  const totalCost = calculateCostBreakdown(
    daySchedules,
    inputs.tripDuration,
    inputs.budgetTier
  );
  
  return {
    inputs,
    regionAllocations,
    daySchedules,
    totalDistance,
    totalCost,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Validate planner inputs
 */
export function validateInputs(inputs: PlannerInputs): { 
  valid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];
  
  if (inputs.tripDuration < 1 || inputs.tripDuration > 7) {
    errors.push('Trip duration must be between 1 and 7 days');
  }
  
  if (inputs.travelMonth < 1 || inputs.travelMonth > 12) {
    errors.push('Travel month must be between 1 and 12');
  }
  
  if (!['low', 'medium', 'luxury'].includes(inputs.budgetTier)) {
    errors.push('Invalid budget tier');
  }
  
  if (!['relaxed', 'balanced', 'packed'].includes(inputs.travelIntensity)) {
    errors.push('Invalid travel intensity');
  }
  
  if (inputs.preferredCategories.length === 0) {
    errors.push('At least one category preference is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get a summary of the itinerary for display
 */
export function getItinerarySummary(itinerary: Itinerary): {
  totalStops: number;
  regionsVisited: string[];
  categoriesCovered: string[];
  averageStopsPerDay: number;
} {
  const totalStops = itinerary.daySchedules.reduce(
    (sum, s) => sum + s.stops.length, 
    0
  );
  
  const regionsVisited = [...new Set(
    itinerary.daySchedules.map(s => s.region)
  )];
  
  const categoriesCovered = [...new Set(
    itinerary.daySchedules.flatMap(s => 
      s.stops.flatMap(stop => stop.destination.categories)
    )
  )];
  
  const averageStopsPerDay = itinerary.daySchedules.length > 0
    ? Math.round((totalStops / itinerary.daySchedules.length) * 10) / 10
    : 0;
  
  return {
    totalStops,
    regionsVisited,
    categoriesCovered,
    averageStopsPerDay,
  };
}

/**
 * Export the itinerary as a printable format
 */
export function exportItinerary(itinerary: Itinerary): string {
  const lines: string[] = [];
  
  lines.push('═'.repeat(60));
  lines.push('OMAN TRAVEL ITINERARY');
  lines.push('═'.repeat(60));
  lines.push('');
  
  // Trip overview
  lines.push(`Duration: ${itinerary.inputs.tripDuration} days`);
  lines.push(`Budget Tier: ${itinerary.inputs.budgetTier}`);
  lines.push(`Travel Month: ${itinerary.inputs.travelMonth}`);
  lines.push(`Intensity: ${itinerary.inputs.travelIntensity}`);
  lines.push('');
  
  // Region allocation
  lines.push('─'.repeat(40));
  lines.push('REGION ALLOCATION');
  lines.push('─'.repeat(40));
  for (const alloc of itinerary.regionAllocations) {
    lines.push(`Days ${alloc.startDay}-${alloc.endDay}: ${alloc.region.toUpperCase()} (${alloc.dayCount} day${alloc.dayCount > 1 ? 's' : ''})`);
  }
  lines.push('');
  
  // Day by day
  lines.push('─'.repeat(40));
  lines.push('DAY BY DAY SCHEDULE');
  lines.push('─'.repeat(40));
  
  for (const schedule of itinerary.daySchedules) {
    lines.push('');
    lines.push(`DAY ${schedule.dayNumber} - ${schedule.region.toUpperCase()}`);
    lines.push(`Distance: ${schedule.totalDistance.toFixed(1)} km | Visit Time: ${(schedule.totalVisitTime / 60).toFixed(1)} hrs`);
    
    for (const stop of schedule.stops) {
      lines.push(`  ${stop.arrivalTime} - ${stop.departureTime}: ${stop.destination.name.en}`);
      lines.push(`    Duration: ${stop.duration} min | Ticket: ${stop.destination.ticket_cost_omr} OMR`);
    }
  }
  
  lines.push('');
  lines.push('─'.repeat(40));
  lines.push('COST BREAKDOWN');
  lines.push('─'.repeat(40));
  lines.push(`Fuel:         ${itinerary.totalCost.fuel.toFixed(2)} OMR`);
  lines.push(`Tickets:      ${itinerary.totalCost.tickets.toFixed(2)} OMR`);
  lines.push(`Food:         ${itinerary.totalCost.food.toFixed(2)} OMR`);
  lines.push(`Accommodation: ${itinerary.totalCost.accommodation.toFixed(2)} OMR`);
  lines.push('─'.repeat(40));
  lines.push(`TOTAL:        ${itinerary.totalCost.total.toFixed(2)} OMR`);
  
  if (itinerary.totalCost.isOverBudget) {
    lines.push(`⚠ Over budget threshold of ${itinerary.totalCost.budgetThreshold} OMR`);
  }
  
  lines.push('');
  lines.push('═'.repeat(60));
  lines.push(`Total Distance: ${itinerary.totalDistance.toFixed(1)} km`);
  lines.push(`Generated: ${new Date(itinerary.generatedAt).toLocaleString()}`);
  lines.push('═'.repeat(60));
  
  return lines.join('\n');
}

// Re-export submodules for direct access
export { allocateRegions, validateAllocation } from './regionAllocation';
export { generateDaySchedules, validateDaySchedule } from './scheduling';
export { calculateCostBreakdown } from './budget';
export { distanceKm, totalKm, detourKm } from './distance';
export { scoreDestination, getTopScoreFactors } from './scoring';
export { optimizeRoute2Opt } from './routing';
