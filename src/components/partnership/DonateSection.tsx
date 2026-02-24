
'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Heart, CreditCard, QrCode, Smartphone, CheckCircle } from 'lucide-react';

export default function DonateSection() {
  const { t } = useLanguage();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('qris');
  const [submitted, setSubmitted] = useState(false);

  const amounts = [10000, 25000, 50000, 100000];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="bg-background border border-foreground/10 rounded-2xl p-12 text-center shadow-lg animate-fade-in">
        <div className="bg-red-100 dark:bg-red-900 w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto">
          <CheckCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('partnership.donate.form.reference')}: DON-{Math.floor(Math.random() * 1000000)}</h2>
        <p className="text-foreground/70 mb-6">{t('partnership.donate.form.note')}</p>
        <button 
          onClick={() => setSubmitted(false)}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Donate Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="bg-red-100 dark:bg-red-900 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
          <Heart className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">{t('partnership.donate.title')}</h2>
        <p className="text-foreground/70 max-w-2xl mx-auto">
          {t('partnership.donate.desc')}
        </p>
      </div>

      {/* TOR Section */}
      <div className="bg-background border border-foreground/10 rounded-xl p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">{t('partnership.donate.tor.objectives.title')}</h3>
              <p className="text-foreground/80 text-sm leading-relaxed">{t('partnership.donate.tor.objectives.content')}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">{t('partnership.donate.tor.focus.title')}</h3>
              <p className="text-foreground/80 text-sm leading-relaxed">{t('partnership.donate.tor.focus.content')}</p>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">{t('partnership.donate.tor.transparency.title')}</h3>
              <p className="text-foreground/80 text-sm leading-relaxed">{t('partnership.donate.tor.transparency.content')}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">{t('partnership.donate.tor.mechanism.title')}</h3>
              <p className="text-foreground/80 text-sm leading-relaxed">{t('partnership.donate.tor.mechanism.content')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Donation Form */}
      <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold text-foreground">{t('partnership.donate.form.progress')}</h3>
            <span className="text-red-600 font-bold">42%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-red-600 h-2.5 rounded-full" style={{ width: '42%' }}></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Amount Selection */}
          <div>
            <label className="block text-lg font-bold text-foreground mb-4">{t('partnership.donate.form.selectAmount')}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {amounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                  className={`py-3 rounded-xl border font-semibold transition-all ${
                    selectedAmount === amount
                      ? 'bg-red-600 text-white border-red-600 shadow-md transform -translate-y-1'
                      : 'bg-background text-foreground/70 border-foreground/20 hover:border-red-600 hover:text-red-600'
                  }`}
                >
                  Rp {amount.toLocaleString('id-ID')}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder={t('partnership.donate.form.customAmount')}
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
              className="w-full px-4 py-3 rounded-xl border border-foreground/20 bg-background focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-lg font-bold text-foreground mb-4">{t('partnership.donate.form.paymentMethod')}</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`flex items-center justify-center gap-3 py-4 rounded-xl border font-medium transition-all ${
                  paymentMethod === 'qris'
                    ? 'bg-red-50 text-red-700 border-red-600 ring-1 ring-red-600'
                    : 'bg-background text-foreground/70 border-foreground/20 hover:bg-foreground/5'
                }`}
              >
                <QrCode className="h-6 w-6" />
                {t('partnership.donate.form.methods.qris')}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`flex items-center justify-center gap-3 py-4 rounded-xl border font-medium transition-all ${
                  paymentMethod === 'transfer'
                    ? 'bg-red-50 text-red-700 border-red-600 ring-1 ring-red-600'
                    : 'bg-background text-foreground/70 border-foreground/20 hover:bg-foreground/5'
                }`}
              >
                <CreditCard className="h-6 w-6" />
                {t('partnership.donate.form.methods.transfer')}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('ewallet')}
                className={`flex items-center justify-center gap-3 py-4 rounded-xl border font-medium transition-all ${
                  paymentMethod === 'ewallet'
                    ? 'bg-red-50 text-red-700 border-red-600 ring-1 ring-red-600'
                    : 'bg-background text-foreground/70 border-foreground/20 hover:bg-foreground/5'
                }`}
              >
                <Smartphone className="h-6 w-6" />
                {t('partnership.donate.form.methods.ewallet')}
              </button>
            </div>
          </div>

          {/* Mock QR or Details */}
          <div className="bg-background border border-foreground/10 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
            {paymentMethod === 'qris' && (
              <>
                <div className="w-48 h-48 bg-gray-200 mb-4 flex items-center justify-center rounded-lg">
                  <QrCode className="h-24 w-24 text-gray-400" />
                </div>
                <p className="text-sm text-foreground/60">Scan with any QRIS supported app</p>
              </>
            )}
            {paymentMethod === 'transfer' && (
              <div className="text-left w-full max-w-sm">
                <p className="text-sm text-foreground/60 mb-1">Bank BCA</p>
                <p className="text-xl font-mono font-bold mb-4 flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  123 456 7890
                  <span className="text-xs text-blue-600 cursor-pointer ml-2">Copy</span>
                </p>
                <p className="text-sm text-foreground/60 mb-1">Bank Mandiri</p>
                <p className="text-xl font-mono font-bold bg-gray-100 dark:bg-gray-800 p-2 rounded">098 765 4321</p>
              </div>
            )}
            {paymentMethod === 'ewallet' && (
              <div className="space-y-4 w-full max-w-sm">
                <div className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="font-bold">GoPay</span>
                  <div className="w-4 h-4 rounded-full border border-gray-400"></div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="font-bold">OVO</span>
                  <div className="w-4 h-4 rounded-full border border-gray-400"></div>
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={!selectedAmount && !customAmount}
            className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all text-lg"
          >
            {t('partnership.donate.form.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
