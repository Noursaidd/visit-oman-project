'use client';

import Link from 'next/link';
import { usePlannerStore } from '@/store/plannerStore';
import { getUniqueRegions } from '@/lib/data';
import { MapPin } from 'lucide-react';

function copy(locale: 'en' | 'ar', key: 'home' | 'destinations' | 'plan' | 'quickLinks' | 'regions' | 'brand' | 'description' | 'vision' | 'rights' | 'platform') {
  if (locale === 'ar') {
    switch (key) {
      case 'home':
        return '\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629';
      case 'destinations':
        return '\u0627\u0644\u0648\u062C\u0647\u0627\u062A';
      case 'plan':
        return '\u062E\u0637\u0637 \u0631\u062D\u0644\u062A\u0643';
      case 'quickLinks':
        return '\u0631\u0648\u0627\u0628\u0637 \u0633\u0631\u064A\u0639\u0629';
      case 'regions':
        return '\u0627\u0644\u0645\u062D\u0627\u0641\u0638\u0627\u062A';
      case 'brand':
        return '\u0632\u0631 \u0639\u0645\u0627\u0646';
      case 'description':
        return '\u0628\u0648\u0627\u0628\u062A\u0643 \u0644\u0627\u0643\u062A\u0634\u0627\u0641 \u062A\u062C\u0627\u0631\u0628 \u0639\u0645\u0627\u0646\u064A\u0629 \u0623\u0635\u064A\u0644\u0629. \u062E\u0637\u0637 \u0631\u062D\u0644\u062A\u0643 \u0627\u0644\u0645\u062B\u0627\u0644\u064A\u0629 \u0645\u0639 \u0645\u062E\u0637\u0637 \u0627\u0644\u0628\u0631\u0627\u0645\u062C \u0627\u0644\u0630\u0643\u064A.';
      case 'vision':
        return '\u062F\u0639\u0645 \u0631\u0624\u064A\u0629 \u0639\u0645\u0627\u0646 2040';
      case 'rights':
        return '\u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629 \u0644\u0646\u0648\u0631 \u0627\u0644\u0634\u0627\u0645\u0633\u064A.';
      case 'platform':
        return '\u0645\u0646\u0635\u0629 \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0633\u064A\u0627\u062D\u064A\u0629 \u0644\u0623\u063A\u0631\u0627\u0636 \u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0631\u062D\u0644\u0627\u062A.';
      default:
        return '';
    }
  }

  switch (key) {
    case 'home':
      return 'Home';
    case 'destinations':
      return 'Destinations';
    case 'plan':
      return 'Plan Trip';
    case 'quickLinks':
      return 'Quick Links';
    case 'regions':
      return 'Regions';
    case 'brand':
      return 'Visit Oman';
    case 'description':
      return 'Your gateway to discovering authentic Omani experiences. Plan your perfect trip with our intelligent itinerary generator.';
    case 'vision':
      return 'Supporting Oman Vision 2040';
    case 'rights':
      return 'All rights reserved to Noor Alshamsi.';
    case 'platform':
      return 'Tourist information platform for trip planning purposes.';
    default:
      return '';
  }
}

export default function Footer() {
  const locale = usePlannerStore((state) => state.locale);

  const quickLinks = [
    { href: '/', label: copy(locale, 'home') },
    { href: '/destinations', label: copy(locale, 'destinations') },
    { href: '/plan', label: copy(locale, 'plan') },
  ];

  const regions = getUniqueRegions().map((region) => ({
    href: `/destinations?region=${region.en.toLowerCase()}`,
    label: locale === 'ar' ? region.ar : region.en,
  }));

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">{copy(locale, 'brand')}</span>
            </Link>
            <p className="text-gray-400 max-w-md mb-4">{copy(locale, 'description')}</p>
            <p className="text-sm text-gray-500">{copy(locale, 'vision')}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{copy(locale, 'quickLinks')}</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-emerald-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{copy(locale, 'regions')}</h3>
            <ul className="space-y-2">
              {regions.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-emerald-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            {'\u00A9'} 2026 {copy(locale, 'brand')}. {copy(locale, 'rights')}
          </p>
          <p className="text-sm text-gray-500">{copy(locale, 'platform')}</p>
        </div>
      </div>
    </footer>
  );
}
