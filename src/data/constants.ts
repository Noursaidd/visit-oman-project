import type { BudgetTier, TravelIntensity } from '@/types';

// ============================================================================
// SCORING MODEL WEIGHTS
// ============================================================================
// These weights determine the relative importance of each factor in the
// multi-objective scoring function. All factors are normalized to [0,1]
// before weighting, so weights represent relative priorities.

export const SCORING_WEIGHTS = {
  // User interest match - highest priority as it reflects user preferences
  interest: 0.25,
  
  // Seasonal appropriateness - critical for Oman's climate variations
  // (e.g., Khareef in Dhofar, summer heat avoidance)
  season: 0.20,
  
  // Crowd level - penalize crowded destinations for better experience
  crowd: 0.15,
  
  // Cost efficiency - important for budget-conscious travelers
  cost: 0.15,
  
  // Route efficiency - minimize detours for realistic travel plans
  detour: 0.15,
  
  // Diversity - ensure variety in destinations selected
  diversity: 0.10,
} as const;

// Weight justification:
// - Interest is highest (0.25) because user preferences should drive recommendations
// - Season (0.20) is crucial for Oman tourism (Khareef season, turtle nesting, etc.)
// - Crowd, Cost, and Detour are balanced (0.15 each) as secondary considerations
// - Diversity (0.10) adds variety but shouldn't override user preferences

// ============================================================================
// ROUTING CONSTRAINTS
// ============================================================================

export const ROUTING_CONSTRAINTS = {
  // Maximum driving distance per day (km)
  MAX_DAILY_DRIVING_KM: 250,
  
  // Maximum total visit time per day (hours)
  MAX_DAILY_VISIT_HOURS: 8,
  
  // Minimum rest gap between long stops (minutes)
  MIN_REST_GAP_MINUTES: 30,
  
  // Long stop threshold (minutes) - stops longer than this need rest gap after
  LONG_STOP_THRESHOLD_MINUTES: 90,
  
  // Short stop threshold (minutes) - can serve as rest between long stops
  SHORT_STOP_THRESHOLD_MINUTES: 45,
  
  // Maximum same category repetitions per day
  MAX_SAME_CATEGORY_PER_DAY: 2,
  
  // Average driving speed for time estimation (km/h)
  AVERAGE_DRIVING_SPEED_KMH: 60,
} as const;

// ============================================================================
// TRAVEL INTENSITY LIMITS
// ============================================================================

export const INTENSITY_LIMITS: Record<TravelIntensity, number> = {
  relaxed: 3,   // 3 stops per day max
  balanced: 4,  // 4 stops per day max
  packed: 5,    // 5 stops per day max
} as const;

// ============================================================================
// BUDGET CONFIGURATION
// ============================================================================

export const BUDGET_CONFIG = {
  // Hotel cost per night by tier (OMR)
  hotelPerNight: {
    low: 20,
    medium: 45,
    luxury: 90,
  } as Record<BudgetTier, number>,
  
  // Budget thresholds (OMR) - above this triggers cost optimization
  budgetThresholds: {
    low: 150,
    medium: 400,
    luxury: 800,
  } as Record<BudgetTier, number>,
  
  // Fuel consumption (km per liter) - average for Omani roads
  fuelConsumptionKmPerLiter: 12,
  
  // Fuel price (OMR per liter) - approximate current price
  fuelPricePerLiter: 0.25,
  
  // Food cost per day (OMR)
  foodCostPerDay: 6,
} as const;

// ============================================================================
// REGION ALLOCATION CONSTRAINTS
// ============================================================================

export const REGION_CONSTRAINTS = {
  // Minimum number of regions if trip is >= this many days
  minRegionsThreshold: 3,
  
  // Minimum regions to visit when threshold met
  minRegionsRequired: 2,
  
  // Maximum days per region = ceil(totalDays / maxRegionDaysDivisor)
  maxRegionDaysDivisor: 2,
} as const;

// ============================================================================
// CATEGORY AND REGION DISPLAY CONFIGURATION
// ============================================================================

export const REGION_NAMES: Record<string, { en: string; ar: string }> = {
  muscat: { en: 'Muscat', ar: 'Ù…Ø³Ù‚Ø·' },
  dakhiliya: { en: 'Dakhiliya', ar: 'Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠØ©' },
  sharqiya: { en: 'Sharqiya', ar: 'Ø§Ù„Ø´Ø±Ù‚ÙŠØ©' },
  dhofar: { en: 'Dhofar', ar: 'Ø¸ÙØ§Ø±' },
  batinah: { en: 'Batinah', ar: 'Ø§Ù„Ø¨Ø§Ø·Ù†Ø©' },
  dhahira: { en: 'Dhahira', ar: 'Ø§Ù„Ø¸Ø§Ù‡Ø±Ø©' },
  // Also add capitalized versions for lookup
  Muscat: { en: 'Muscat', ar: 'Ù…Ø³Ù‚Ø·' },
  Dakhiliya: { en: 'Dakhiliya', ar: 'Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠØ©' },
  Sharqiya: { en: 'Sharqiya', ar: 'Ø§Ù„Ø´Ø±Ù‚ÙŠØ©' },
  Dhofar: { en: 'Dhofar', ar: 'Ø¸ÙØ§Ø±' },
  Batinah: { en: 'Batinah', ar: 'Ø§Ù„Ø¨Ø§Ø·Ù†Ø©' },
  Dhahira: { en: 'Dhahira', ar: 'Ø§Ù„Ø¸Ø§Ù‡Ø±Ø©' },
};

export const CATEGORY_NAMES: Record<string, { en: string; ar: string }> = {
  mountain: { en: 'Mountain', ar: 'Ø¬Ø¨Ù„' },
  beach: { en: 'Beach', ar: 'Ø´Ø§Ø·Ø¦' },
  culture: { en: 'Culture', ar: 'Ø«Ù‚Ø§ÙØ©' },
  desert: { en: 'Desert', ar: 'ØµØ­Ø±Ø§Ø¡' },
  nature: { en: 'Nature', ar: 'Ø·Ø¨ÙŠØ¹Ø©' },
  food: { en: 'Food', ar: 'Ø·Ø¹Ø§Ù…' },
};

export const MONTHS = [
  { value: 1, en: 'January', ar: 'ÙŠÙ†Ø§ÙŠØ±' },
  { value: 2, en: 'February', ar: 'ÙØ¨Ø±Ø§ÙŠØ±' },
  { value: 3, en: 'March', ar: 'Ù…Ø§Ø±Ø³' },
  { value: 4, en: 'April', ar: 'Ø£Ø¨Ø±ÙŠÙ„' },
  { value: 5, en: 'May', ar: 'Ù…Ø§ÙŠÙˆ' },
  { value: 6, en: 'June', ar: 'ÙŠÙˆÙ†ÙŠÙˆ' },
  { value: 7, en: 'July', ar: 'ÙŠÙˆÙ„ÙŠÙˆ' },
  { value: 8, en: 'August', ar: 'Ø£ØºØ³Ø·Ø³' },
  { value: 9, en: 'September', ar: 'Ø³Ø¨ØªÙ…Ø¨Ø±' },
  { value: 10, en: 'October', ar: 'Ø£ÙƒØªÙˆØ¨Ø±' },
  { value: 11, en: 'November', ar: 'Ù†ÙˆÙÙ…Ø¨Ø±' },
  { value: 12, en: 'December', ar: 'Ø¯ÙŠØ³Ù…Ø¨Ø±' },
];


