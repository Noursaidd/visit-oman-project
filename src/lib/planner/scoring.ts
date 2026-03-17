import type { Destination, ScoredDestination, Category } from '@/types';
import { detourKm } from './distance';
import { SCORING_WEIGHTS, ROUTING_CONSTRAINTS } from '@/data/constants';

/**
 * Normalize a value to [0, 1] range using min-max normalization
 * 
 * @param value - The value to normalize
 * @param min - Minimum expected value
 * @param max - Maximum expected value
 * @returns Normalized value between 0 and 1
 */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5; // Avoid division by zero
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Calculate Jaccard similarity between two sets of categories
 * 
 * Jaccard Index = |A ∩ B| / |A ∪ B|
 * 
 * This measures how similar the user's preferred categories are to
 * a destination's categories. Higher values indicate better match.
 * 
 * @param userCategories - Categories selected by user
 * @param destCategories - Categories of the destination
 * @returns Similarity score between 0 and 1
 */
export function jaccardSimilarity(
  userCategories: Category[], 
  destCategories: Category[]
): number {
  if (userCategories.length === 0 || destCategories.length === 0) {
    return 0;
  }
  
  const setA = new Set(userCategories);
  const setB = new Set(destCategories);
  
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  return intersection.size / union.size;
}

/**
 * Calculate season fit score for a destination
 * 
 * This evaluates how well a destination's recommended months align
 * with the user's travel month. Destinations are scored based on:
 * - Direct match: 1.0 if travel month is in recommended months
 * - Adjacent month: 0.5 if travel month is adjacent to recommended
 * - Poor fit: 0.0 otherwise
 * 
 * For Oman specifically:
 * - Khareef (Jun-Sep) is crucial for Dhofar region
 * - Summer months are generally avoided for outdoor activities
 * - Winter (Oct-Mar) is peak season for most regions
 * 
 * @param travelMonth - User's travel month (1-12)
 * @param recommendedMonths - Destination's recommended months
 * @returns Season fit score between 0 and 1
 */
export function calculateSeasonFit(
  travelMonth: number, 
  recommendedMonths: number[]
): number {
  if (recommendedMonths.length === 0) {
    // If no recommendation, assume year-round suitability
    return 0.5;
  }
  
  // Direct match
  if (recommendedMonths.includes(travelMonth)) {
    return 1.0;
  }
  
  // Check for adjacent months (with wraparound)
  const prevMonth = travelMonth === 1 ? 12 : travelMonth - 1;
  const nextMonth = travelMonth === 12 ? 1 : travelMonth + 1;
  
  if (recommendedMonths.includes(prevMonth) || recommendedMonths.includes(nextMonth)) {
    return 0.5;
  }
  
  // Poor fit
  return 0.0;
}

/**
 * Calculate crowd level penalty
 * 
 * Crowd level is 1-5 where 1 is least crowded and 5 is most crowded.
 * We normalize and invert this so lower crowd = higher score.
 * 
 * @param crowdLevel - Destination crowd level (1-5)
 * @returns Penalty score between 0 and 1 (higher = less crowded)
 */
export function calculateCrowdPenalty(crowdLevel: number): number {
  // Normalize from 1-5 to 0-1, then invert
  // crowd_level 1 -> 1.0 (great)
  // crowd_level 5 -> 0.0 (poor)
  return normalize(crowdLevel, 1, 5);
}

/**
 * Calculate cost penalty (normalized ticket cost)
 * 
 * @param ticketCost - Ticket cost in OMR
 * @returns Penalty score between 0 and 1 (higher = cheaper)
 */
export function calculateCostPenalty(ticketCost: number): number {
  // Normalize and invert: free = 1.0, expensive = 0.0
  // Assuming max reasonable ticket cost is 10 OMR
  return 1 - normalize(ticketCost, 0, 10);
}

/**
 * Calculate detour penalty for adding a destination to existing route
 * 
 * @param existingRoute - Current route destinations
 * @param candidate - Candidate destination
 * @returns Penalty score between 0 and 1 (higher = less detour)
 */
export function calculateDetourPenalty(
  existingRoute: Destination[], 
  candidate: Destination
): number {
  const detour = detourKm(existingRoute, candidate);
  
  // Normalize: 0km detour = 1.0, 200km+ detour = 0.0
  return 1 - normalize(detour, 0, ROUTING_CONSTRAINTS.MAX_DAILY_DRIVING_KM);
}

