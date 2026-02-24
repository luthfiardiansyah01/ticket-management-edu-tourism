
'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import BookingForm from '@/components/BookingForm';
import { useLanguage } from '@/components/providers/LanguageProvider';

type Package = {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  promo_price: number | null;
  category: string;
  image_url: string | null;
};

// Precise translation map matching the seed data
const TRANSLATIONS: Record<string, {
  name: { en: string; id: string };
  description: { en: string; id: string };
  illustration: string;
}> = {
  // PILLAR 1: PUBLIC ENGAGEMENT
  'Explorer Pass': {
    name: { en: 'Explorer Pass', id: 'Explorer Pass' },
    description: { 
      en: 'Standard river access, self-guided digital learning content, and basic conservation awareness material.', 
      id: 'Akses sungai standar, konten pembelajaran digital mandiri, dan materi kesadaran konservasi dasar.' 
    },
    illustration: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Visitor%20exploring%20Cikapundung%20river%20using%20mobile%20app%20for%20self-guided%20tour%2C%20nature%20trail%2C%20peaceful%2C%20educational%2C%20realistic%20style&image_size=landscape_16_9'
  },
  'Experience Pass': {
    name: { en: 'Experience Pass', id: 'Experience Pass' },
    description: { 
      en: 'Includes entry access, scheduled guided mini-tour slots, and interactive learning modules.', 
      id: 'Termasuk akses masuk, slot tur mini terpandu terjadwal, dan modul pembelajaran interaktif.' 
    },
    illustration: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Small%20group%20guided%20tour%20by%20the%20river%2C%20interactive%20learning%2C%20guide%20explaining%20nature%2C%20engaging%2C%20realistic%20style&image_size=landscape_16_9'
  },
  'Impact Pass': {
    name: { en: 'Impact Pass', id: 'Impact Pass' },
    description: { 
      en: 'Full guided experience, mini conservation activity participation, digital badge, and individual impact score.', 
      id: 'Pengalaman terpandu penuh, partisipasi aktivitas konservasi mini, lencana digital, dan skor dampak individu.' 
    },
    illustration: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Visitors%20planting%20small%20plants%20or%20cleaning%20river%20bank%2C%20hands-on%20conservation%2C%20meaningful%20experience%2C%20community%20impact%2C%20realistic%20style&image_size=landscape_16_9'
  },

  // PILLAR 2: EDUCATION & INSTITUTIONAL PROGRAMS
  'School Immersion Program': {
    name: { en: 'School Immersion Program', id: 'Program Imersi Sekolah' },
    description: { 
      en: 'Group-based. Bundles guided ecological tour, waste management workshop, and digital learning materials.', 
      id: 'Berbasis kelompok. Termasuk tur ekologi terpandu, workshop pengelolaan limbah, dan materi pembelajaran digital.' 
    },
    illustration: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Students%20in%20outdoor%20workshop%20learning%20about%20waste%20management%20and%20ecology%2C%20group%20activity%2C%20educational%2C%20nature%20setting%2C%20realistic%20style&image_size=landscape_16_9'
  },
  'Extended Conservation Program': {
    name: { en: 'Extended Conservation Program', id: 'Program Konservasi Lanjutan' },
    description: { 
      en: 'Includes immersion components plus tree planting or clean-up activity, and school impact report.', 
      id: 'Termasuk komponen imersi ditambah aktivitas penanaman pohon atau bersih-bersih, serta laporan dampak sekolah.' 
    },
    illustration: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Large%20group%20student%20activity%20planting%20trees%20by%20river%2C%20active%20conservation%2C%20teamwork%2C%20impactful%2C%20sunny%20day%2C%20realistic%20style&image_size=landscape_16_9'
  },

  // PILLAR 3: RIVER LAB & STRATEGIC COLLABORATION
  'Research Access Session': {
    name: { en: 'Research Access Session', id: 'Sesi Akses Penelitian' },
    description: { 
      en: 'Facilitated site access for research, community interaction session, and data access permissions.', 
      id: 'Akses lokasi terfasilitasi untuk penelitian, sesi interaksi komunitas, dan izin akses data.' 
    },
    illustration: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Researchers%20taking%20water%20samples%20and%20analyzing%20data%20by%20the%20river%2C%20scientific%20equipment%2C%20professional%2C%20nature%20lab%2C%20realistic%20style&image_size=landscape_16_9'
  },
  'Strategic Collaboration Package': {
    name: { en: 'Strategic Collaboration Package', id: 'Paket Kolaborasi Strategis' },
    description: { 
      en: 'Custom partnership for co-branded events, impact dashboard integration, and sponsored conservation.', 
      id: 'Kemitraan khusus untuk acara co-branding, integrasi dashboard dampak, dan konservasi bersponsor.' 
    },
    illustration: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Corporate%20partners%20and%20community%20leaders%20discussing%20project%20by%20the%20river%2C%20collaboration%2C%20handshake%2C%20professional%20setting%20in%20nature%2C%20realistic%20style&image_size=landscape_16_9'
  }
};

