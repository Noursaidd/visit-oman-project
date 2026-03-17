// Core destination types
export type Region = 'Muscat' | 'Dakhiliya' | 'Sharqiya' | 'Dhofar' | 'Batinah' | 'Dhahira';
export type Category = 'mountain' | 'beach' | 'culture' | 'desert' | 'nature' | 'food';
export type BudgetTier = 'low' | 'medium' | 'luxury';
export type TravelIntensity = 'relaxed' | 'balanced' | 'packed';

export interface LocalizedString {
  en: string;
  ar: string;
}

export interface Destination {
  id: string;
  name: LocalizedString;
  lat: number;
  lng: number;
  region: LocalizedString;
  categories: Category[];
  company: LocalizedString;
  avg_visit_duration_minutes: number;
  ticket_cost_omr: number;
  recommended_months: number[];
  crowd_level: 1 | 2 | 3 | 4 | 5;
}

// Planner input types
export interface PlannerInputs {
  tripDuration: number; // 1-7 days
  budgetTier: BudgetTier;
  travelMonth: number; // 1-12
  travelIntensity: TravelIntensity;
  preferredCategories: Category[];
  savedDestinationIds: string[];
}

// Scoring types
export interface ScoredDestination extends Destination {
  score: number;
  scoreBreakdown: {
    interest: number;
    season: number;
    crowd: number;
    cost: number;
    detour: number;
    diversity: number;
  };
}

// Route types
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RouteStop {
  destination: Destination;
  arrivalTime: string; // HH:MM format
  departureTime: string;
  duration: number; // minutes
  travelDistanceFromPrevious: number; // km
  scoreBreakdown: ScoredDestination['scoreBreakdown'];
}

export interface DaySchedule {
  dayNumber: number;
  region: Region;
  stops: RouteStop[];
  totalDistance: number; // km
  totalVisitTime: number; // minutes
  totalDrivingTime: number; // estimated minutes
}

export interface RegionAllocation {
  region: Region;
  startDay: number;
  endDay: number;
  dayCount: number;
}

// Itinerary output types
export interface Itinerary {
  inputs: PlannerInputs;
  regionAllocations: RegionAllocation[];
  daySchedules: DaySchedule[];
  totalDistance: number;
  totalCost: CostBreakdown;
  generatedAt: string;
}

export interface CostBreakdown {
  fuel: number;
  tickets: number;
  food: number;
  accommodation: number;
  total: number;
  isOverBudget: boolean;
  budgetThreshold: number;
}

// Filter types for destination browsing
export interface DestinationFilters {
  categories: Category[];
  regions: Region[];
  seasons: number[]; // months 1-12
  sortBy: 'crowd_level' | 'ticket_cost_omr';
  sortOrder: 'asc' | 'desc';
}

// Local storage types
export interface SavedInterests {
  destinationIds: string[];
  savedAt: string;
}

// Language types
export type Locale = 'en' | 'ar';

export interface AppState {
  locale: Locale;
  savedInterests: string[];
  currentItinerary: Itinerary | null;
}
