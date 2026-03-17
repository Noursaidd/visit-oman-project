'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  filterDestinations,
  getUniqueCategories,
  getUniqueRecommendedMonths,
  getUniqueRegions,
  sortDestinations,
} from '@/lib/data';
import { CATEGORY_NAMES, MONTHS, REGION_NAMES } from '@/data/constants';
import type { Category, Region } from '@/types';
import DestinationCard from '@/components/destinations/DestinationCard';
import { DestinationFiltersDesktop, DestinationFiltersMobile } from '@/components/destinations/DestinationFilters';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { usePlannerStore } from '@/store/plannerStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Grid3X3, List, MapPin, Search } from 'lucide-react';

export interface DestinationsInitialState {
  selectedCategories: Category[];
  selectedRegions: Region[];
  selectedSeasons: number[];
  sortBy: 'crowd_level' | 'ticket_cost_omr';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  showSaved: boolean;
}

function getCopy(
  locale: 'en' | 'ar',
  key: 'title' | 'available' | 'search' | 'clearAll' | 'emptyTitle' | 'emptyHint' | 'reset',
) {
  if (locale === 'ar') {
    switch (key) {
      case 'title':
        return '\u0627\u0644\u0648\u062C\u0647\u0627\u062A \u0627\u0644\u0633\u064A\u0627\u062D\u064A\u0629';
      case 'available':
        return '\u0648\u062C\u0647\u0629 \u0645\u062A\u0627\u062D\u0629';
      case 'search':
        return '\u0627\u0628\u062D\u062B \u0639\u0646 \u0648\u062C\u0647\u0629...';
      case 'clearAll':
        return '\u0645\u0633\u062D \u0627\u0644\u0643\u0644';
      case 'emptyTitle':
        return '\u0644\u0627 \u062A\u0648\u062C\u062F \u0648\u062C\u0647\u0627\u062A';
      case 'emptyHint':
        return '\u062C\u0631\u0628 \u062A\u0639\u062F\u064A\u0644 \u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u0628\u062D\u062B \u0623\u0648 \u0627\u0644\u062A\u0635\u0641\u064A\u0629';
      case 'reset':
        return '\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0641\u0644\u0627\u062A\u0631';
      default:
        return '';
    }
  }

  switch (key) {
    case 'title':
      return 'Destinations';
    case 'available':
      return 'destinations available';
    case 'search':
      return 'Search destinations...';
    case 'clearAll':
      return 'Clear all';
    case 'emptyTitle':
      return 'No destinations found';
    case 'emptyHint':
      return 'Try adjusting your search or filter criteria';
    case 'reset':
      return 'Reset Filters';
    default:
      return '';
  }
}

function toQueryString(state: {
  selectedCategories: Category[];
  selectedRegions: Region[];
  selectedSeasons: number[];
  sortBy: 'crowd_level' | 'ticket_cost_omr';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  showSaved: boolean;
}): string {
  const params = new URLSearchParams();

  if (!state.showSaved && state.selectedCategories.length > 0) {
    params.set('category', state.selectedCategories.join(','));
  }

  if (!state.showSaved && state.selectedRegions.length > 0) {
    params.set(
      'region',
      state.selectedRegions.map((region) => region.toLowerCase()).join(','),
    );
  }

  if (!state.showSaved && state.selectedSeasons.length > 0) {
    params.set('season', state.selectedSeasons.join(','));
  }

  params.set('sort', state.sortBy);
  params.set('order', state.sortOrder);

  const normalizedQuery = state.searchQuery.trim();
  if (!state.showSaved && normalizedQuery) {
    params.set('q', normalizedQuery);
  }

  if (state.showSaved) {
    params.set('saved', 'true');
  }

  return params.toString();
}

