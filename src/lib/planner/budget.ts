import type { CostBreakdown, DaySchedule, BudgetTier } from '@/types';
import { BUDGET_CONFIG } from '@/data/constants';

/**
 * Budget-Aware Cost Estimation Module
 * 
 * This module calculates the total cost of a trip based on:
 * - Fuel consumption based on total distance
 * - Attraction ticket prices
 * - Food costs
 * - Accommodation based on budget tier
 * 
 * Oman-specific considerations:
 * - Fuel is relatively inexpensive (~0.25 OMR/liter)
 * - Accommodation varies widely by tier
 * - Many attractions are free or low-cost
 */

/**
 * Calculate fuel cost based on distance
 * 
 * Formula: fuel_cost = total_km / consumption * price_per_liter
 * 
 * @param totalKm - Total driving distance in kilometers
 * @returns Fuel cost in OMR
 */
export function calculateFuelCost(totalKm: number): number {
  const { fuelConsumptionKmPerLiter, fuelPricePerLiter } = BUDGET_CONFIG;
  const litersUsed = totalKm / fuelConsumptionKmPerLiter;
  return Math.round(litersUsed * fuelPricePerLiter * 100) / 100;
}

/**
 * Calculate total ticket costs from day schedules
 * 
 * @param schedules - Array of day schedules
 * @returns Total ticket cost in OMR
 */
export function calculateTicketCosts(schedules: DaySchedule[]): number {
  let total = 0;
  for (const schedule of schedules) {
    for (const stop of schedule.stops) {
      total += stop.destination.ticket_cost_omr;
    }
  }
  return Math.round(total * 100) / 100;
}

/**
 * Calculate food costs for the trip
 * 
 * @param days - Number of days
 * @returns Food cost in OMR
 */
export function calculateFoodCost(days: number): number {
  return BUDGET_CONFIG.foodCostPerDay * days;
}

/**
 * Calculate accommodation costs
 * 
 * @param nights - Number of nights (days - 1 for day trips)
 * @param tier - Budget tier
 * @returns Accommodation cost in OMR
 */
export function calculateAccommodationCost(nights: number, tier: BudgetTier): number {
  const costPerNight = BUDGET_CONFIG.hotelPerNight[tier];
  return nights * costPerNight;
}

/**
 * Calculate full cost breakdown for an itinerary
 * 
 * @param schedules - Array of day schedules
 * @param days - Total trip duration in days
 * @param tier - Budget tier
 * @returns Complete cost breakdown
 */
export function calculateCostBreakdown(
  schedules: DaySchedule[],
  days: number,
  tier: BudgetTier
): CostBreakdown {
  // Calculate total distance
  const totalDistance = schedules.reduce((sum, s) => sum + s.totalDistance, 0);
  
  // Calculate individual costs
  const fuel = calculateFuelCost(totalDistance);
  const tickets = calculateTicketCosts(schedules);
  const food = calculateFoodCost(days);
  
  // Nights = days - 1, minimum 0 (day trip)
  const nights = Math.max(0, days - 1);
  const accommodation = calculateAccommodationCost(nights, tier);
  
  // Total
  const total = Math.round((fuel + tickets + food + accommodation) * 100) / 100;
  
  // Check budget threshold
  const budgetThreshold = BUDGET_CONFIG.budgetThresholds[tier];
  const isOverBudget = total > budgetThreshold;
  
  return {
    fuel,
    tickets,
    food,
    accommodation,
    total,
    isOverBudget,
    budgetThreshold,
  };
}

/**
 * Get budget tier recommendations
 * 
 * @param budget - Available budget in OMR
 * @returns Recommended budget tier
 */
export function recommendBudgetTier(budget: number): BudgetTier {
  if (budget < 200) return 'low';
  if (budget < 500) return 'medium';
  return 'luxury';
}

/**
 * Format cost for display
 * 
 * @param cost - Cost in OMR
 * @returns Formatted string
 */
export function formatCost(cost: number): string {
  return `${cost.toFixed(2)} OMR`;
}

/**
 * Get cost percentage breakdown for visualization
 */
export function getCostPercentages(breakdown: CostBreakdown): {
  fuel: number;
  tickets: number;
  food: number;
  accommodation: number;
} {
  const total = breakdown.total || 1;
  
  return {
    fuel: Math.round((breakdown.fuel / total) * 100),
    tickets: Math.round((breakdown.tickets / total) * 100),
    food: Math.round((breakdown.food / total) * 100),
    accommodation: Math.round((breakdown.accommodation / total) * 100),
  };
}

/**
 * Estimate budget needed for a trip
 * 
 * @param days - Number of days
 * @param tier - Budget tier
 * @param estimatedDistance - Estimated total distance
 * @param estimatedTicketCost - Estimated ticket costs
 * @returns Estimated total cost
 */
export function estimateBudget(
  days: number,
  tier: BudgetTier,
  estimatedDistance: number = 150 * days,
  estimatedTicketCost: number = 10 * days
): number {
  const fuel = calculateFuelCost(estimatedDistance);
  const food = calculateFoodCost(days);
  const accommodation = calculateAccommodationCost(Math.max(0, days - 1), tier);
  
  return fuel + estimatedTicketCost + food + accommodation;
}
