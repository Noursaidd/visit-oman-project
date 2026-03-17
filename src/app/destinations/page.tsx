import DestinationsBrowseClient, {
  type DestinationsInitialState,
} from '@/components/destinations/DestinationsBrowseClient';
import {
  getRegionFromSlug,
  getUniqueCategories,
  getUniqueRecommendedMonths,
  getUniqueRegions,
} from '@/lib/data';
import type { Category, Region } from '@/types';

type SearchParamValue = string | string[] | undefined;

const DEFAULT_SORT_BY: DestinationsInitialState['sortBy'] = 'crowd_level';
const DEFAULT_SORT_ORDER: DestinationsInitialState['sortOrder'] = 'desc';

function toSingle(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseCsv(rawValue: string | undefined): string[] {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseCategories(rawValue: string | undefined): Category[] {
  const allowed = new Set(getUniqueCategories());
  return parseCsv(rawValue).filter((value): value is Category => allowed.has(value as Category));
}

function parseRegions(rawValue: string | undefined): Region[] {
  const allowed = new Set(getUniqueRegions().map((region) => region.en as Region));

  return parseCsv(rawValue)
    .map((slug) => getRegionFromSlug(slug))
    .filter((region): region is Region => {
      if (!region) {
        return false;
      }

      return allowed.has(region);
    });
}

function parseSeasons(rawValue: string | undefined): number[] {
  const allowed = new Set(getUniqueRecommendedMonths());

  return parseCsv(rawValue)
    .map((value) => Number(value))
    .filter((month) => Number.isInteger(month) && allowed.has(month));
}

function parseSortBy(rawValue: string | undefined): DestinationsInitialState['sortBy'] {
  return rawValue === 'ticket_cost_omr' ? 'ticket_cost_omr' : DEFAULT_SORT_BY;
}

function parseSortOrder(rawValue: string | undefined): DestinationsInitialState['sortOrder'] {
  return rawValue === 'asc' ? 'asc' : DEFAULT_SORT_ORDER;
}

function buildStateKey(state: DestinationsInitialState): string {
  return [
    state.selectedCategories.join(','),
    state.selectedRegions.join(','),
    state.selectedSeasons.join(','),
    state.sortBy,
    state.sortOrder,
    state.searchQuery,
    state.showSaved ? 'saved' : 'all',
  ].join('|');
}

interface DestinationsPageProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}


export default async function DestinationsPage({ searchParams }: DestinationsPageProps) {
  const params = await searchParams;

  const initialState: DestinationsInitialState = {
    selectedCategories: parseCategories(toSingle(params.category)),
    selectedRegions: parseRegions(toSingle(params.region)),
    selectedSeasons: parseSeasons(toSingle(params.season)),
    sortBy: parseSortBy(toSingle(params.sort)),
    sortOrder: parseSortOrder(toSingle(params.order)),
    searchQuery: toSingle(params.q)?.trim() ?? '',
    showSaved: toSingle(params.saved) === 'true',
  };

  return (
    <DestinationsBrowseClient
      key={buildStateKey(initialState)}
      initialState={initialState}
    />
  );
}