export default function DestinationsBrowseClient({
  initialState,
}: {
  initialState: DestinationsInitialState;
}) {
  const pathname = usePathname();
  const locale = usePlannerStore((state) => state.locale);
  const savedIds = usePlannerStore((state) => state.savedDestinationIds);

  const isRtl = locale === 'ar';
  const lastSyncedQueryRef = useRef('');

  const availableCategories = useMemo(() => getUniqueCategories(), []);
  const availableRegions = useMemo(
    () => getUniqueRegions().map((region) => region.en as Region),
    [],
  );
  const availableMonths = useMemo(() => getUniqueRecommendedMonths(), []);

  const [selectedCategories, setSelectedCategories] = useState<Category[]>(
    initialState.selectedCategories,
  );
  const [selectedRegions, setSelectedRegions] = useState<Region[]>(initialState.selectedRegions);
  const [selectedSeasons, setSelectedSeasons] = useState<number[]>(initialState.selectedSeasons);
  const [sortBy, setSortBy] = useState<'crowd_level' | 'ticket_cost_omr'>(initialState.sortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialState.sortOrder);
  const [searchQuery, setSearchQuery] = useState(initialState.searchQuery);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSaved, setShowSaved] = useState(initialState.showSaved);

  useEffect(() => {
    const nextQuery = toQueryString({
      selectedCategories,
      selectedRegions,
      selectedSeasons,
      sortBy,
      sortOrder,
      searchQuery,
      showSaved,
    });

    if (nextQuery === lastSyncedQueryRef.current) {
      return;
    }

    lastSyncedQueryRef.current = nextQuery;
    if (typeof window === 'undefined') {
      return;
    }

    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    window.history.replaceState(null, '', nextUrl);
  }, [pathname, searchQuery, selectedCategories, selectedRegions, selectedSeasons, showSaved, sortBy, sortOrder]);

  const filteredDestinations = useMemo(() => {
    const result = filterDestinations({
      categories: showSaved ? undefined : selectedCategories,
      regions: showSaved ? undefined : selectedRegions,
      months: showSaved ? undefined : selectedSeasons,
      ids: showSaved ? savedIds : undefined,
      searchQuery: showSaved ? '' : searchQuery,
    });

    return sortDestinations(result, sortBy, sortOrder);
  }, [
    savedIds,
    searchQuery,
    selectedCategories,
    selectedRegions,
    selectedSeasons,
    showSaved,
    sortBy,
    sortOrder,
  ]);

  const handleReset = () => {
    setSelectedCategories([]);
    setSelectedRegions([]);
    setSelectedSeasons([]);
    setSearchQuery('');
    setSortBy('crowd_level');
    setSortOrder('desc');
    setShowSaved(false);
  };

  const activeFilterCount = showSaved
    ? 0
    : selectedCategories.length + selectedRegions.length + selectedSeasons.length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{getCopy(locale, 'title')}</h1>
                <p className="text-gray-600 mt-1">
                  {filteredDestinations.length} {getCopy(locale, 'available')}
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder={getCopy(locale, 'search')}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="ps-10"
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="hidden lg:block w-64 flex-shrink-0">
              <DestinationFiltersDesktop
                availableCategories={availableCategories}
                availableRegions={availableRegions}
                availableMonths={availableMonths}
                selectedCategories={selectedCategories}
                selectedRegions={selectedRegions}
                selectedSeasons={selectedSeasons}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onCategoryChange={setSelectedCategories}
                onRegionChange={setSelectedRegions}
                onSeasonChange={setSelectedSeasons}
                onSortChange={(nextSortBy, nextSortOrder) => {
                  setSortBy(nextSortBy);
                  setSortOrder(nextSortOrder);
                }}
                onReset={handleReset}
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <DestinationFiltersMobile
                  availableCategories={availableCategories}
                  availableRegions={availableRegions}
                  availableMonths={availableMonths}
                  selectedCategories={selectedCategories}
                  selectedRegions={selectedRegions}
                  selectedSeasons={selectedSeasons}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onCategoryChange={setSelectedCategories}
                  onRegionChange={setSelectedRegions}
                  onSeasonChange={setSelectedSeasons}
                  onSortChange={(nextSortBy, nextSortOrder) => {
                    setSortBy(nextSortBy);
                    setSortOrder(nextSortOrder);
                  }}
                  onReset={handleReset}
                />

                <div className="hidden md:flex items-center gap-4">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-6 mt-4 lg:mt-4">
                  {selectedCategories.map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="gap-1 cursor-pointer hover:bg-red-100"
                      onClick={() =>
                        setSelectedCategories(
                          selectedCategories.filter((entry) => entry !== category),
                        )
                      }
                    >
                      {locale === 'ar' ? CATEGORY_NAMES[category]?.ar : CATEGORY_NAMES[category]?.en}
                      <span className="ms-1">{'\u00D7'}</span>
                    </Badge>
                  ))}
                  {selectedRegions.map((region) => (
                    <Badge
                      key={region}
                      variant="secondary"
                      className="gap-1 cursor-pointer hover:bg-red-100"
                      onClick={() =>
                        setSelectedRegions(selectedRegions.filter((entry) => entry !== region))
                      }
                    >
                      {locale === 'ar' ? REGION_NAMES[region]?.ar : REGION_NAMES[region]?.en}
                      <span className="ms-1">{'\u00D7'}</span>
                    </Badge>
                  ))}
                  {selectedSeasons.map((season) => (
                    <Badge
                      key={season}
                      variant="secondary"
                      className="gap-1 cursor-pointer hover:bg-red-100"
                      onClick={() =>
                        setSelectedSeasons(selectedSeasons.filter((entry) => entry !== season))
                      }
                    >
                      {locale === 'ar'
                        ? MONTHS.find((month) => month.value === season)?.ar ?? season
                        : MONTHS.find((month) => month.value === season)?.en.slice(0, 3) ?? season}
                      <span className="ms-1">{'\u00D7'}</span>
                    </Badge>
                  ))}
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    {getCopy(locale, 'clearAll')}
                  </Button>
                </div>
              )}

              {filteredDestinations.length > 0 ? (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid sm:grid-cols-2 xl:grid-cols-3 gap-6'
                      : 'flex flex-col gap-6'
                  }
                >
                  {filteredDestinations.map((destination) => (
                    <DestinationCard key={destination.id} destination={destination} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {getCopy(locale, 'emptyTitle')}
                  </h3>
                  <p className="text-gray-500 mb-4">{getCopy(locale, 'emptyHint')}</p>
                  <Button onClick={handleReset}>{getCopy(locale, 'reset')}</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