/**
 * Calculate diversity gain for adding a destination
 * 
 * Encourages variety in selected destinations by considering:
 * - Category diversity
 * - Regional diversity
 * 
 * @param candidate - Candidate destination
 * @param selectedSet - Already selected destinations
 * @returns Diversity gain score between 0 and 1
 */
export function calculateDiversityGain(
  candidate: Destination, 
  selectedSet: Destination[]
): number {
  if (selectedSet.length === 0) {
    // First selection always has maximum diversity
    return 1.0;
  }
  
  // Calculate category diversity
  const existingCategories = new Set(selectedSet.flatMap(d => d.categories));
  const newCategories = candidate.categories.filter(c => !existingCategories.has(c));
  const categoryDiversity = newCategories.length / candidate.categories.length;
  
  // Calculate regional diversity
  const existingRegions = new Set(selectedSet.map(d => d.region.en));
  const regionDiversity = existingRegions.has(candidate.region.en) ? 0 : 1;
  
  // Weight: categories more important than region
  return 0.7 * categoryDiversity + 0.3 * regionDiversity;
}

/**
 * Score a single destination against user preferences and route constraints
 * 
 * @param destination - Destination to score
 * @param userCategories - User's preferred categories
 * @param travelMonth - User's travel month
 * @param existingRoute - Current route
 * @param selectedSet - Already selected destinations
 * @returns Scored destination with breakdown
 */
export function scoreDestination(
  destination: Destination,
  userCategories: Category[],
  travelMonth: number,
  existingRoute: Destination[],
  selectedSet: Destination[]
): ScoredDestination {
  // Calculate individual components
  const interest = jaccardSimilarity(userCategories, destination.categories);
  const season = calculateSeasonFit(travelMonth, destination.recommended_months);
  const crowd = calculateCrowdPenalty(destination.crowd_level);
  const cost = calculateCostPenalty(destination.ticket_cost_omr);
  const detour = calculateDetourPenalty(existingRoute, destination);
  const diversity = calculateDiversityGain(destination, selectedSet);
  
  // Apply weights and compute final score
  const score = 
    SCORING_WEIGHTS.interest * interest +
    SCORING_WEIGHTS.season * season +
    SCORING_WEIGHTS.crowd * crowd +
    SCORING_WEIGHTS.cost * cost +
    SCORING_WEIGHTS.detour * detour +
    SCORING_WEIGHTS.diversity * diversity;
  
  return {
    ...destination,
    score,
    scoreBreakdown: {
      interest,
      season,
      crowd,
      cost,
      detour,
      diversity,
    },
  };
}

/**
 * Score all available destinations and sort by score
 * 
 * @param destinations - All available destinations
 * @param userCategories - User's preferred categories
 * @param travelMonth - User's travel month
 * @param existingRoute - Current route
 * @param selectedSet - Already selected destinations
 * @param excludeIds - Destination IDs to exclude
 * @returns Scored destinations sorted by score descending
 */
export function scoreAndSortDestinations(
  destinations: Destination[],
  userCategories: Category[],
  travelMonth: number,
  existingRoute: Destination[],
  selectedSet: Destination[],
  excludeIds: Set<string> = new Set()
): ScoredDestination[] {
  return destinations
    .filter(d => !excludeIds.has(d.id))
    .map(d => scoreDestination(d, userCategories, travelMonth, existingRoute, selectedSet))
    .sort((a, b) => b.score - a.score);
}

/**
 * Get the top contributing score factors for a scored destination
 * 
 * @param scored - Scored destination
 * @param count - Number of top factors to return
 * @returns Array of factor names and their values
 */
export function getTopScoreFactors(
  scored: ScoredDestination, 
  count: number = 2
): { factor: string; value: number; weight: number }[] {
  const { scoreBreakdown } = scored;
  
  const factors = [
    { factor: 'interest', value: scoreBreakdown.interest, weight: SCORING_WEIGHTS.interest },
    { factor: 'season', value: scoreBreakdown.season, weight: SCORING_WEIGHTS.season },
    { factor: 'crowd', value: scoreBreakdown.crowd, weight: SCORING_WEIGHTS.crowd },
    { factor: 'cost', value: scoreBreakdown.cost, weight: SCORING_WEIGHTS.cost },
    { factor: 'detour', value: scoreBreakdown.detour, weight: SCORING_WEIGHTS.detour },
    { factor: 'diversity', value: scoreBreakdown.diversity, weight: SCORING_WEIGHTS.diversity },
  ];
  
  // Sort by weighted contribution (value * weight)
  return factors
    .sort((a, b) => (b.value * b.weight) - (a.value * a.weight))
    .slice(0, count);
}
