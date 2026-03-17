/**
 * Destination Data Access Layer
 *
 * This module is the only place that reads the dataset file directly.
 * UI and planner modules should consume destinations via these helpers.
 */

import type { Category, Destination, LocalizedString, Region } from '@/types';
import destinationsData from '@/data/destinations.json';

export type DestinationSortBy =
  | 'crowd_level'
  | 'ticket_cost_omr'
  | 'avg_visit_duration_minutes'
  | 'name';

export type SortOrder = 'asc' | 'desc';

export interface DestinationFilterOptions {
  categories?: readonly Category[];
  regions?: readonly (Region | string)[];
  months?: readonly number[];
  ids?: readonly string[];
  minCrowdLevel?: number;
  maxCrowdLevel?: number;
  maxTicketCost?: number;
  searchQuery?: string;
}

const destinations: Destination[] = destinationsData as Destination[];

const destinationById = new Map(destinations.map((destination) => [destination.id, destination]));

const regionByLowercaseName = new Map<string, string>();
for (const destination of destinations) {
  regionByLowercaseName.set(destination.region.en.toLowerCase(), destination.region.en);
}

const uniqueRegions: LocalizedString[] = Array.from(
  new Map(destinations.map((destination) => [destination.region.en.toLowerCase(), destination.region])).values(),
);

const uniqueCategories: Category[] = Array.from(
  new Set(destinations.flatMap((destination) => destination.categories)),
) as Category[];

const uniqueRecommendedMonths: number[] = Array.from(
  new Set(destinations.flatMap((destination) => destination.recommended_months)),
).sort((left, right) => left - right);

function normalizeRegionName(region: string): string | undefined {
  return regionByLowercaseName.get(region.trim().toLowerCase());
}

function hasSearchMatch(destination: Destination, query: string): boolean {
  const normalizedQuery = query.toLowerCase();

  return (
    destination.name.en.toLowerCase().includes(normalizedQuery) ||
    destination.name.ar.includes(query) ||
    destination.region.en.toLowerCase().includes(normalizedQuery) ||
    destination.region.ar.includes(query) ||
    destination.company.en.toLowerCase().includes(normalizedQuery) ||
    destination.company.ar.includes(query)
  );
}

export function getAllDestinations(): Destination[] {
  return destinations;
}

export function getDestinationById(id: string): Destination | undefined {
  return destinationById.get(id);
}

export function getDestinationPaths(): { params: { id: string } }[] {
  return destinations.map((destination) => ({ params: { id: destination.id } }));
}

export function getFeaturedDestinations(count: number = 6): Destination[] {
  const ranked = [...destinations].sort((left, right) => {
    const crowdDifference = right.crowd_level - left.crowd_level;
    if (crowdDifference !== 0) {
      return crowdDifference;
    }

    const ticketDifference = left.ticket_cost_omr - right.ticket_cost_omr;
    if (ticketDifference !== 0) {
      return ticketDifference;
    }

    return left.id.localeCompare(right.id);
  });

  const featured: Destination[] = [];
  const usedRegions = new Set<string>();
  const usedCategories = new Set<Category>();

  for (const destination of ranked) {
    if (featured.length >= count) {
      break;
    }

    const regionKey = destination.region.en.toLowerCase();
    const introducesNewRegion = !usedRegions.has(regionKey);
    const introducesNewCategory = destination.categories.some((category) => !usedCategories.has(category));

    if (introducesNewRegion || introducesNewCategory || featured.length < Math.ceil(count / 2)) {
      featured.push(destination);
      usedRegions.add(regionKey);
      destination.categories.forEach((category) => usedCategories.add(category));
    }
  }

  for (const destination of ranked) {
    if (featured.length >= count) {
      break;
    }

    if (!featured.some((featuredDestination) => featuredDestination.id === destination.id)) {
      featured.push(destination);
    }
  }

  return featured;
}

export function filterDestinations(filters: DestinationFilterOptions = {}): Destination[] {
  const categorySet =
    filters.categories && filters.categories.length > 0 ? new Set(filters.categories) : null;
  const normalizedRegions = filters.regions
    && filters.regions.length > 0
    ? new Set(
        filters.regions
          .map((region) => normalizeRegionName(region.toString()))
          .filter((region): region is string => Boolean(region)),
      )
    : null;
  const monthSet = filters.months && filters.months.length > 0 ? new Set(filters.months) : null;
  const idSet = filters.ids ? new Set(filters.ids) : null;

  return destinations.filter((destination) => {
    if (idSet && !idSet.has(destination.id)) {
      return false;
    }

    if (categorySet && !destination.categories.some((category) => categorySet.has(category))) {
      return false;
    }

    if (normalizedRegions && !normalizedRegions.has(destination.region.en)) {
      return false;
    }

    if (monthSet && !destination.recommended_months.some((month) => monthSet.has(month))) {
      return false;
    }

    if (filters.minCrowdLevel !== undefined && destination.crowd_level < filters.minCrowdLevel) {
      return false;
    }

    if (filters.maxCrowdLevel !== undefined && destination.crowd_level > filters.maxCrowdLevel) {
      return false;
    }

    if (filters.maxTicketCost !== undefined && destination.ticket_cost_omr > filters.maxTicketCost) {
      return false;
    }

    if (filters.searchQuery && !hasSearchMatch(destination, filters.searchQuery)) {
      return false;
    }

    return true;
  });
}

export function sortDestinations(
  destinationsToSort: readonly Destination[],
  sortBy: DestinationSortBy,
  sortOrder: SortOrder = 'desc',
): Destination[] {
  return [...destinationsToSort].sort((left, right) => {
    let comparison = 0;

    if (sortBy === 'name') {
      comparison = left.name.en.localeCompare(right.name.en);
    } else {
      comparison = left[sortBy] - right[sortBy];
    }

    if (comparison === 0) {
      comparison = left.id.localeCompare(right.id);
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

export function getUniqueRegions(): LocalizedString[] {
  return uniqueRegions;
}

export function getUniqueCategories(): Category[] {
  return uniqueCategories;
}

export function getUniqueRecommendedMonths(): number[] {
  return uniqueRecommendedMonths;
}

export function getDestinationStats(): {
  total: number;
  byRegion: Record<string, number>;
  byCategory: Record<string, number>;
} {
  const byRegion: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const destination of destinations) {
    byRegion[destination.region.en] = (byRegion[destination.region.en] ?? 0) + 1;

    for (const category of destination.categories) {
      byCategory[category] = (byCategory[category] ?? 0) + 1;
    }
  }

  return {
    total: destinations.length,
    byRegion,
    byCategory,
  };
}

export function getRegionFromSlug(regionSlug: string): Region | undefined {
  const normalizedRegion = normalizeRegionName(regionSlug);
  return normalizedRegion as Region | undefined;
}