export default function PackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, locale } = useLanguage();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string>('');

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    async function fetchPackage() {
      try {
        const response = await fetch(`/api/packages/${id}`);
        if (response.ok) {
          const data = await response.json();
          setPkg(data);
        } else {
          setPkg(null);
        }
      } catch (error) {
        console.error('Failed to fetch package:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPackage();
  }, [id]);

  const getContent = (pkg: Package) => {
    const key = Object.keys(TRANSLATIONS).find(k => pkg.name.includes(k) || k.includes(pkg.name));
    
    if (key) {
      const translation = TRANSLATIONS[key];
      return {
        name: translation.name[locale] || pkg.name,
        description: translation.description[locale] || pkg.description,
        illustration: translation.illustration
      };
    }

    return { name: pkg.name, description: pkg.description, illustration: pkg.image_url };
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-foreground">{t('packages.notFound')}</h1>
      </div>
    );
  }

  const content = getContent(pkg);
  const bgImage = content.illustration || pkg.image_url || "https://images.unsplash.com/photo-1596468138768-3ce69c362089?q=80&w=2070&auto=format&fit=crop";
  const isCustomPrice = pkg.base_price === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="bg-background border border-foreground/10 rounded-lg shadow-md overflow-hidden mb-8">
             <div className="h-96 bg-gray-200 relative">
               <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${bgImage}')` }}></div>
             </div>
             <div className="p-8">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <h1 className="text-3xl font-bold text-foreground">{content.name}</h1>
                 <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                   pkg.category === 'school' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                 }`}>
                   {pkg.category === 'school' ? (['Research Access Session', 'Strategic Collaboration Package'].includes(pkg.name) ? (locale === 'en' ? 'Collab' : 'Kolaborasi') : t('packages.school')) : t('packages.personal')}
                 </span>
               </div>
               
               <div className="prose max-w-none text-foreground/80 dark:prose-invert">
                 <h3 className="text-xl font-semibold mb-2">{t('packages.descriptionTitle')}</h3>
                 <p className="whitespace-pre-wrap">{content.description}</p>
                 
                 {/* Additional Details Section as requested */}
                 <div className="mt-8 p-6 bg-foreground/5 rounded-xl border border-foreground/10">
                    <h3 className="text-lg font-bold mb-4">{t('packages.packageDetails')}</h3>
                    <ul className="space-y-2 list-disc list-inside">
                        <li><strong>{t('packages.packageName')}:</strong> {content.name}</li>
                        <li><strong>{t('packages.packageCategory')}:</strong> {pkg.category === 'school' ? t('packages.school') : t('packages.personal')}</li>
                        <li>
                            <strong>{t('packages.basePrice')}:</strong>{' '}
                            {isCustomPrice 
                                ? (locale === 'en' ? 'Custom Pricing' : 'Harga Khusus') 
                                : `Rp ${pkg.base_price.toLocaleString('id-ID')}`}
                        </li>
                        {pkg.promo_price && (
                            <li><strong>{t('packages.promoPrice')}:</strong> <span className="text-green-600 font-bold">Rp {pkg.promo_price.toLocaleString('id-ID')}</span></li>
                        )}
                    </ul>
                 </div>
               </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <BookingForm
              packageId={pkg.id}
              basePrice={pkg.base_price}
              promoPrice={pkg.promo_price}
              category={pkg.category as 'personal' | 'school'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
