
'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setLocale('en')}
        className={`px-2 py-1 text-sm rounded transition-colors ${
          locale === 'en'
            ? 'bg-green-600 text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        EN
      </button>
      <span className="text-gray-300 dark:text-gray-600">|</span>
      <button
        onClick={() => setLocale('id')}
        className={`px-2 py-1 text-sm rounded transition-colors ${
          locale === 'id'
            ? 'bg-green-600 text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        ID
      </button>
    </div>
  );
}
