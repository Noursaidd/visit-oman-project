'use client';

import { useState } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { CATEGORY_NAMES, REGION_NAMES, MONTHS } from '@/data/constants';
import type { Category, Region } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Filter, RotateCcw } from 'lucide-react';

interface FiltersProps {
  availableCategories: Category[];
  availableRegions: Region[];
  availableMonths: number[];
  selectedCategories: Category[];
  selectedRegions: Region[];
  selectedSeasons: number[];
  sortBy: 'crowd_level' | 'ticket_cost_omr';
  sortOrder: 'asc' | 'desc';
  onCategoryChange: (categories: Category[]) => void;
  onRegionChange: (regions: Region[]) => void;
  onSeasonChange: (seasons: number[]) => void;
  onSortChange: (sortBy: 'crowd_level' | 'ticket_cost_omr', sortOrder: 'asc' | 'desc') => void;
  onReset: () => void;
}

function getLabel(
  locale: 'en' | 'ar',
  key:
    | 'filters'
    | 'reset'
    | 'category'
    | 'region'
    | 'months'
    | 'sort'
    | 'apply'
    | 'popularity'
    | 'price',
) {
  if (locale === 'ar') {
    switch (key) {
      case 'filters':
        return '\u062A\u0635\u0641\u064A\u0629';
      case 'reset':
        return '\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646';
      case 'category':
        return '\u0627\u0644\u0641\u0626\u0629';
      case 'region':
        return '\u0627\u0644\u0645\u062D\u0627\u0641\u0638\u0647';
      case 'months':
        return '\u0627\u0644\u0645\u0648\u0633\u0645';
      case 'sort':
        return '\u062A\u0631\u062A\u064A\u0628 \u062D\u0633\u0628';
      case 'apply':
        return '\u062A\u0637\u0628\u064A\u0642';
      case 'popularity':
        return '\u0627\u0644\u0634\u0639\u0628\u064A\u0629';
      case 'price':
        return '\u0627\u0644\u0633\u0639\u0631';
      default:
        return '';
    }
  }

  switch (key) {
    case 'filters':
      return 'Filters';
    case 'reset':
      return 'Reset';
    case 'category':
      return 'Category';
    case 'region':
      return 'Region';
    case 'months':
      return 'Recommended Months';
    case 'sort':
      return 'Sort By';
    case 'apply':
      return 'Apply Filters';
    case 'popularity':
      return 'Popularity';
    case 'price':
      return 'Price';
    default:
      return '';
  }
}

function toggleSelection<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items.filter((entry) => entry !== item) : [...items, item];
}

