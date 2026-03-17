import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  getAllDestinations, 
  getDestinationById,
  getDestinationPaths 
} from '@/lib/data';
import { CATEGORY_NAMES, MONTHS } from '@/data/constants';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Clock, 
  Ticket, 
  Users, 
  Calendar, 
  Heart, 
  ArrowLeft,
  Building2,
  Mountain,
  Palmtree,
  Sun,
  Leaf,
  UtensilsCrossed
} from 'lucide-react';

// Generate static params for all destinations
export async function generateStaticParams() {
  const paths = getDestinationPaths();
  return paths.map(p => ({ id: p.params.id }));
}

// Generate metadata for SEO
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  const destination = getDestinationById(id);
  
  if (!destination) {
    return {
      title: 'Destination Not Found | Visit Oman',
    };
  }
  
  return {
    title: `${destination.name.en} | Visit Oman`,
    description: `Explore ${destination.name.en} in ${destination.region.en}, Oman. ${destination.categories.join(', ')} attraction with an average visit time of ${destination.avg_visit_duration_minutes} minutes.`,
    keywords: [
      destination.name.en,
      destination.name.ar,
      destination.region.en,
      'Oman',
      'tourism',
      ...destination.categories,
    ],
  };
}

// Icon mapping for categories
const categoryIcons: Record<string, React.ElementType> = {
  mountain: Mountain,
  beach: Palmtree,
  culture: Building2,
  desert: Sun,
  nature: Leaf,
  food: UtensilsCrossed,
};

