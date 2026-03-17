'use client';

import Link from 'next/link';
import type { Destination } from '@/types';
import { usePlannerStore } from '@/store/plannerStore';
import { CATEGORY_NAMES, REGION_NAMES } from '@/data/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { 
  MapPin, 
  Clock, 
  Ticket, 
  Heart, 
  Users,
  Calendar
} from 'lucide-react';

interface DestinationCardProps {
  destination: Destination;
  showSaveButton?: boolean;
}

export default function DestinationCard({ destination, showSaveButton = true }: DestinationCardProps) {
  const locale = usePlannerStore((state) => state.locale);
  const savedIds = usePlannerStore((state) => state.savedDestinationIds);
  const addSaved = usePlannerStore((state) => state.addSavedDestination);
  const removeSaved = usePlannerStore((state) => state.removeSavedDestination);

  const isSaved = savedIds.includes(destination.id);
  
  const name = locale === 'ar' ? destination.name.ar : destination.name.en;
  const region = locale === 'ar' 
    ? destination.region.ar 
    : REGION_NAMES[destination.region.en]?.en || destination.region.en;
  
  const handleSaveToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaved) {
      removeSaved(destination.id);
    } else {
      addSaved(destination.id);
    }
  };
  
  // Format recommended months
  const monthNames = locale === 'ar' 
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const recommendedMonthsStr = destination.recommended_months
    .slice(0, 4)
    .map(m => monthNames[m - 1])
    .join(', ') + (destination.recommended_months.length > 4 ? '...' : '');
  
  // Duration formatting
  const durationHours = Math.floor(destination.avg_visit_duration_minutes / 60);
  const durationMins = destination.avg_visit_duration_minutes % 60;
  const durationStr = durationHours > 0 
    ? `${durationHours}${locale === 'ar' ? 'س' : 'h'} ${durationMins > 0 ? `${durationMins}${locale === 'ar' ? 'د' : 'm'}` : ''}`
    : `${durationMins}${locale === 'ar' ? ' دقيقة' : ' min'}`;
  
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600"
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
            <span className="text-white text-2xl font-bold opacity-50">
              {name.charAt(0)}
            </span>
          </div>
        </div>
        
        {/* Category badges */}
        <div className="absolute top-2 start-2 flex flex-wrap gap-1">
          {destination.categories.slice(0, 2).map((cat) => (
            <Badge 
              key={cat} 
              variant="secondary" 
              className="bg-white/90 text-gray-800 text-xs"
            >
              {locale === 'ar' ? CATEGORY_NAMES[cat]?.ar : CATEGORY_NAMES[cat]?.en}
            </Badge>
          ))}
        </div>
        
        {/* Save button */}
        {showSaveButton && (
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-2 end-2 h-8 w-8 rounded-full ${
              isSaved 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-white/80 text-gray-600 hover:bg-white'
            }`}
            onClick={handleSaveToggle}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
        )}
      </div>
      
      {/* Content */}
      <CardHeader className="pb-2">
        <Link href={`/destinations/${destination.id}`}>
          <h3 className="font-semibold text-lg line-clamp-1 hover:text-emerald-600 transition-colors">
            {name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="h-3 w-3" />
          <span>{region}</span>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center">
            <Clock className="h-4 w-4 text-gray-400 mb-1" />
            <span className="text-xs text-gray-600">{durationStr}</span>
          </div>
          <div className="flex flex-col items-center">
            <Ticket className="h-4 w-4 text-gray-400 mb-1" />
            <span className="text-xs text-gray-600">
              {destination.ticket_cost_omr === 0 
                ? (locale === 'ar' ? 'مجاني' : 'Free')
                : `${destination.ticket_cost_omr} OMR`
              }
            </span>
          </div>
          <div className="flex flex-col items-center">
            <Users className="h-4 w-4 text-gray-400 mb-1" />
            <span className="text-xs text-gray-600">
              {destination.crowd_level}/5
            </span>
          </div>
        </div>
        
        {/* Recommended months */}
        <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span className="line-clamp-1">{recommendedMonthsStr}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Link href={`/destinations/${destination.id}`} className="w-full">
          <Button 
            variant="outline" 
            className="w-full hover:bg-emerald-50 hover:border-emerald-500"
          >
            {locale === 'ar' ? 'عرض التفاصيل' : 'View Details'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
