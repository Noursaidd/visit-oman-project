'use client';

import { useMemo } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { CATEGORY_NAMES, REGION_NAMES, MONTHS, INTENSITY_LIMITS, BUDGET_CONFIG } from '@/data/constants';
import { getAllDestinations, getUniqueCategories } from '@/lib/data';
import type { DaySchedule } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  MapPin,
  Calendar,
  Wallet,
  Gauge,
  Heart,
  Sparkles,
  Clock,
  Car,
  Ticket,
  Coffee,
  Bed,
  RotateCcw,
  Download,
  Mountain,
  Palmtree,
  Building2,
  Sun,
  Leaf,
  UtensilsCrossed
} from 'lucide-react';
import { exportItinerary } from '@/lib/planner';

// Category icons
const categoryIcons: Record<string, React.ElementType> = {
  mountain: Mountain,
  beach: Palmtree,
  culture: Building2,
  desert: Sun,
  nature: Leaf,
  food: UtensilsCrossed,
};

export default function PlannerPage() {
  const locale = usePlannerStore((state) => state.locale);
  const inputs = usePlannerStore((state) => state.inputs);
  const savedIds = usePlannerStore((state) => state.savedDestinationIds);
  const itinerary = usePlannerStore((state) => state.itinerary);
  const isGenerating = usePlannerStore((state) => state.isGenerating);
  const currentDayInView = usePlannerStore((state) => state.currentDayInView);
  
  const setTripDuration = usePlannerStore((state) => state.setTripDuration);
  const setBudgetTier = usePlannerStore((state) => state.setBudgetTier);
  const setTravelMonth = usePlannerStore((state) => state.setTravelMonth);
  const setTravelIntensity = usePlannerStore((state) => state.setTravelIntensity);
  const toggleCategory = usePlannerStore((state) => state.toggleCategory);
  const generatePlan = usePlannerStore((state) => state.generatePlan);
  const resetInputs = usePlannerStore((state) => state.resetInputs);
  const clearItinerary = usePlannerStore((state) => state.clearItinerary);
  const setCurrentDayInView = usePlannerStore((state) => state.setCurrentDayInView);
  
  const destinations = useMemo(() => getAllDestinations(), []);
  const categories = useMemo(() => getUniqueCategories(), []);
  
  // Get saved destinations
  const savedDestinations = useMemo(
    () => destinations.filter((destination) => savedIds.includes(destination.id)),
    [destinations, savedIds],
  );
  
  const handleExport = () => {
    if (itinerary) {
      const text = exportItinerary(itinerary);
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oman-itinerary-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1">
        {/* Page Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {locale === 'ar' ? 'خطط رحلتك' : 'Plan Your Trip'}
              </h1>
              <p className="text-lg text-white/90">
                {locale === 'ar'
                  ? 'أخبرنا عن تفضيلاتك وسننشئ لك برنامج رحلة مخصص'
                  : 'Tell us your preferences and we\'ll create a personalized itinerary for you'
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Input Form */}
            <div className="lg:col-span-1 space-y-6">
              {/* Trip Duration */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-emerald-500" />
                    {locale === 'ar' ? 'مدة الرحلة' : 'Trip Duration'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl font-bold text-emerald-600">
                      {inputs.tripDuration}
                    </span>
                    <span className="text-gray-500">
                      {locale === 'ar' ? 'أيام' : 'days'}
                    </span>
                  </div>
                  <Slider
                    value={[inputs.tripDuration]}
                    min={1}
                    max={7}
                    step={1}
                    onValueChange={([value]) => setTripDuration(value)}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1</span>
                    <span>7</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Budget Tier */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wallet className="h-5 w-5 text-emerald-500" />
                    {locale === 'ar' ? 'مستوى الميزانية' : 'Budget Tier'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'luxury'] as const).map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setBudgetTier(tier)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          inputs.budgetTier === tier
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">
                          {tier === 'low' ? (locale === 'ar' ? 'اقتصادي' : 'Budget') :
                           tier === 'medium' ? (locale === 'ar' ? 'متوسط' : 'Comfort') :
                           (locale === 'ar' ? 'فاخر' : 'Luxury')
                          }
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ~{BUDGET_CONFIG.budgetThresholds[tier]} OMR
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Travel Month */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-emerald-500" />
                    {locale === 'ar' ? 'شهر السفر' : 'Travel Month'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={inputs.travelMonth.toString()}
                    onValueChange={(value) => setTravelMonth(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {locale === 'ar' ? month.ar : month.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              
              {/* Travel Intensity */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Gauge className="h-5 w-5 text-emerald-500" />
                    {locale === 'ar' ? 'نمط السفر' : 'Travel Style'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {(['relaxed', 'balanced', 'packed'] as const).map((intensity) => (
                      <button
                        key={intensity}
                        onClick={() => setTravelIntensity(intensity)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          inputs.travelIntensity === intensity
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">
                          {intensity === 'relaxed' ? (locale === 'ar' ? 'مريح' : 'Relaxed') :
                           intensity === 'balanced' ? (locale === 'ar' ? 'متوازن' : 'Balanced') :
                           (locale === 'ar' ? 'مكثف' : 'Packed')
                          }
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {INTENSITY_LIMITS[intensity]} {locale === 'ar' ? 'محطات/يوم' : 'stops/day'}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Categories */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="h-5 w-5 text-emerald-500" />
                    {locale === 'ar' ? 'الاهتمامات' : 'Interests'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const Icon = categoryIcons[cat];
                      const isSelected = inputs.preferredCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {Icon && <Icon className="h-4 w-4" />}
                          <span className="text-sm font-medium">
                            {locale === 'ar' ? CATEGORY_NAMES[cat]?.ar : CATEGORY_NAMES[cat]?.en}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              {/* Saved Destinations */}
              {savedDestinations.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Heart className="h-5 w-5 text-red-500" />
                      {locale === 'ar' ? 'وجهاتك المحفوظة' : 'Your Saved Destinations'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {savedDestinations.slice(0, 5).map((dest) => (
                        <div 
                          key={dest.id}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                        >
                          <MapPin className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm font-medium">{dest.name.en}</span>
                        </div>
                      ))}
                      {savedDestinations.length > 5 && (
                        <p className="text-sm text-gray-500">
                          +{savedDestinations.length - 5} more
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 h-14 text-lg gap-2 bg-emerald-500 hover:bg-emerald-600"
                  onClick={generatePlan}
                  disabled={isGenerating || inputs.preferredCategories.length === 0}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      {locale === 'ar' ? 'جاري الإنشاء...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      {locale === 'ar' ? 'أنشئ البرنامج' : 'Generate Itinerary'}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14"
                  onClick={() => { resetInputs(); clearItinerary(); }}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Results */}
            <div className="lg:col-span-2">
              {itinerary ? (
                <ItineraryResults 
                  itinerary={itinerary} 
                  locale={locale}
                  currentDayInView={currentDayInView}
                  setCurrentDayInView={setCurrentDayInView}
                  onExport={handleExport}
                />
              ) : (
                <Card className="h-full flex items-center justify-center min-h-[600px]">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      {locale === 'ar' ? 'لم يتم إنشاء برنامج بعد' : 'No Itinerary Yet'}
                    </h3>
                    <p className="text-gray-500 max-w-md">
                      {locale === 'ar'
                        ? 'اختر تفضيلاتك واضغط على "أنشئ البرنامج" لبدء التخطيط'
                        : 'Select your preferences and click "Generate Itinerary" to start planning'
                      }
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

// Itinerary Results Component
function ItineraryResults({ 
  itinerary, 
  locale,
  currentDayInView,
  setCurrentDayInView,
  onExport
}: { 
  itinerary: NonNullable<ReturnType<typeof usePlannerStore.getState>['itinerary']>;
  locale: string;
  currentDayInView: number;
  setCurrentDayInView: (day: number) => void;
  onExport: () => void;
}) {
  const { daySchedules, regionAllocations, totalDistance, totalCost, inputs } = itinerary;
  
  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {locale === 'ar' ? 'برنامجك' : 'Your Itinerary'}
              </h2>
              <p className="text-gray-500 mt-1">
                {inputs.tripDuration} {locale === 'ar' ? 'أيام' : 'days'} • {' '}
                {regionAllocations.length} {locale === 'ar' ? '\u0627\u0644\u0645\u062D\u0627\u0641\u0638\u0627\u062A' : 'regions'}
              </p>
            </div>
            <Button onClick={onExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              {locale === 'ar' ? 'تصدير' : 'Export'}
            </Button>
          </div>
          
          {/* Region Overview */}
          <div className="mt-6 flex flex-wrap gap-3">
            {regionAllocations.map((alloc) => (
              <Badge 
                key={alloc.region} 
                variant="outline"
                className="px-4 py-2 text-sm bg-emerald-50 border-emerald-200"
              >
                <MapPin className="h-3 w-3 me-1" />
                {REGION_NAMES[alloc.region]?.en}: {locale === 'ar' ? 'أيام' : 'Days'} {alloc.startDay}-{alloc.endDay}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Cost Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5 text-emerald-500" />
            {locale === 'ar' ? 'تفاصيل التكلفة' : 'Cost Breakdown'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <Car className="h-5 w-5 text-blue-500 mb-2" />
              <div className="text-sm text-gray-500">{locale === 'ar' ? 'الوقود' : 'Fuel'}</div>
              <div className="text-xl font-bold">{totalCost.fuel.toFixed(2)} OMR</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <Ticket className="h-5 w-5 text-purple-500 mb-2" />
              <div className="text-sm text-gray-500">{locale === 'ar' ? 'التذاكر' : 'Tickets'}</div>
              <div className="text-xl font-bold">{totalCost.tickets.toFixed(2)} OMR</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <Coffee className="h-5 w-5 text-orange-500 mb-2" />
              <div className="text-sm text-gray-500">{locale === 'ar' ? 'الطعام' : 'Food'}</div>
              <div className="text-xl font-bold">{totalCost.food.toFixed(2)} OMR</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <Bed className="h-5 w-5 text-indigo-500 mb-2" />
              <div className="text-sm text-gray-500">{locale === 'ar' ? 'الإقامة' : 'Hotel'}</div>
              <div className="text-xl font-bold">{totalCost.accommodation.toFixed(2)} OMR</div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">{locale === 'ar' ? 'الإجمالي' : 'Total Cost'}</div>
              <div className="text-3xl font-bold text-emerald-600">{totalCost.total.toFixed(2)} OMR</div>
            </div>
            <div className="text-end">
              <div className="text-sm text-gray-500">{locale === 'ar' ? 'المسافة الإجمالية' : 'Total Distance'}</div>
              <div className="text-xl font-semibold">{totalDistance.toFixed(0)} km</div>
            </div>
          </div>
          
          {totalCost.isOverBudget && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              ⚠️ {locale === 'ar' ? 'التكلفة تتجاوز الحد المقترح' : 'Cost exceeds suggested budget threshold'}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Day Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {daySchedules.map((schedule) => (
          <button
            key={schedule.dayNumber}
            onClick={() => setCurrentDayInView(schedule.dayNumber)}
            className={`flex-shrink-0 px-6 py-3 rounded-lg font-medium transition-all ${
              currentDayInView === schedule.dayNumber
                ? 'bg-emerald-500 text-white'
                : 'bg-white border hover:bg-gray-50'
            }`}
          >
            {locale === 'ar' ? 'اليوم' : 'Day'} {schedule.dayNumber}
          </button>
        ))}
      </div>
      
      {/* Day Detail */}
      {daySchedules
        .filter(s => s.dayNumber === currentDayInView)
        .map((schedule) => (
          <DayScheduleCard key={schedule.dayNumber} schedule={schedule} locale={locale} />
        ))}
    </div>
  );
}

// Day Schedule Card
function DayScheduleCard({ schedule, locale }: { schedule: DaySchedule; locale: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-500" />
            {locale === 'ar' ? 'اليوم' : 'Day'} {schedule.dayNumber} - {REGION_NAMES[schedule.region]?.en}
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Car className="h-4 w-4" />
              {schedule.totalDistance.toFixed(0)} km
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {(schedule.totalVisitTime / 60).toFixed(1)} hrs
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {schedule.stops.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {locale === 'ar' ? 'لا توجد محطات لهذا اليوم' : 'No stops planned for this day'}
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute start-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            
            {/* Stops */}
            <div className="space-y-4">
              {schedule.stops.map((stop, index) => (
                <div key={index} className="relative ps-10">
                  {/* Timeline dot */}
                  <div className="absolute start-2.5 top-4 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-emerald-600">
                              {stop.arrivalTime} - {stop.departureTime}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-sm text-gray-500">{stop.duration} min</span>
                          </div>
                          <h4 className="font-semibold text-gray-900">{stop.destination.name.en}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {stop.destination.categories.map((cat) => (
                              <Badge key={cat} variant="secondary" className="text-xs">
                                {CATEGORY_NAMES[cat]?.en}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-end">
                          {index > 0 && (
                            <div className="text-xs text-gray-400 mb-1">
                              {stop.travelDistanceFromPrevious.toFixed(0)} km
                            </div>
                          )}
                          <div className={`font-medium ${stop.destination.ticket_cost_omr === 0 ? 'text-emerald-600' : 'text-gray-700'}`}>
                            {stop.destination.ticket_cost_omr === 0 ? 'Free' : `${stop.destination.ticket_cost_omr} OMR`}
                          </div>
                        </div>
                      </div>
                      
                      {/* Score explanation */}
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Selected because: </span>
                          {Object.entries(stop.scoreBreakdown)
                            .filter(([, value]) => value > 0.5)
                            .slice(0, 2)
                            .map(([key], i) => (
                              <span key={key}>
                                {i > 0 && ', '}
                                {key === 'interest' ? 'matches your interests' :
                                 key === 'season' ? 'ideal for this season' :
                                 key === 'crowd' ? 'manageable crowds' :
                                 key === 'cost' ? 'budget-friendly' :
                                 key === 'diversity' ? 'adds variety' :
                                 key}
                              </span>
                            ))
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
