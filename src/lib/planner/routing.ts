import type { Destination } from '@/types';
import { distanceKm, routeTotalKm } from './distance';

/**
 * 2-Opt Route Optimization Algorithm
 * 
 * The 2-opt algorithm is a simple local search method for solving the Traveling
 * Salesman Problem (TSP). It works by iteratively removing two edges from the
 * route and reconnecting them in the opposite way, accepting the change only
 * if it reduces the total distance.
 * 
 * Algorithm:
 * 1. Start with an initial route
 * 2. For each pair of edges (i, i+1) and (j, j+1):
 *    - Create a new route by reversing the segment between i+1 and j
 *    - If the new route is shorter, accept it
 * 3. Repeat until no improvement can be made
 * 
 * Time Complexity: O(n²) per iteration
 * Space Complexity: O(n)
 * 
 * Why 2-opt over greedy approach:
 * - Greedy algorithms can get stuck in local optima
 * - 2-opt systematically explores route improvements
 * - Guarantees a locally optimal solution
 * - Simple and deterministic (no randomness)
 */

/**
 * Perform a 2-opt swap: reverse the segment between indices i and j
 * 
 * @param route - Current route
 * @param i - Start index of segment to reverse
 * @param j - End index of segment to reverse
 * @returns New route with reversed segment
 */
function twoOptSwap(route: Destination[], i: number, j: number): Destination[] {
  const newRoute = [...route];
  
  // Reverse the segment between i and j
  while (i < j) {
    [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];
    i++;
    j--;
  }
  
  return newRoute;
}

/**
 * Calculate the improvement from a 2-opt swap
 * 
 * When we swap edges (i, i+1) and (j, j+1), we:
 * - Remove: dist(i, i+1) + dist(j, j+1)
 * - Add: dist(i, j) + dist(i+1, j+1)
 * 
 * Improvement = Removed - Added
 * 
 * @param route - Current route
 * @param i - First edge start
 * @param j - Second edge start
 * @returns Improvement value (positive = better)
 */
function calculateImprovement(route: Destination[], i: number, j: number): number {
  const n = route.length;
  
  // Handle wraparound for circular route
  const i1 = i;
  const i2 = (i + 1) % n;
  const j1 = j;
  const j2 = (j + 1) % n;
  
  // Current distances
  const distI1I2 = distanceKm(
    { lat: route[i1].lat, lng: route[i1].lng },
    { lat: route[i2].lat, lng: route[i2].lng }
  );
  const distJ1J2 = distanceKm(
    { lat: route[j1].lat, lng: route[j1].lng },
    { lat: route[j2].lat, lng: route[j2].lng }
  );
  
  // New distances after swap
  const distI1J1 = distanceKm(
    { lat: route[i1].lat, lng: route[i1].lng },
    { lat: route[j1].lat, lng: route[j1].lng }
  );
  const distI2J2 = distanceKm(
    { lat: route[i2].lat, lng: route[i2].lng },
    { lat: route[j2].lat, lng: route[j2].lng }
  );
  
  return (distI1I2 + distJ1J2) - (distI1J1 + distI2J2);
}

/**
 * Perform one iteration of 2-opt improvement
 * 
 * @param route - Current route
 * @returns Improved route and whether improvement was made
 */
function twoOptIterate(route: Destination[]): { route: Destination[]; improved: boolean } {
  const n = route.length;
  
  if (n < 3) {
    return { route, improved: false };
  }
  
  let bestRoute = route;
  let bestImprovement = 0;
  let improved = false;
  
  // Try all possible 2-opt swaps
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 2; j < n; j++) {
      const improvement = calculateImprovement(route, i, j);
      
      if (improvement > bestImprovement) {
        bestImprovement = improvement;
        bestRoute = twoOptSwap(route, i, j);
        improved = true;
      }
    }
  }
  
  return { route: bestRoute, improved };
}

/**
 * Apply 2-opt optimization to a route
 * 
 * Repeatedly applies 2-opt swaps until no further improvement can be made.
 * This ensures we reach a local optimum for the given starting route.
 * 
 * @param route - Initial route
 * @param maxIterations - Maximum iterations (default: 100)
 * @returns Optimized route
 */
export function optimizeRoute2Opt(
  route: Destination[], 
  maxIterations: number = 100
): Destination[] {
  if (route.length < 3) {
    return route;
  }
  
  let currentRoute = route;
  let iterations = 0;
  
  while (iterations < maxIterations) {
    const result = twoOptIterate(currentRoute);
    
    if (!result.improved) {
      break;
    }
    
    currentRoute = result.route;
    iterations++;
  }
  
  return currentRoute;
}

