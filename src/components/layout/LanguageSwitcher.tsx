'use client';

import { usePlannerStore } from '@/store/plannerStore';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import React from 'react';

export default function LanguageSwitcher() {
  const locale = usePlannerStore((state) => state.locale);
  const setLocale = usePlannerStore((state) => state.setLocale);
  
  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'ar' : 'en');
  };
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      className="flex items-center gap-2 text-sm font-medium"
    >
      <Globe className="h-4 w-4" />
      <span>{locale === 'en' ? 'العربية' : 'English'}</span>
    </Button>
  );
}
