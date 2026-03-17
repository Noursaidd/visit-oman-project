import type { Destination, Region, RegionAllocation, Category } from '@/types';
import { REGION_CONSTRAINTS } from '@/data/constants';
import { distanceKm } from './distance';
import { calculateSeasonFit } from './scoring';

/**
 * Region-Level Planning (Hierarchical Optimization)
 * 
 * This module implements the Phase A of the hierarchical planning approach.
 * It allocates total trip days across regions to maximize utility while
 * enforcing diversity and distance constraints.
 * 
 * Algorithm:
 * 1. Score each region based on:
 *    - Number of matching destinations
 *    - Season fit for the travel month
 *    - Average destination quality
 * 2. Allocate days proportionally with constraints
 * 3. Ensure minimum region count for longer trips
 */

type RegionKey = 'Muscat' | 'Dakhiliya' | 'Sharqiya' | 'Dhofar' | 'Batinah' | 'Dhahira';

/**
 * Calculate a score for a region based on destinations and travel month
 */
function scoreRegion(
  destinations: Destination[],
  travelMonth: number,
  userCategories: Category[]
): number {
  if (destinations.length === 0) return 0;
  
  // Season fit score
  const avgSeasonFit = destinations.reduce((sum, d) => 
    sum + calculateSeasonFit(travelMonth, d.recommended_months), 0
  ) / destinations.length;
  
  // Category match score
  const matchingDestinations = destinations.filter(d => 
    d.categories.some(c => userCategories.includes(c))
  ).length;
  const categoryScore = matchingDestinations / destinations.length;
  
  // Quality score (inverse crowd level, normalized ticket cost)
  const avgQuality = destinations.reduce((sum, d) => 
    sum + (6 - d.crowd_level) / 5, 0
  ) / destinations.length;
  
  // Weighted combination
  return 0.4 * avgSeasonFit + 0.35 * categoryScore + 0.25 * avgQuality;
}

/**
 * Group destinations by region
 */
export function groupByRegion(destinations: Destination[]): Map<RegionKey, Destination[]> {
  const groups = new Map<RegionKey, Destination[]>();
  
  for (const dest of destinations) {
    const regionName = dest.region.en;
    const region = regionName as RegionKey;
    if (!groups.has(region)) {
      groups.set(region, []);
    }
    groups.get(region)!.push(dest);
  }
  
  return groups;
}

/**
 * Calculate distance between region centers
 */
function getRegionCenter(destinations: Destination[]): { lat: number; lng: number } {
  if (destinations.length === 0) {
    return { lat: 0, lng: 0 };
  }
  
  const sum = destinations.reduce(
    (acc, d) => ({ lat: acc.lat + d.lat, lng: acc.lng + d.lng }),
    { lat: 0, lng: 0 }
  );
  
  return {
    lat: sum.lat / destinations.length,
    lng: sum.lng / destinations.length,
  };
}

/**
 * Sort regions by geographic proximity to minimize travel
 * Uses a greedy nearest-neighbor approach starting from Muscat
 */
function sortRegionsByProximity(
  regions: RegionKey[],
  regionGroups: Map<RegionKey, Destination[]>
): RegionKey[] {
  if (regions.length <= 1) return regions;
  
  const regionCenters = new Map<RegionKey, { lat: number; lng: number }>();
  for (const region of regions) {
    regionCenters.set(region, getRegionCenter(regionGroups.get(region) ?? []));
  }
  
  const sorted: RegionKey[] = [];
  const remaining = new Set(regions);
  
  // Start from Muscat (typical entry point)
  let current: RegionKey = 'Muscat';
  if (!remaining.has(current)) {
    // If Muscat not in regions, start with first
    current = regions[0];
  }
  
  while (remaining.size > 0) {
    sorted.push(current);
    remaining.delete(current);
    
    if (remaining.size === 0) break;
    
    // Find nearest remaining region
    let nearest: RegionKey | null = null;
    let minDist = Infinity;
    const currentCenter = regionCenters.get(current);
    if (!currentCenter) break;
    
    for (const region of remaining) {
      const candidateCenter = regionCenters.get(region);
      if (!candidateCenter) continue;

      const dist = distanceKm(currentCenter, candidateCenter);
      if (dist < minDist) {
        minDist = dist;
        nearest = region;
      }
    }
    
    if (nearest) {
      current = nearest;
    } else {
      break;
    }
  }
  
  return sorted;
}

/**
 * Allocate days across regions
 * 
 * Constraints:
 * - At least 2 regions if trip duration >= 3 days
 * - No region gets more than ceil(days / 2) days
 * - Regions with low season fit are deprioritized
 * 
 * @param totalDays - Total trip duration (1-7)
 * @param destinations - All destinations
 * @param travelMonth - User's travel month
 * @param userCategories - User's preferred categories
 * @returns Ordered region allocations with day counts
 */