/**
 * Optimize a route with fixed start and end points
 * 
 * For intra-day routes, we typically want to start from a specific location
 * (e.g., hotel) and return there. This version preserves the endpoints.
 * 
 * @param route - Route with fixed endpoints
 * @returns Optimized route with same endpoints
 */
export function optimizeRouteWithFixedEndpoints(route: Destination[]): Destination[] {
  if (route.length < 4) {
    // Need at least 4 points for meaningful optimization with fixed endpoints
    return route;
  }
  
  // Keep first and last fixed, optimize middle
  const start = route[0];
  const end = route[route.length - 1];
  const middle = route.slice(1, -1);
  
  // Optimize the middle segment
  const optimizedMiddle = optimizeRoute2Opt(middle);
  
  return [start, ...optimizedMiddle, end];
}

/**
 * Calculate the improvement percentage from optimization
 * 
 * @param originalDistance - Original route distance
 * @param optimizedDistance - Optimized route distance
 * @returns Percentage improvement (0-100)
 */
export function calculateImprovementPercent(
  originalDistance: number, 
  optimizedDistance: number
): number {
  if (originalDistance === 0) return 0;
  return ((originalDistance - optimizedDistance) / originalDistance) * 100;
}

/**
 * Optimize multiple day routes independently
 * 
 * @param dayRoutes - Array of routes per day
 * @returns Optimized routes per day
 */
export function optimizeMultipleRoutes(dayRoutes: Destination[][]): Destination[][] {
  return dayRoutes.map(route => optimizeRoute2Opt(route));
}

/**
 * Find the nearest neighbor from a set of destinations
 * 
 * Used for constructing initial routes before 2-opt optimization.
 * 
 * @param from - Starting point
 * @param destinations - Candidate destinations
 * @param excludeIds - IDs to exclude from consideration
 * @returns Nearest destination and distance
 */
export function findNearestNeighbor(
  from: Destination,
  destinations: Destination[],
  excludeIds: Set<string> = new Set()
): { destination: Destination | null; distance: number } {
  let nearest: Destination | null = null;
  let minDistance = Infinity;
  
  for (const dest of destinations) {
    if (excludeIds.has(dest.id)) continue;
    
    const dist = distanceKm(
      { lat: from.lat, lng: from.lng },
      { lat: dest.lat, lng: dest.lng }
    );
    
    if (dist < minDistance) {
      minDistance = dist;
      nearest = dest;
    }
  }
  
  return { destination: nearest, distance: minDistance };
}

/**
 * Construct an initial route using nearest neighbor heuristic
 * 
 * This provides a reasonable starting point for 2-opt optimization.
 * 
 * @param destinations - All destinations to visit
 * @param startFrom - Optional starting destination
 * @returns Initial route
 */
export function nearestNeighborRoute(
  destinations: Destination[],
  startFrom?: Destination
): Destination[] {
  if (destinations.length === 0) return [];
  if (destinations.length === 1) return destinations;
  
  const route: Destination[] = [];
  const remaining = new Set(destinations.map(d => d.id));
  const destMap = new Map(destinations.map(d => [d.id, d]));
  
  // Start from specified location or first destination
  let current: Destination = startFrom || destinations[0];
  route.push(current);
  remaining.delete(current.id);
  
  // Add destinations by nearest neighbor
  while (remaining.size > 0) {
    let nearest: Destination | null = null;
    let minDist = Infinity;
    
    for (const id of remaining) {
      const dest = destMap.get(id)!;
      const dist = distanceKm(
        { lat: current.lat, lng: current.lng },
        { lat: dest.lat, lng: dest.lng }
      );
      
      if (dist < minDist) {
        minDist = dist;
        nearest = dest;
      }
    }
    
    if (nearest) {
      route.push(nearest);
      remaining.delete(nearest.id);
      current = nearest;
    } else {
      break;
    }
  }
  
  return route;
}

/**
 * Full route optimization pipeline:
 * 1. Create initial route using nearest neighbor
 * 2. Apply 2-opt optimization
 * 3. Return optimized route with statistics
 */
export function fullRouteOptimization(
  destinations: Destination[],
  startFrom?: Destination
): { 
  route: Destination[]; 
  originalDistance: number;
  optimizedDistance: number;
  improvementPercent: number;
} {
  // Create initial route
  const initialRoute = nearestNeighborRoute(destinations, startFrom);
  const originalDistance = routeTotalKm(initialRoute);
  
  // Apply 2-opt
  const optimizedRoute = optimizeRoute2Opt(initialRoute);
  const optimizedDistance = routeTotalKm(optimizedRoute);
  
  return {
    route: optimizedRoute,
    originalDistance,
    optimizedDistance,
    improvementPercent: calculateImprovementPercent(originalDistance, optimizedDistance),
  };
}
