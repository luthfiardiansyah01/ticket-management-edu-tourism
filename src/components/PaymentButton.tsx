'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  bookingId: string;
  amount: number;
}

export default function PaymentButton({ bookingId, amount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!confirm(`Proceed to pay Rp ${amount.toLocaleString('id-ID')}?`)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      if (!response.ok) {
        throw new Error('Payment failed');
      }

      router.refresh();
    } catch (error) {
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow transition duration-300 disabled:opacity-50"
    >
      {loading ? 'Processing...' : 'Pay Now'}
    </button>
  );
}
