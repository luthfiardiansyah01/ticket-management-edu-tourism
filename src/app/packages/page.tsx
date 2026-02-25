'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

const KEY_TAKEAWAYS = {
  title: { en: 'Key Takeaways', id: 'Poin Utama' },
  points: [
    { 
      en: 'Community receives ~42% of total revenue with optional donations → strong support for Cikapundung programs.', 
      id: 'Komunitas menerima ~42% dari total pendapatan dengan donasi opsional → dukungan kuat untuk program Cikapundung.' 
    },
    { 
      en: 'Operations (~36%) and Platform (~25%) remain sustainable for smooth delivery and long-term growth.', 
      id: 'Operasional (~36%) dan Platform (~25%) tetap berkelanjutan untuk kelancaran layanan dan pertumbuhan jangka panjang.' 
    },
    { 
      en: 'Pricing tiers balance affordability, personalized experiences, and funding sustainability.', 
      id: 'Tingkatan harga menyeimbangkan keterjangkauan, pengalaman personal, dan keberlanjutan pendanaan.' 
    },
    { 
      en: 'Transparent allocation makes this model investor-friendly and community-credible.', 
      id: 'Alokasi transparan membuat model ini ramah investor dan kredibel bagi komunitas.' 
    }
  ]
};

export default function PackagesPage() {
  const { t, locale } = useLanguage(); 
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      try {
        const response = await fetch('/api/packages', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setPackages(data);
        }
      } catch (error) {
        console.error('Failed to fetch packages:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPackages();
  }, []);

  const getContent = (pkg: Package) => {
    const key = Object.keys(TRANSLATIONS).find(k => pkg.name === k);
    
    if (key) {
      const translation = TRANSLATIONS[key];
      return {
        name: translation.name[locale] || pkg.name,
        description: translation.description[locale] || pkg.description,
        illustration: translation.illustration
      };
    }

    // Fallback
    return { name: pkg.name, description: pkg.description, illustration: pkg.image_url };
  };

  // Grouping Logic based on the new structure
  const pillar1Packages = packages.filter(p => 
    p.category === 'personal' && 
    ['Explorer Pass', 'Experience Pass', 'Impact Pass'].includes(p.name)
  );

  const pillar2Packages = packages.filter(p => 
    p.category === 'school' && 
    ['School Immersion Program', 'Extended Conservation Program'].includes(p.name)
  );

  const pillar3Packages = packages.filter(p => 
    p.category === 'school' && 
    ['Research Access Session', 'Strategic Collaboration Package'].includes(p.name)
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const renderPackageCard = (pkg: Package) => {
    const content = getContent(pkg);
    const bgImage = content.illustration || pkg.image_url || "https://images.unsplash.com/photo-1596468138768-3ce69c362089?q=80&w=2070&auto=format&fit=crop";
    
    // Special handling for Custom Price (0)
    const isCustomPrice = pkg.base_price === 0;

    return (
      <div key={pkg.id} className="bg-background border border-foreground/10 rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 group">
        <div className="h-48 bg-gray-200 relative overflow-hidden">
           <div 
             className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" 
             style={{ backgroundImage: `url('${bgImage}')` }}
           ></div>
           <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300"></div>
        </div>
        <div className="p-6 flex-grow flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-foreground">{content.name}</h2>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              pkg.category === 'school' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}>
              {pkg.category === 'school' ? (['Research Access Session', 'Strategic Collaboration Package'].includes(pkg.name) ? (locale === 'en' ? 'Collab' : 'Kolaborasi') : t('packages.school')) : t('packages.personal')}
            </span>
          </div>
          <p className="text-foreground/70 mb-4 flex-grow line-clamp-3">{content.description}</p>
          <div className="mt-auto">
            <div className="flex items-baseline mb-4">
              {isCustomPrice ? (
                 <span className="text-xl font-bold text-green-600 dark:text-green-400">
                   {locale === 'en' ? 'Custom Pricing' : 'Harga Khusus'}
                 </span>
              ) : pkg.promo_price ? (
                <>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    Rp {pkg.promo_price.toLocaleString('id-ID')}
                  </span>
                  <span className="ml-2 text-sm text-foreground/50 line-through">
                    Rp {pkg.base_price.toLocaleString('id-ID')}
                  </span>
                  <span className="ml-1 text-foreground/60 text-sm">{t('packages.perPax')}</span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    Rp {pkg.base_price.toLocaleString('id-ID')}
                  </span>
                  <span className="ml-1 text-foreground/60 text-sm">{t('packages.perPax')}</span>
                </>
              )}
            </div>
            <Link
              href={`/packages/${pkg.id}`}
              className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {t('packages.viewDetails')}
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-500">
      <h1 className="text-3xl font-bold text-foreground mb-8">{t('packages.title')}</h1>
      
      {packages.length === 0 ? (
        <p className="text-foreground/70">{t('packages.notFound')}</p>
      ) : (
        <div className="space-y-12">
          {/* Key Takeaways Section */}
          <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-foreground mb-6">{KEY_TAKEAWAYS.title[locale]}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {KEY_TAKEAWAYS.points.map((point, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-sm font-bold">✓</span>
                  </div>
                  <p className="text-foreground/80">{point[locale]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pillar 1: Public Engagement */}
          {pillar1Packages.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {locale === 'en' ? 'Pillar 1: Public Engagement' : 'Pilar 1: Keterlibatan Publik'}
              </h2>
              <p className="text-foreground/60 mb-6">
                {locale === 'en' ? '(Access & Awareness Engine)' : '(Mesin Akses & Kesadaran)'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pillar1Packages.map(renderPackageCard)}
              </div>
            </div>
          )}

          {/* Pillar 2: Education & Institutional Programs */}
          {pillar2Packages.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2 pt-8 border-t border-foreground/10">
                {locale === 'en' ? 'Pillar 2: Education & Institutional Programs' : 'Pilar 2: Program Edukasi & Institusi'}
              </h2>
              <p className="text-foreground/60 mb-6">
                {locale === 'en' ? '(Structured Learning & Revenue Stability Engine)' : '(Mesin Pembelajaran Terstruktur & Stabilitas Pendapatan)'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pillar2Packages.map(renderPackageCard)}
              </div>
            </div>
          )}

          {/* Pillar 3: River Lab & Strategic Collaboration */}
          {pillar3Packages.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2 pt-8 border-t border-foreground/10">
                {locale === 'en' ? 'Pillar 3: River Lab & Strategic Collaboration' : 'Pilar 3: Lab Sungai & Kolaborasi Strategis'}
              </h2>
              <p className="text-foreground/60 mb-6">
                {locale === 'en' ? '(Innovation & Ecosystem Engine)' : '(Mesin Inovasi & Ekosistem)'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pillar3Packages.map(renderPackageCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
