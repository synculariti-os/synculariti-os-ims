'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { setUserLocale } from '@/services/locale';
import { Globe } from 'lucide-react';

const locales = [
  { code: 'en', label: 'EN' },
  { code: 'sk', label: 'SK' },
];

export function LanguageSwitcher() {
  const locale = useLocale();

  return (
    <div className="flex items-center gap-1">
      <Globe className="w-4 h-4 text-zinc-400" />
      {locales.map((l) => (
        <button
          key={l.code}
          onClick={() => setUserLocale(l.code)}
          className={`text-xs font-medium px-1.5 py-0.5 rounded transition-colors ${
            locale === l.code
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