export function allocateRegions(
  totalDays: number,
  destinations: Destination[],
  travelMonth: number,
  userCategories: Category[]
): RegionAllocation[] {
  // Group destinations by region
  const regionGroups = groupByRegion(destinations);
  
  // Score each region
  const regionScores: { region: RegionKey; score: number; destCount: number }[] = [];
  
  for (const [region, dests] of regionGroups) {
    const score = scoreRegion(dests, travelMonth, userCategories);
    regionScores.push({ region, score, destCount: dests.length });
  }
  
  // Sort by score (descending)
  regionScores.sort((a, b) => b.score - a.score);
  
  // Determine minimum regions required
  const minRegions = totalDays >= REGION_CONSTRAINTS.minRegionsThreshold 
    ? REGION_CONSTRAINTS.minRegionsRequired 
    : 1;
  
  // Maximum days per region
  const maxDaysPerRegion = Math.ceil(totalDays / REGION_CONSTRAINTS.maxRegionDaysDivisor);
  
  // Select regions (prioritize by score, ensure minimum)
  const selectedRegions: RegionKey[] = regionScores
    .filter(r => r.score > 0.1) // Filter out very low scoring regions
    .slice(0, Math.max(minRegions, Math.min(regionScores.length, totalDays)))
    .map(r => r.region);
  
  // Ensure minimum regions even with low scores
  while (selectedRegions.length < minRegions && regionScores.length > selectedRegions.length) {
    const nextRegion = regionScores[selectedRegions.length];
    if (nextRegion && !selectedRegions.includes(nextRegion.region)) {
      selectedRegions.push(nextRegion.region);
    } else {
      break;
    }
  }
  
  if (selectedRegions.length === 0) {
    // Fallback: use first available region
    if (regionScores.length > 0) {
      selectedRegions.push(regionScores[0].region);
    }
  }
  
  // Sort regions by geographic proximity
  const sortedRegions = sortRegionsByProximity(selectedRegions, regionGroups);
  
  // Allocate days proportionally based on scores
  const totalScore = sortedRegions.reduce((sum, region) => {
    const scoreData = regionScores.find(r => r.region === region);
    return sum + (scoreData?.score || 0);
  }, 0);
  
  const allocations: RegionAllocation[] = [];
  let remainingDays = totalDays;
  let currentDay = 1;
  
  for (let i = 0; i < sortedRegions.length; i++) {
    const region = sortedRegions[i];
    const scoreData = regionScores.find(r => r.region === region);
    const score = scoreData?.score || 0;
    
    let days: number;
    
    if (i === sortedRegions.length - 1) {
      // Last region gets remaining days
      days = remainingDays;
    } else {
      // Proportional allocation
      const proportion = totalScore > 0 ? score / totalScore : 1 / sortedRegions.length;
      days = Math.max(1, Math.min(
        maxDaysPerRegion,
        Math.round(proportion * totalDays)
      ));
    }
    
    // Respect constraints
    days = Math.min(days, maxDaysPerRegion);
    days = Math.min(days, remainingDays);
    days = Math.max(1, days);
    
    allocations.push({
      region: region as Region,
      startDay: currentDay,
      endDay: currentDay + days - 1,
      dayCount: days,
    });
    
    currentDay += days;
    remainingDays -= days;
    
    if (remainingDays <= 0) break;
  }
  
  return allocations;
}

/**
 * Get destinations for a specific region
 */
export function getDestinationsForRegion(
  destinations: Destination[],
  region: Region
): Destination[] {
  return destinations.filter(d => d.region.en === region);
}

/**
 * Validate region allocation against constraints
 */
export function validateAllocation(
  allocations: RegionAllocation[],
  totalDays: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check total days
  const allocatedDays = allocations.reduce((sum, a) => sum + a.dayCount, 0);
  if (allocatedDays !== totalDays) {
    errors.push(`Allocated days (${allocatedDays}) don't match total (${totalDays})`);
  }
  
  // Check minimum regions for longer trips
  if (totalDays >= REGION_CONSTRAINTS.minRegionsThreshold && allocations.length < 2) {
    errors.push(`Trips of ${totalDays}+ days require at least 2 regions`);
  }
  
  // Check max days per region
  const maxDays = Math.ceil(totalDays / 2);
  for (const allocation of allocations) {
    if (allocation.dayCount > maxDays) {
      errors.push(`Region ${allocation.region} has ${allocation.dayCount} days (max: ${maxDays})`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
