'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { 
  getFeaturedDestinations, 
  getUniqueCategories,
  getUniqueRegions,
  getDestinationStats 
} from '@/lib/data';
import { CATEGORY_NAMES } from '@/data/constants';
import type { Category, Locale } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mountain, 
  Palmtree, 
  Building2, 
  Sun, 
  Leaf, 
  UtensilsCrossed,
  MapPin,
  Calendar,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { usePlannerStore } from '@/store/plannerStore';

// Icon mapping for categories
const categoryIcons: Record<Category, React.ElementType> = {
  mountain: Mountain,
  beach: Palmtree,
  culture: Building2,
  desert: Sun,
  nature: Leaf,
  food: UtensilsCrossed,
};

function getCopy(
  locale: Locale,
  key:
    | 'vision'
    | 'heroTitle'
    | 'heroSubtitle'
    | 'exploreDestinations'
    | 'planTrip'
    | 'exploreByCategory'
    | 'categorySubtitle'
    | 'destinationsLabel'
    | 'featuredTitle'
    | 'featuredSubtitle'
    | 'viewAll'
    | 'freeEntry'
    | 'viewAllDestinations'
    | 'exploreByRegion'
    | 'regionSubtitle'
    | 'readyTitle'
    | 'readySubtitle'
    | 'startPlanningNow',
) {
  if (locale === 'ar') {
    switch (key) {
      case 'vision':
        return '\u0631\u0624\u064A\u0629 \u0639\u0645\u0627\u0646 2040';
      case 'heroTitle':
        return '\u0627\u0643\u062A\u0634\u0641 \u062C\u0645\u0627\u0644 \u0639\u0645\u0627\u0646';
      case 'heroSubtitle':
        return '\u0645\u0646 \u0627\u0644\u062C\u0628\u0627\u0644 \u0627\u0644\u0634\u0627\u0645\u062E\u0629 \u0625\u0644\u0649 \u0627\u0644\u0634\u0648\u0627\u0637\u0626 \u0627\u0644\u062E\u0644\u0627\u0628\u0629\u060C \u0627\u0633\u062A\u0643\u0634\u0641 \u062A\u062C\u0627\u0631\u0628 \u0639\u0631\u0628\u064A\u0629 \u0623\u0635\u064A\u0644\u0629 \u0648\u062E\u0637\u0637 \u0631\u062D\u0644\u062A\u0643 \u0627\u0644\u0645\u062B\u0627\u0644\u064A\u0629';
      case 'exploreDestinations':
        return '\u0627\u0633\u062A\u0643\u0634\u0641 \u0627\u0644\u0648\u062C\u0647\u0627\u062A';
      case 'planTrip':
        return '\u062E\u0637\u0637 \u0631\u062D\u0644\u062A\u0643';
      case 'exploreByCategory':
        return '\u0627\u0633\u062A\u0643\u0634\u0641 \u062D\u0633\u0628 \u0627\u0644\u0641\u0626\u0629';
      case 'categorySubtitle':
        return '\u0627\u0643\u062A\u0634\u0641 \u062A\u0646\u0648\u0639 \u0645\u0639\u0627\u0644\u0645 \u0639\u0645\u0627\u0646 \u0645\u0646 \u0627\u0644\u062C\u0628\u0627\u0644 \u0627\u0644\u0634\u0627\u0645\u062E\u0629 \u0625\u0644\u0649 \u0627\u0644\u0635\u062D\u0627\u0631\u064A \u0627\u0644\u0630\u0647\u0628\u064A\u0629';
      case 'destinationsLabel':
        return '\u0648\u062C\u0647\u0627\u062A';
      case 'featuredTitle':
        return '\u0648\u062C\u0647\u0627\u062A \u0645\u0645\u064A\u0632\u0629';
      case 'featuredSubtitle':
        return '\u062A\u062C\u0627\u0631\u0628 \u0645\u062E\u062A\u0627\u0631\u0629 \u0644\u0631\u062D\u0644\u062A\u0643';
      case 'viewAll':
        return '\u0639\u0631\u0636 \u0627\u0644\u0643\u0644';
      case 'freeEntry':
        return '\u062F\u062E\u0648\u0644 \u0645\u062C\u0627\u0646\u064A';
      case 'viewAllDestinations':
        return '\u0639\u0631\u0636 \u062C\u0645\u064A\u0639 \u0627\u0644\u0648\u062C\u0647\u0627\u062A';
      case 'exploreByRegion':
        return '\u0627\u0633\u062A\u0643\u0634\u0641 \u062D\u0633\u0628 \u0627\u0644\u0645\u062D\u0627\u0641\u0638\u0647';
      case 'regionSubtitle':
        return '\u0643\u0644 \u0645\u062D\u0627\u0641\u0638\u0647 \u062A\u0642\u062F\u0645 \u062A\u062C\u0627\u0631\u0628 \u0648\u0645\u0639\u0627\u0644\u0645 \u0641\u0631\u064A\u062F\u0629';
      case 'readyTitle':
        return '\u0647\u0644 \u0623\u0646\u062A \u0645\u0633\u062A\u0639\u062F \u0644\u062A\u062E\u0637\u064A\u0637 \u0645\u063A\u0627\u0645\u0631\u062A\u0643\u061F';
      case 'readySubtitle':
        return '\u0627\u0633\u062A\u062E\u062F\u0645 \u0645\u062E\u0637\u0637 \u0627\u0644\u0631\u062D\u0644\u0627\u062A \u0627\u0644\u0630\u0643\u064A \u0644\u0625\u0646\u0634\u0627\u0621 \u0628\u0631\u0646\u0627\u0645\u062C \u0645\u062E\u0635\u0635 \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u062A\u0641\u0636\u064A\u0644\u0627\u062A\u0643 \u0648\u0642\u064A\u0648\u062F\u0643';
      case 'startPlanningNow':
        return '\u0627\u0628\u062F\u0623 \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0622\u0646';
      default:
        return '';
    }
  }

  switch (key) {
    case 'vision':
      return 'Oman Vision 2040';
    case 'heroTitle':
      return 'Discover the Beauty of Oman';
    case 'heroSubtitle':
      return 'From majestic mountains to pristine beaches, explore authentic Arabian experiences and plan your perfect journey';
    case 'exploreDestinations':
      return 'Explore Destinations';
    case 'planTrip':
      return 'Plan Your Trip';
    case 'exploreByCategory':
      return 'Explore by Category';
    case 'categorySubtitle':
      return "Discover Oman's diverse attractions from towering mountains to golden deserts";
    case 'destinationsLabel':
      return 'destinations';
    case 'featuredTitle':
      return 'Featured Destinations';
    case 'featuredSubtitle':
      return 'Handpicked experiences for your journey';
    case 'viewAll':
      return 'View All';
    case 'freeEntry':
      return 'Free Entry';
    case 'viewAllDestinations':
      return 'View All Destinations';
    case 'exploreByRegion':
      return 'Explore by Region';
    case 'regionSubtitle':
      return 'Each region offers unique experiences and attractions';
    case 'readyTitle':
      return 'Ready to Plan Your Adventure?';
    case 'readySubtitle':
      return 'Use our intelligent trip planner to create a personalized itinerary based on your preferences and constraints';
    case 'startPlanningNow':
      return 'Start Planning Now';
    default:
      return '';
  }
}

