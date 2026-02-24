
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface BookingFormProps {
  packageId: string;
  basePrice: number;
  promoPrice: number | null;
  category: 'personal' | 'school';
}

export default function BookingForm({ packageId, basePrice, promoPrice, category }: BookingFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [visitDate, setVisitDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate price whenever quantity changes
  useEffect(() => {
    let pricePerPax = promoPrice ?? basePrice;

    // Apply school bulk discount logic
    if (category === 'school') {
      if (quantity >= 100) {
        pricePerPax = Math.floor(pricePerPax * 0.85); // 15% off
      } else if (quantity >= 50) {
        pricePerPax = Math.floor(pricePerPax * 0.90); // 10% off
      }
    }

    setTotalPrice(pricePerPax * quantity);
  }, [quantity, basePrice, promoPrice, category]);

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
      </div>

      <div className="pt-4 border-t border-foreground/10">
        <div className="flex justify-between items-center mb-4">
          <span className="text-foreground/70">{t('booking.totalPrice')}</span>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
            Rp {totalPrice.toLocaleString('id-ID')}
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t('booking.processing') : t('booking.bookNow')}
        </button>
      </div>
    </form>
  );
}
