import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Itinerary, 
  PlannerInputs, 
  BudgetTier, 
  TravelIntensity, 
  Category,
  Locale 
} from '@/types';
import { generateItinerary } from '@/lib/planner';
import { getUniqueCategories } from '@/lib/data';

/**
 * Planner Store
 * 
 * Manages all state for the trip planning feature:
 * - User inputs
 * - Saved interests
 * - Generated itinerary
 * - Locale preference
 * 
 * Uses Zustand with persist middleware for LocalStorage persistence.
 */

interface PlannerState {
  // Locale
  locale: Locale;
  setLocale: (locale: Locale) => void;
  
  // Saved interests
  savedDestinationIds: string[];
  addSavedDestination: (id: string) => void;
  removeSavedDestination: (id: string) => void;
  clearSavedDestinations: () => void;
  isSaved: (id: string) => boolean;
  
  // Planner inputs
  inputs: PlannerInputs;
  setTripDuration: (days: number) => void;
  setBudgetTier: (tier: BudgetTier) => void;
  setTravelMonth: (month: number) => void;
  setTravelIntensity: (intensity: TravelIntensity) => void;
  setPreferredCategories: (categories: Category[]) => void;
  toggleCategory: (category: Category) => void;
  resetInputs: () => void;
  
  // Itinerary
  itinerary: Itinerary | null;
  isGenerating: boolean;
  generatePlan: () => void;
  clearItinerary: () => void;
  
  // UI state
  currentDayInView: number;
  setCurrentDayInView: (day: number) => void;
}

const defaultInputs: PlannerInputs = {
  tripDuration: 3,
  budgetTier: 'medium',
  travelMonth: new Date().getMonth() + 1,
  travelIntensity: 'balanced',
  preferredCategories: [],
  savedDestinationIds: [],
};

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      // Locale
      locale: 'en',
      setLocale: (locale) => set({ locale }),
      
      // Saved interests
      savedDestinationIds: [],
      addSavedDestination: (id) => set((state) => {
        if (state.savedDestinationIds.includes(id)) return state;
        return { 
          savedDestinationIds: [...state.savedDestinationIds, id],
          inputs: {
            ...state.inputs,
            savedDestinationIds: [...state.inputs.savedDestinationIds, id]
          }
        };
      }),
      removeSavedDestination: (id) => set((state) => ({
        savedDestinationIds: state.savedDestinationIds.filter((i) => i !== id),
        inputs: {
          ...state.inputs,
          savedDestinationIds: state.inputs.savedDestinationIds.filter((i) => i !== id)
        }
      })),
      clearSavedDestinations: () => set((state) => ({
        savedDestinationIds: [],
        inputs: { ...state.inputs, savedDestinationIds: [] }
      })),
      isSaved: (id) => get().savedDestinationIds.includes(id),
      
      // Planner inputs
      inputs: defaultInputs,
      setTripDuration: (days) => set((state) => ({
        inputs: { ...state.inputs, tripDuration: days }
      })),
      setBudgetTier: (tier) => set((state) => ({
        inputs: { ...state.inputs, budgetTier: tier }
      })),
      setTravelMonth: (month) => set((state) => ({
        inputs: { ...state.inputs, travelMonth: month }
      })),
      setTravelIntensity: (intensity) => set((state) => ({
        inputs: { ...state.inputs, travelIntensity: intensity }
      })),
      setPreferredCategories: (categories) => set((state) => ({
        inputs: { ...state.inputs, preferredCategories: categories }
      })),
      toggleCategory: (category) => set((state) => {
        const current = state.inputs.preferredCategories;
        const exists = current.includes(category);
        return {
          inputs: {
            ...state.inputs,
            preferredCategories: exists
              ? current.filter((c) => c !== category)
              : [...current, category]
          }
        };
      }),
      resetInputs: () => set({
        inputs: { ...defaultInputs, savedDestinationIds: get().savedDestinationIds }
      }),
      
      // Itinerary
      itinerary: null,
      isGenerating: false,
      generatePlan: () => {
        const state = get();
        set({ isGenerating: true });
        
        try {
          const inputs: PlannerInputs = {
            ...state.inputs,
            savedDestinationIds: state.savedDestinationIds,
          };
          
          // Ensure at least one category is selected
          if (inputs.preferredCategories.length === 0) {
            inputs.preferredCategories = getUniqueCategories().slice(0, 2);
          }
          
          const itinerary = generateItinerary(inputs);
          set({ itinerary, isGenerating: false });
        } catch (error) {
          console.error('Failed to generate itinerary:', error);
          set({ isGenerating: false });
        }
      },
      clearItinerary: () => set({ itinerary: null }),
      
      // UI state
      currentDayInView: 1,
      setCurrentDayInView: (day) => set({ currentDayInView: day }),
    }),
    {
      name: 'oman-planner-storage',
      partialize: (state) => ({
        locale: state.locale,
        savedDestinationIds: state.savedDestinationIds,
        inputs: state.inputs,
        itinerary: state.itinerary,
      }),
    }
  )
);
