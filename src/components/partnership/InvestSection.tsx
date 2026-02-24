
'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { TrendingUp, Send, CheckCircle } from 'lucide-react';

export default function InvestSection() {
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
        <h2 className="text-2xl font-bold text-foreground mb-4">{t('partnership.invest.form.success')}</h2>
        <button 
          onClick={() => setSubmitted(false)}
          className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
        <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
          <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">{t('partnership.invest.title')}</h2>
        <p className="text-foreground/70 max-w-2xl mx-auto">
          {t('partnership.invest.desc')}
        </p>
      </div>

      {/* TOR Section */}
      <div className="bg-background border border-foreground/10 rounded-xl p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">{t('partnership.invest.tor.background.title')}</h3>
              <p className="text-foreground/80 text-sm leading-relaxed">{t('partnership.invest.tor.background.content')}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">{t('partnership.invest.tor.objectives.title')}</h3>
              <p className="text-foreground/80 text-sm leading-relaxed">{t('partnership.invest.tor.objectives.content')}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">{t('partnership.invest.tor.scope.title')}</h3>
              <p className="text-foreground/80 text-sm leading-relaxed">{t('partnership.invest.tor.scope.content')}</p>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">{t('partnership.invest.tor.mechanism.title')}</h3>
              <p className="text-foreground/80 text-sm leading-relaxed">{t('partnership.invest.tor.mechanism.content')}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">{t('partnership.invest.tor.selection.title')}</h3>
              <p className="text-foreground/80 text-sm leading-relaxed">{t('partnership.invest.tor.selection.content')}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">{t('partnership.invest.tor.general.title')}</h3>
              <p className="text-foreground/80 text-sm leading-relaxed">{t('partnership.invest.tor.general.content')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-8">
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-2">{t('partnership.invest.form.title')}</h3>
          <p className="text-foreground/60">{t('partnership.invest.form.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">{t('partnership.invest.form.name')}</label>
              <input required type="text" className="w-full px-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">{t('partnership.invest.form.institution')}</label>
              <input type="text" className="w-full px-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">{t('partnership.invest.form.email')}</label>
              <input required type="email" className="w-full px-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">{t('partnership.invest.form.whatsapp')}</label>
              <input required type="tel" className="w-full px-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">{t('partnership.invest.form.type')}</label>
              <select required className="w-full px-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                <option value="equity">{t('partnership.invest.form.typeOptions.equity')}</option>
                <option value="revenue">{t('partnership.invest.form.typeOptions.revenue')}</option>
                <option value="project">{t('partnership.invest.form.typeOptions.project')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">{t('partnership.invest.form.value')}</label>
              <input required type="text" placeholder="IDR / USD" className="w-full px-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">{t('partnership.invest.form.goal')}</label>
            <textarea required rows={4} className="w-full px-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"></textarea>
          </div>

          <div className="flex items-start">
            <input required type="checkbox" className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
            <span className="ml-2 text-sm text-foreground/70">{t('partnership.invest.form.consent')}</span>
          </div>

          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
            <Send className="h-5 w-5" />
            {t('partnership.invest.form.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
