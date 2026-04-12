
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface BookingFormProps {
  packageId: string;
  basePrice: number;
  promoPrice: number | null;
  category: 'personal' | 'school';
}

interface PriceCalculation {
  totalPrice: number;
  pricePerUnit: number;
  discountApplied: boolean;
  discountPercentage: number;
}

export default function BookingForm({ packageId, basePrice, promoPrice, category }: BookingFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [visitDate, setVisitDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [priceData, setPriceData] = useState<PriceCalculation | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch price from API with debouncing
  const fetchPrice = useCallback(async (qty: number) => {
    if (qty < 1) return;

    setLoadingPrice(true);
    setPriceError('');

    try {
      const res = await fetch('/api/packages/calculate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          quantity: qty,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to calculate price');
      }

      setPriceData(data);
    } catch (err: any) {
      setPriceError(err.message);
      // Fallback to local calculation if API fails
      let pricePerPax = promoPrice ?? basePrice;
      if (category === 'school') {
        if (qty >= 100) {
          pricePerPax = Math.floor(pricePerPax * 0.85);
        } else if (qty >= 50) {
          pricePerPax = Math.floor(pricePerPax * 0.90);
        }
      }
      setPriceData({
        totalPrice: pricePerPax * qty,
        pricePerUnit: pricePerPax,
        discountApplied: category === 'school' && qty >= 50,
        discountPercentage: category === 'school' ? (qty >= 100 ? 15 : qty >= 50 ? 10 : 0) : 0,
      });
    } finally {
      setLoadingPrice(false);
    }
  }, [packageId, basePrice, promoPrice, category]);

  // Debounced price calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPrice(quantity);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [quantity, fetchPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!session) {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!visitDate) {
      setError(t('booking.errorDate'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          visitDate,
          quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Redirect to booking confirmation or payment simulation
      router.push(`/bookings/${data.bookingId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-background border border-foreground/10 p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-foreground">{t('booking.title')}</h3>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {priceError && (
        <div className="bg-yellow-50 text-yellow-700 p-3 rounded-md text-sm">
          {t('booking.priceWarning')}: {priceError}
        </div>
      )}

      <div>
        <label htmlFor="visitDate" className="block text-sm font-medium text-foreground/80 mb-1">
          {t('booking.visitDate')}
        </label>
        <input
          type="date"
          id="visitDate"
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border border-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-background text-foreground"
          required
        />
      </div>

      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-foreground/80 mb-1">
          {t('booking.quantity')}
        </label>
        <input
          type="number"
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          min="1"
          className="w-full px-3 py-2 border border-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-background text-foreground"
          required
        />
        {category === 'school' && (
          <p className="text-xs text-foreground/60 mt-1">
            {t('booking.bulkDiscount')}
          </p>
        )}
        {priceData && priceData.discountApplied && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
            ✓ {priceData.discountPercentage}% {t('booking.discountApplied')}
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-foreground/10">
        <div className="flex justify-between items-center mb-4">
          <span className="text-foreground/70">{t('booking.totalPrice')}</span>
          {loadingPrice ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
              <span className="text-sm text-foreground/60">{t('booking.calculating')}</span>
            </div>
          ) : (
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              Rp {(priceData?.totalPrice || 0).toLocaleString('id-ID')}
            </span>
          )}
        </div>

        {priceData && priceData.pricePerUnit !== (promoPrice ?? basePrice) && (
          <div className="text-xs text-foreground/60 mb-4">
            <span>{t('booking.pricePerUnit')}: Rp {priceData.pricePerUnit.toLocaleString('id-ID')}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || loadingPrice}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t('booking.processing') : t('booking.bookNow')}
        </button>
      </div>
    </form>
  );
}
