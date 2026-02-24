
'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Handshake, Send, CheckCircle, Upload } from 'lucide-react';

export default function PartnerSection() {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="bg-background border border-foreground/10 rounded-2xl p-12 text-center shadow-lg animate-fade-in">
        <div className="bg-green-100 dark:bg-green-900 w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto">
          <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-4">{t('partnership.partner.form.success')}</h2>
        <button 
          onClick={() => setSubmitted(false)}
          className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          Back to Form
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
          <Handshake className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">{t('partnership.partner.title')}</h2>
        <p className="text-foreground/70 max-w-2xl mx-auto">
          {t('partnership.partner.desc')}
        </p>
      </div>

      {/* TOR Section */}
      <div className="bg-background border border-foreground/10 rounded-xl p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">{t('partnership.partner.tor.background.title')}</h3>
              <p className="text-foreground/80 text-sm leading-relaxed">{t('partnership.partner.tor.background.content')}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">{t('partnership.partner.tor.types.title')}</h3>
              <p className="text-foreground/80 text-sm leading-relaxed">{t('partnership.partner.tor.types.content')}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">{t('partnership.partner.tor.objectives.title')}</h3>
              <p className="text-foreground/80 text-sm leading-relaxed">{t('partnership.partner.tor.objectives.content')}</p>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">{t('partnership.partner.tor.scope.title')}</h3>
              <p className="text-foreground/80 text-sm leading-relaxed">{t('partnership.partner.tor.scope.content')}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">{t('partnership.partner.tor.mechanism.title')}</h3>
              <p className="text-foreground/80 text-sm leading-relaxed">{t('partnership.partner.tor.mechanism.content')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-8">
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-2">{t('partnership.partner.form.title')}</h3>
          <p className="text-foreground/60">{t('partnership.partner.form.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">{t('partnership.partner.form.orgName')}</label>
              <input required type="text" className="w-full px-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">{t('partnership.partner.form.pic')}</label>
              <input required type="text" className="w-full px-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">{t('partnership.partner.form.contact')}</label>
              <input required type="text" className="w-full px-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">{t('partnership.partner.form.type')}</label>
              <select required className="w-full px-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all">
                <option value="csr">{t('partnership.partner.form.typeOptions.csr')}</option>
                <option value="education">{t('partnership.partner.form.typeOptions.education')}</option>
                <option value="sponsor">{t('partnership.partner.form.typeOptions.sponsor')}</option>
                <option value="event">{t('partnership.partner.form.typeOptions.event')}</option>
                <option value="other">{t('partnership.partner.form.typeOptions.other')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">{t('partnership.partner.form.desc')}</label>
            <textarea required rows={4} className="w-full px-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">{t('partnership.partner.form.duration')}</label>
              <input required type="text" className="w-full px-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">{t('partnership.partner.form.impact')}</label>
              <input required type="text" className="w-full px-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">{t('partnership.partner.form.proposal')}</label>
            <div className="flex gap-2">
              <input type="url" placeholder="https://" className="flex-grow px-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all" />
              <button type="button" className="px-4 py-2 bg-foreground/10 hover:bg-foreground/20 rounded-lg transition-colors flex items-center gap-2">
                <Upload className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-start">
            <input required type="checkbox" className="mt-1 h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500" />
            <span className="ml-2 text-sm text-foreground/70">{t('partnership.partner.form.consent')}</span>
          </div>

          <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
            <Send className="h-5 w-5" />
            {t('partnership.partner.form.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