export function DestinationFiltersDesktop({
  availableCategories,
  availableRegions,
  availableMonths,
  selectedCategories,
  selectedRegions,
  selectedSeasons,
  sortBy,
  sortOrder,
  onCategoryChange,
  onRegionChange,
  onSeasonChange,
  onSortChange,
  onReset,
}: FiltersProps) {
  const locale = usePlannerStore((state) => state.locale);
  const isRtl = locale === 'ar';

  const hasFilters = selectedCategories.length > 0 || selectedRegions.length > 0 || selectedSeasons.length > 0;
  const months = MONTHS.filter((month) => availableMonths.includes(month.value));

  return (
    <div className="hidden lg:block bg-white rounded-lg border p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Filter className="h-4 w-4" />
          {getLabel(locale, 'filters')}
        </h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="h-3 w-3 me-1" />
            {getLabel(locale, 'reset')}
          </Button>
        )}
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">{getLabel(locale, 'category')}</h4>
        <div className="flex flex-wrap gap-2">
          {availableCategories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategories.includes(category) ? 'default' : 'outline'}
              className={`cursor-pointer transition-colors ${
                selectedCategories.includes(category)
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => onCategoryChange(toggleSelection(selectedCategories, category))}
            >
              {locale === 'ar' ? CATEGORY_NAMES[category]?.ar : CATEGORY_NAMES[category]?.en}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">{getLabel(locale, 'region')}</h4>
        <div className="flex flex-wrap gap-2">
          {availableRegions.map((region) => (
            <Badge
              key={region}
              variant={selectedRegions.includes(region) ? 'default' : 'outline'}
              className={`cursor-pointer transition-colors ${
                selectedRegions.includes(region)
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => onRegionChange(toggleSelection(selectedRegions, region))}
            >
              {locale === 'ar' ? REGION_NAMES[region]?.ar : REGION_NAMES[region]?.en}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">{getLabel(locale, 'months')}</h4>
        <div className="flex flex-wrap gap-2">
          {months.map((month) => (
            <Badge
              key={month.value}
              variant={selectedSeasons.includes(month.value) ? 'default' : 'outline'}
              className={`cursor-pointer transition-colors ${
                selectedSeasons.includes(month.value)
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => onSeasonChange(toggleSelection(selectedSeasons, month.value))}
            >
              {locale === 'ar' ? month.ar : month.en.slice(0, 3)}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-600 mb-2">{getLabel(locale, 'sort')}</h4>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value) => onSortChange(value as typeof sortBy, sortOrder)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="crowd_level">{getLabel(locale, 'popularity')}</SelectItem>
              <SelectItem value="ticket_cost_omr">{getLabel(locale, 'price')}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '\u2191' : '\u2193'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DestinationFiltersMobile({
  availableCategories,
  availableRegions,
  availableMonths,
  selectedCategories,
  selectedRegions,
  selectedSeasons,
  sortBy,
  sortOrder,
  onCategoryChange,
  onRegionChange,
  onSeasonChange,
  onSortChange,
  onReset,
}: FiltersProps) {
  const locale = usePlannerStore((state) => state.locale);
  const isRtl = locale === 'ar';
  const [open, setOpen] = useState(false);

  const hasFilters = selectedCategories.length > 0 || selectedRegions.length > 0 || selectedSeasons.length > 0;
  const months = MONTHS.filter((month) => availableMonths.includes(month.value));

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            {getLabel(locale, 'filters')}
            {hasFilters && (
              <Badge variant="secondary" className="ms-1">
                {selectedCategories.length + selectedRegions.length + selectedSeasons.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side={isRtl ? 'left' : 'right'} dir={isRtl ? 'rtl' : 'ltr'}>
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>{getLabel(locale, 'filters')}</span>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={onReset}>
                  <RotateCcw className="h-3 w-3 me-1" />
                  {getLabel(locale, 'reset')}
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">{getLabel(locale, 'category')}</h4>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-colors ${
                      selectedCategories.includes(category)
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => onCategoryChange(toggleSelection(selectedCategories, category))}
                  >
                    {locale === 'ar' ? CATEGORY_NAMES[category]?.ar : CATEGORY_NAMES[category]?.en}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">{getLabel(locale, 'region')}</h4>
              <div className="flex flex-wrap gap-2">
                {availableRegions.map((region) => (
                  <Badge
                    key={region}
                    variant={selectedRegions.includes(region) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-colors ${
                      selectedRegions.includes(region)
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => onRegionChange(toggleSelection(selectedRegions, region))}
                  >
                    {locale === 'ar' ? REGION_NAMES[region]?.ar : REGION_NAMES[region]?.en}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">{getLabel(locale, 'months')}</h4>
              <div className="flex flex-wrap gap-2">
                {months.map((month) => (
                  <Badge
                    key={month.value}
                    variant={selectedSeasons.includes(month.value) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-colors ${
                      selectedSeasons.includes(month.value)
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => onSeasonChange(toggleSelection(selectedSeasons, month.value))}
                  >
                    {locale === 'ar' ? month.ar : month.en.slice(0, 3)}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">{getLabel(locale, 'sort')}</h4>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value) => onSortChange(value as typeof sortBy, sortOrder)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crowd_level">{getLabel(locale, 'popularity')}</SelectItem>
                    <SelectItem value="ticket_cost_omr">{getLabel(locale, 'price')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '\u2191' : '\u2193'}
                </Button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 start-4 end-4">
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={() => setOpen(false)}>
              {getLabel(locale, 'apply')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