const OMAN_BOUNDS = {
  north: 26.5,
  south: 16.3,
  east: 60.1,
  west: 51.8,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function projectToOmanBounds(lat: number, lng: number): { xPercent: number; yPercent: number } {
  const x = ((lng - OMAN_BOUNDS.west) / (OMAN_BOUNDS.east - OMAN_BOUNDS.west)) * 100;
  const y = ((OMAN_BOUNDS.north - lat) / (OMAN_BOUNDS.north - OMAN_BOUNDS.south)) * 100;

  return {
    xPercent: clamp(x, 5, 95),
    yPercent: clamp(y, 8, 92),
  };
}

function CoordinateMapPreview({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const { xPercent, yPercent } = projectToOmanBounds(lat, lng);

  return (
    <div className="relative h-64 rounded-lg overflow-hidden border bg-gray-100">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100" />
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,#94a3b8_1px,transparent_1px),linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute top-3 start-3 rounded bg-white/90 px-2 py-1 text-[11px] text-gray-600">
        Oman coordinate frame
      </div>

      <div className="absolute inset-0">
        <div
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
        >
          <div className="h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-emerald-200" />
          <div className="mt-2 rounded bg-gray-900/80 px-2 py-0.5 text-[11px] text-white whitespace-nowrap -translate-x-1/2 ms-2">
            {label}
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 start-3 rounded bg-white/90 px-2 py-1 text-xs text-gray-700">
        {lat.toFixed(4)}Â°N, {lng.toFixed(4)}Â°E
      </div>
      <div className="absolute bottom-3 end-3 rounded bg-white/90 px-2 py-1 text-[11px] text-gray-500 text-end">
        16.3-26.5Â°N
        <br />
        51.8-60.1Â°E
      </div>
    </div>
  );
}

// Generate a description based on destination attributes
function generateDescription(destination: ReturnType<typeof getDestinationById>): string {
  if (!destination) return '';
  
  const regionName = destination.region.en;
  const categoryNames = destination.categories
    .map(c => CATEGORY_NAMES[c]?.en.toLowerCase() || c)
    .join(' and ');
  
  const seasonDesc = destination.recommended_months.length >= 6
    ? 'year-round destination'
    : destination.recommended_months.length >= 3
    ? 'seasonal destination'
    : 'best visited during specific months';
  
  const crowdDesc = destination.crowd_level <= 2
    ? 'peaceful and uncrowded'
    : destination.crowd_level <= 4
    ? 'popular attraction'
    : 'very popular destination';
  
  return `Discover ${destination.name.en}, a captivating ${categoryNames} experience located in ${regionName}, Oman. This ${seasonDesc} is ${crowdDesc}, making it perfect for ${destination.crowd_level <= 2 ? 'travelers seeking tranquility' : 'those who enjoy vibrant atmospheres'}. The site is managed by ${destination.company.en}${destination.ticket_cost_omr === 0 ? ' and offers free entry' : `, with an entrance fee of ${destination.ticket_cost_omr} OMR`}. Visitors typically spend around ${Math.floor(destination.avg_visit_duration_minutes / 60) > 0 ? `${Math.floor(destination.avg_visit_duration_minutes / 60)} hour${Math.floor(destination.avg_visit_duration_minutes / 60) > 1 ? 's' : ''}` : `${destination.avg_visit_duration_minutes} minutes`} exploring this remarkable destination.`;
}

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const destination = getDestinationById(id);
  
  if (!destination) {
    notFound();
  }
  
  const description = generateDescription(destination);
  const allDestinations = getAllDestinations();
  
  // Find related destinations (same region or categories)
  const relatedDestinations = allDestinations
    .filter(d => 
      d.id !== destination.id && 
      (d.region.en === destination.region.en || 
       d.categories.some(c => destination.categories.includes(c)))
    )
    .slice(0, 4);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/destinations">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Destinations
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div 
              className="h-64 md:h-96 rounded-2xl relative overflow-hidden"
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
                <span className="text-white text-8xl font-bold opacity-20">
                  {destination.name.en.charAt(0)}
                </span>
              </div>
              
              {/* Category badges */}
              <div className="absolute top-4 start-4 flex flex-wrap gap-2">
                {destination.categories.map((cat) => {
                  const Icon = categoryIcons[cat];
                  return (
                    <Badge 
                      key={cat} 
                      variant="secondary" 
                      className="bg-white/90 text-gray-800 gap-1"
                    >
                      {Icon && <Icon className="h-3 w-3" />}
                      {CATEGORY_NAMES[cat]?.en}
                    </Badge>
                  );
                })}
              </div>
              
              {/* Save button */}
              <Link href="/plan" className="absolute top-4 end-4">
                <Button 
                  variant="secondary" 
                  size="icon"
                  className="bg-white/90 hover:bg-white"
                >
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            {/* Title and Region */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {destination.name.en}
              </h1>
              <p className="text-xl text-gray-500" dir="rtl">
                {destination.name.ar}
              </p>
              <div className="flex items-center gap-2 mt-3 text-gray-600">
                <MapPin className="h-5 w-5 text-emerald-500" />
                <span>{destination.region.en}</span>
                <span className="text-gray-300">â€¢</span>
                <span>{destination.region.ar}</span>
              </div>
            </div>
            
            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-3">About</h2>
                <p className="text-gray-700 leading-relaxed">
                  {description}
                </p>
              </CardContent>
            </Card>
            
            {/* Map Preview */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-500" />
                  Location
                </h2>
                <CoordinateMapPreview
                  lat={destination.lat}
                  lng={destination.lng}
                  label={destination.name.en}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">Quick Info</h2>
                <Separator />
                
                {/* Visit Duration */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-5 w-5" />
                    <span>Visit Duration</span>
                  </div>
                  <span className="font-medium">
                    {destination.avg_visit_duration_minutes >= 60
                      ? `${Math.floor(destination.avg_visit_duration_minutes / 60)}h ${destination.avg_visit_duration_minutes % 60}m`
                      : `${destination.avg_visit_duration_minutes} min`
                    }
                  </span>
                </div>
                
                {/* Ticket Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Ticket className="h-5 w-5" />
                    <span>Entry Fee</span>
                  </div>
                  <span className={`font-medium ${destination.ticket_cost_omr === 0 ? 'text-emerald-600' : ''}`}>
                    {destination.ticket_cost_omr === 0 ? 'Free' : `${destination.ticket_cost_omr} OMR`}
                  </span>
                </div>
                
                {/* Crowd Level */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-5 w-5" />
                    <span>Crowd Level</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-2 h-6 rounded-full ${
                          level <= destination.crowd_level
                            ? level <= 2 ? 'bg-emerald-500' 
                              : level <= 4 ? 'bg-amber-500' 
                              : 'bg-red-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Managed By */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="h-5 w-5" />
                    <span>Managed By</span>
                  </div>
                  <span className="font-medium text-sm text-end">{destination.company.en}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Recommended Months */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-500" />
                  Best Time to Visit
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {MONTHS.map((month) => {
                    const isRecommended = destination.recommended_months.includes(month.value);
                    return (
                      <div
                        key={month.value}
                        className={`text-center py-2 px-1 rounded-lg text-sm ${
                          isRecommended
                            ? 'bg-emerald-100 text-emerald-700 font-medium'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {month.en.slice(0, 3)}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* CTA */}
            <Link href="/plan" className="block">
              <Button className="w-full h-14 text-lg gap-2 bg-emerald-500 hover:bg-emerald-600">
                <Calendar className="h-5 w-5" />
                Add to Trip Plan
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Related Destinations */}
        {relatedDestinations.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related Destinations</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedDestinations.map((dest) => (
                <Link key={dest.id} href={`/destinations/${dest.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    <div 
                      className="h-32 relative"
                      style={{
                        background: `linear-gradient(135deg, ${
                          dest.categories.includes('beach') ? '#2980b9, #3498db' :
                          dest.categories.includes('mountain') ? '#4a7c59, #6b8e23' :
                          dest.categories.includes('desert') ? '#d4a574, #c19a6b' :
                          dest.categories.includes('culture') ? '#8e44ad, #9b59b6' :
                          '#27ae60, #2ecc71'
                        })`
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold opacity-30">
                          {dest.name.en.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-1">{dest.name.en}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{dest.region.en}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