function getDurationLabel(minutes: number, locale: Locale): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (locale === 'ar') {
      return remainingMinutes > 0
        ? `${hours} \u0633 ${remainingMinutes} \u062F`
        : `${hours} \u0633`;
    }

    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  return locale === 'ar' ? `${minutes} \u062F\u0642\u064A\u0642\u0629` : `${minutes} min`;
}

export default function HomePage() {
  const locale = usePlannerStore((state) => state.locale);
  const isRtl = locale === 'ar';

  const featuredDestinations = useMemo(() => getFeaturedDestinations(6), []);
  const categories = useMemo(() => getUniqueCategories(), []);
  const stats = useMemo(() => getDestinationStats(), []);
  const regions = useMemo(() => getUniqueRegions(), []);
  
  return (
    <div className="min-h-screen flex flex-col">

      <Header />
      <section className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white">
        <div className="absolute inset-0 bg-black/5" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-5xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
              <Sparkles className="h-3 w-3 me-1" />
              {getCopy(locale, 'vision')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {getCopy(locale, 'heroTitle')}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              {getCopy(locale, 'heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/destinations">
                <Button size="lg" variant="secondary" className="gap-2 px-8">
                  <MapPin className="h-5 w-5" />
                  {getCopy(locale, 'exploreDestinations')}
                </Button>
              </Link>
              <Link href="/plan">
                <Button size="lg" className="gap-2 px-8 bg-white text-emerald-700 hover:bg-white/90">
                  <Calendar className="h-5 w-5" />
                  {getCopy(locale, 'planTrip')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {getCopy(locale, 'exploreByCategory')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {getCopy(locale, 'categorySubtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => {
              const Icon = categoryIcons[category];
              const count = stats.byCategory[category] || 0;
              
              return (
                <Link
                  key={category}
                  href={`/destinations?category=${category}`}
                  className="group"
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-emerald-500">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {locale === 'ar' ? CATEGORY_NAMES[category]?.ar : CATEGORY_NAMES[category]?.en}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {count} {getCopy(locale, 'destinationsLabel')}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* Featured Destinations */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {getCopy(locale, 'featuredTitle')}
              </h2>
              <p className="text-lg text-gray-600">
                {getCopy(locale, 'featuredSubtitle')}
              </p>
            </div>
            <Link href="/destinations" className="hidden md:flex">
              <Button variant="outline" className="gap-2">
                {getCopy(locale, 'viewAll')}
                <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDestinations.map((destination) => (
              <Link
                key={destination.id}
                href={`/destinations/${destination.id}`}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                  {/* Image placeholder with gradient */}
                  <div 
                    className="h-48 relative"
                    style={{
                      background: `linear-gradient(135deg, ${
                        destination.categories.includes('beach') ? '#2980b9, #3498db' :
                        destination.categories.includes('mountain') ? '#4a7c59, #6b8e23' :
                        destination.categories.includes('desert') ? '#d4a574, #c19a6b' :
                        destination.categories.includes('culture') ? '#8e44ad, #9b59b6' :
                        '#27ae60, #2ecc71'
                      })`
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-4xl font-bold opacity-30">
                        {(locale === 'ar' ? destination.name.ar : destination.name.en).charAt(0)}
                      </span>
                    </div>
                    <div className="absolute top-3 start-3 flex gap-2">
                      {destination.categories.slice(0, 2).map((cat) => (
                        <Badge 
                          key={cat} 
                          variant="secondary" 
                          className="bg-white/90 text-gray-800"
                        >
                          {locale === 'ar' ? CATEGORY_NAMES[cat]?.ar : CATEGORY_NAMES[cat]?.en}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <CardContent className="p-5">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                      {locale === 'ar' ? destination.name.ar : destination.name.en}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                      <MapPin className="h-4 w-4" />
                      <span>{locale === 'ar' ? destination.region.ar : destination.region.en}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {getDurationLabel(destination.avg_visit_duration_minutes, locale)}
                      </span>
                      <span className={`font-medium ${destination.ticket_cost_omr === 0 ? 'text-emerald-600' : 'text-gray-700'}`}>
                        {destination.ticket_cost_omr === 0
                          ? getCopy(locale, 'freeEntry')
                          : `${destination.ticket_cost_omr} OMR`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/destinations">
              <Button variant="outline" className="gap-2">
                {getCopy(locale, 'viewAllDestinations')}
                <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Regions Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {getCopy(locale, 'exploreByRegion')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {getCopy(locale, 'regionSubtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((region) => {
              const count = stats.byRegion[region.en] || 0;
              const regionName = locale === 'ar' ? region.ar : region.en;
              const regionSlug = region.en.toLowerCase();
              
              return (
                <Link
                  key={region.en}
                  href={`/destinations?region=${regionSlug}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div 
                      className="h-32 relative"
                      style={{
                        background: `linear-gradient(135deg, ${
                          regionSlug === 'muscat' ? '#1a365d, #2c5282' :
                          regionSlug === 'dhofar' ? '#234e52, #285e61' :
                          regionSlug === 'dakhiliya' ? '#553c9a, #6b46c1' :
                          regionSlug === 'sharqiya' ? '#975a16, #b7791f' :
                          regionSlug === 'batinah' ? '#276749, #2f855a' :
                          '#744210, #975a16'
                        })`
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold opacity-30">
                          {regionName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                            {regionName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {count} {getCopy(locale, 'destinationsLabel')}
                          </p>
                        </div>
                        <ArrowRight
                          className={`h-5 w-5 text-gray-400 group-hover:text-emerald-500 transition-colors ${isRtl ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {getCopy(locale, 'readyTitle')}
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            {getCopy(locale, 'readySubtitle')}
          </p>
          <Link href="/plan">
            <Button size="lg" className="gap-2 px-10 bg-white text-emerald-700 hover:bg-white/90">
              <Calendar className="h-5 w-5" />
              {getCopy(locale, 'startPlanningNow')}
            </Button>
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
