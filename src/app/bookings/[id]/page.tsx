import { db } from '@/db';
import { bookings, ticketPackages, qrTickets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PaymentButton from '@/components/PaymentButton'; // Client component
import QRCodeDisplay from '@/components/QRCodeDisplay'; // Client component

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function BookingPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/login');
  }

  const { id } = await params;

  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, id),
    with: {
      package: true,
      qrTickets: true,
    },
  });

  if (!booking) {
    notFound();
  }

  if (booking.user_id !== session.user.id && session.user.role !== 'admin') {
    return <div className="p-8 text-center text-red-600">Access Denied</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Booking Details</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {booking.id}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            booking.status === 'paid' ? 'bg-green-100 text-green-800' :
            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {booking.status.toUpperCase()}
          </span>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Package</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.package.name}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Visit Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.visit_date}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Quantity</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.quantity} pax</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Price</dt>
              <dd className="mt-1 text-lg font-bold text-green-600 sm:mt-0 sm:col-span-2">
                Rp {booking.total_price.toLocaleString('id-ID')}
              </dd>
            </div>
          </dl>
        </div>
        
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200 flex justify-end">
          {booking.status === 'pending' && (
            <PaymentButton bookingId={booking.id} amount={booking.total_price} />
          )}
          {booking.status === 'paid' && (
            <div className="w-full">
              <h4 className="font-medium mb-4">Your E-Tickets</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {booking.qrTickets.map((ticket, index) => (
                  <div key={ticket.id} className="border p-4 rounded bg-white flex flex-col items-center text-center">
                    <p className="font-semibold mb-2">Ticket #{index + 1}</p>
                    <QRCodeDisplay value={ticket.qr_token} size={150} />
                    <p className="text-xs text-gray-500 mt-2 font-mono">{ticket.qr_token.slice(0, 8)}...</p>
                    <div className={`mt-2 px-2 py-1 text-xs rounded-full ${
                      ticket.is_checked_in ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-800'
                    }`}>
                      {ticket.is_checked_in ? 'CHECKED IN' : 'VALID'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
