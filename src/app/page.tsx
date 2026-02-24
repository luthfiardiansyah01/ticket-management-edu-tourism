
'use client';

import Link from 'next/link';
import { ArrowRight, MapPin, Users, Calendar } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-green-900 text-white py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-50 z-0"></div>
        <div className="absolute inset-0 z-0">
           {/* Placeholder for image */}
           <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=2070&auto=format&fit=crop')" }}></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/packages" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-full transition duration-300 flex items-center">
              {t('hero.bookNow')} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="#about" className="bg-white hover:bg-gray-100 text-green-900 font-semibold py-3 px-8 rounded-full transition duration-300">
              {t('hero.learnMore')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white dark:bg-gray-700 rounded-lg shadow-sm transition-colors duration-300 border border-transparent dark:border-gray-600">
              <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('features.location.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('features.location.desc')}</p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-700 rounded-lg shadow-sm transition-colors duration-300 border border-transparent dark:border-gray-600">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('features.education.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('features.education.desc')}</p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-700 rounded-lg shadow-sm transition-colors duration-300 border border-transparent dark:border-gray-600">
              <div className="bg-orange-100 dark:bg-orange-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('features.booking.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('features.booking.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Preview (Placeholder) */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Popular Packages</h2>
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-8">Packages will be listed here.</p>
            <Link href="/packages" className="text-green-600 dark:text-green-400 font-semibold hover:text-green-700 dark:hover:text-green-300">
              View All Packages &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
