
'use client';

import { useState } from 'react';
import { Handshake, TrendingUp, Heart, ArrowLeft, ShieldCheck, FileText, Info } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import InvestSection from '@/components/partnership/InvestSection';
import PartnerSection from '@/components/partnership/PartnerSection';
import DonateSection from '@/components/partnership/DonateSection';

type Tab = 'overview' | 'invest' | 'partner' | 'donate';

export default function PartnershipPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'invest':
        return <InvestSection />;
      case 'partner':
        return <PartnerSection />;
      case 'donate':
        return <DonateSection />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
            {/* Investment */}
            <div className="bg-background border border-foreground/10 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground text-center mb-4">{t('partnership.invest.title')}</h2>
              <p className="text-foreground/70 text-center mb-6 flex-grow">
                {t('partnership.invest.desc')}
              </p>
              <button 
                onClick={() => setActiveTab('invest')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('partnership.invest.button')}
              </button>
            </div>

            {/* Partnership */}
            <div className="bg-background border border-foreground/10 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col">
              <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Handshake className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground text-center mb-4">{t('partnership.partner.title')}</h2>
              <p className="text-foreground/70 text-center mb-6 flex-grow">
                {t('partnership.partner.desc')}
              </p>
              <button 
                onClick={() => setActiveTab('partner')}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('partnership.partner.button')}
              </button>
            </div>

            {/* Fundraising */}
            <div className="bg-background border border-foreground/10 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col">
              <div className="bg-red-100 dark:bg-red-900 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Heart className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground text-center mb-4">{t('partnership.donate.title')}</h2>
              <p className="text-foreground/70 text-center mb-6 flex-grow">
                {t('partnership.donate.desc')}
              </p>
              <button 
                onClick={() => setActiveTab('donate')}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('partnership.donate.button')}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="py-16 bg-background transition-colors duration-500 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Tabs (only visible if not overview) */}
        {activeTab !== 'overview' && (
          <div className="mb-8">
            <button 
              onClick={() => setActiveTab('overview')}
              className="flex items-center text-foreground/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t('partnership.tabs.overview')}
            </button>
          </div>
        )}

        {/* Hero Section (smaller if detailed view) */}
        <div className={`text-center ${activeTab === 'overview' ? 'mb-16' : 'mb-8'}`}>
          {activeTab === 'overview' && (
            <>
              <h1 className="text-4xl font-bold text-foreground mb-4">{t('partnership.title')}</h1>
              <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
                {t('partnership.subtitle')}
              </p>
            </>
          )}
        </div>

        {/* Main Content */}
        {renderContent()}

        {/* General Provisions Section */}
        <div className="mt-20 pt-12 border-t border-foreground/10">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">{t('partnership.general.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="flex items-start p-4 bg-foreground/5 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">{t('partnership.general.verificationTitle')}</h3>
                <p className="text-sm text-foreground/70">{t('partnership.general.verification')}</p>
              </div>
            </div>
            <div className="flex items-start p-4 bg-foreground/5 rounded-lg">
              <Info className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">{t('partnership.general.rightsTitle')}</h3>
                <p className="text-sm text-foreground/70">{t('partnership.general.rights')}</p>
              </div>
            </div>
            <div className="flex items-start p-4 bg-foreground/5 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">{t('partnership.general.agreementTitle')}</h3>
                <p className="text-sm text-foreground/70">{t('partnership.general.agreement')}</p>
              </div>
            </div>
            <div className="flex items-start p-4 bg-foreground/5 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-orange-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">{t('partnership.general.privacyTitle')}</h3>
                <p className="text-sm text-foreground/70">{t('partnership.general.privacy')}</p>
              </div>
            </div>
            <div className="flex items-start p-4 bg-foreground/5 rounded-lg">
              <Info className="h-6 w-6 text-cyan-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">{t('partnership.general.transparencyTitle')}</h3>
                <p className="text-sm text-foreground/70">{t('partnership.general.transparency')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
