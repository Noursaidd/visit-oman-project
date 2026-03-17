import type { GeoPoint, Destination, RouteStop } from '@/types';

/**
 * Convert degrees to radians
 */
const toRad = (degrees: number): number => degrees * (Math.PI / 180);

/**
 * Calculate the Haversine distance between two geographic points
 * 
 * The Haversine formula determines the great-circle distance between two points
 * on a sphere given their longitudes and latitudes. This is essential for
 * calculating travel distances in Oman without external APIs.
 * 
 * Formula:
 *   a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
 *   c = 2 × atan2(√a, √(1-a))
 *   d = R × c
 * 
 * Where R is Earth's radius (6371 km)
 * 
 * @param pointA - Starting point with lat/lng coordinates
 * @param pointB - Ending point with lat/lng coordinates
 * @returns Distance in kilometers
 */
export function distanceKm(pointA: GeoPoint, pointB: GeoPoint): number {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRad(pointB.lat - pointA.lat);
  const dLng = toRad(pointB.lng - pointA.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pointA.lat)) * Math.cos(toRad(pointB.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Calculate total distance for a day's route
 * Sums up the distance between consecutive stops
 * 
 * @param stops - Array of route stops with destinations
 * @returns Total distance in kilometers
 */
export function totalKm(stops: RouteStop[]): number {
  if (stops.length === 0) return 0;
  
  let total = 0;
  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1].destination;
    const curr = stops[i].destination;
    total += distanceKm(
      { lat: prev.lat, lng: prev.lng },
      { lat: curr.lat, lng: curr.lng }
    );
  }
  return total;
}

/**
 * Calculate total distance for an array of destinations
 * 
 * @param destinations - Array of destinations in order
 * @returns Total distance in kilometers
 */
export function routeTotalKm(destinations: Destination[]): number {
  if (destinations.length === 0) return 0;
  
  let total = 0;
  for (let i = 1; i < destinations.length; i++) {
    total += distanceKm(
      { lat: destinations[i - 1].lat, lng: destinations[i - 1].lng },
      { lat: destinations[i].lat, lng: destinations[i].lng }
    );
  }
  return total;
}

/**
 * Calculate the detour penalty for adding a candidate stop to a route
 * 
 * The detour is calculated as the additional distance traveled when inserting
 * the candidate stop at the optimal position in the existing route.
 * 
 * For an existing route A → B, adding C between them:
 *   detour = distance(A, C) + distance(C, B) - distance(A, B)
 * 
 * @param existingRoute - Current route destinations
 * @param candidate - Candidate destination to potentially add
 * @returns Detour distance in kilometers
 */
export function detourKm(existingRoute: Destination[], candidate: Destination): number {
  if (existingRoute.length === 0) {
    // No existing route, so no detour - this is the first stop
    return 0;
  }
  
  if (existingRoute.length === 1) {
    // One existing stop - detour is just the distance to candidate
    const lastStop = existingRoute[existingRoute.length - 1];
    return distanceKm(
      { lat: lastStop.lat, lng: lastStop.lng },
      { lat: candidate.lat, lng: candidate.lng }
    );
  }
  
  // Find the best insertion point (minimum detour)
  let minDetour = Infinity;
  
  for (let i = 0; i < existingRoute.length - 1; i++) {
    const current = existingRoute[i];
    const next = existingRoute[i + 1];
    
    // Distance if we go directly from current to next
    const directDistance = distanceKm(
      { lat: current.lat, lng: current.lng },
      { lat: next.lat, lng: next.lng }
    );
    
    // Distance if we insert candidate between current and next
    const viaCandidate = 
      distanceKm({ lat: current.lat, lng: current.lng }, { lat: candidate.lat, lng: candidate.lng }) +
      distanceKm({ lat: candidate.lat, lng: candidate.lng }, { lat: next.lat, lng: next.lng });
    
    const detour = viaCandidate - directDistance;
    minDetour = Math.min(minDetour, detour);
  }
  
  // Also consider appending at the end
  const lastStop = existingRoute[existingRoute.length - 1];
  const appendDetour = distanceKm(
    { lat: lastStop.lat, lng: lastStop.lng },
    { lat: candidate.lat, lng: candidate.lng }
  );
  minDetour = Math.min(minDetour, appendDetour);
  
  return minDetour;
}

/**
 * Find the optimal insertion position for a candidate in a route
 * 
 * @param route - Current route
 * @param candidate - Candidate to insert
 * @returns Index where candidate should be inserted (route.length means append at end)
 */
export function findOptimalInsertionPoint(
  route: Destination[], 
  candidate: Destination
): number {
  if (route.length === 0) return 0;
  if (route.length === 1) return 1;
  
  let bestPosition = route.length; // Default: append at end
  let minAddedDistance = Infinity;
  
  // Check each possible insertion position
  for (let i = 0; i <= route.length; i++) {
    let addedDistance = 0;
    
    if (i === 0) {
      // Insert at beginning
      addedDistance = distanceKm(
        { lat: candidate.lat, lng: candidate.lng },
        { lat: route[0].lat, lng: route[0].lng }
      );
    } else if (i === route.length) {
      // Append at end
      addedDistance = distanceKm(
        { lat: route[route.length - 1].lat, lng: route[route.length - 1].lng },
        { lat: candidate.lat, lng: candidate.lng }
      );
    } else {
      // Insert in the middle
      const prev = route[i - 1];
      const next = route[i];
      
      const originalDistance = distanceKm(
        { lat: prev.lat, lng: prev.lng },
        { lat: next.lat, lng: next.lng }
      );
      
      const newDistance = 
        distanceKm({ lat: prev.lat, lng: prev.lng }, { lat: candidate.lat, lng: candidate.lng }) +
        distanceKm({ lat: candidate.lat, lng: candidate.lng }, { lat: next.lat, lng: next.lng });
      
      addedDistance = newDistance - originalDistance;
    }
    
    if (addedDistance < minAddedDistance) {
      minAddedDistance = addedDistance;
      bestPosition = i;
    }
  }
  
  return bestPosition;
}

/**
 * Get the center point of a set of destinations
 * Useful for map centering
 */
export function getCenterPoint(destinations: Destination[]): GeoPoint {
  if (destinations.length === 0) {
    return { lat: 22.5, lng: 58.5 }; // Default: center of Oman
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
 * Get the bounds of a set of destinations
 * Useful for map fitting
 */
export function getBounds(destinations: Destination[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  if (destinations.length === 0) {
    return { north: 26, south: 16, east: 60, west: 52 }; // Oman bounds
  }
  
  let north = -Infinity, south = Infinity;
  let east = -Infinity, west = Infinity;
  
  for (const d of destinations) {
    north = Math.max(north, d.lat);
    south = Math.min(south, d.lat);
    east = Math.max(east, d.lng);
    west = Math.min(west, d.lng);
  }
  
  return { north, south, east, west };
}
