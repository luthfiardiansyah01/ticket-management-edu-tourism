import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/login');
  }

  const userBookings = await db.query.bookings.findMany({
    where: eq(bookings.user_id, session.user.id),
    with: {
      package: true,
    },
    orderBy: [desc(bookings.created_at)],
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        {session.user.role === 'admin' && (
          <Link href="/dashboard/admin" className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">
            Admin Panel
          </Link>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {userBookings.length === 0 ? (
             <li className="px-4 py-4 sm:px-6 text-center text-gray-500">No bookings found.</li>
          ) : (
            userBookings.map((booking) => (
              <li key={booking.id}>
                <Link href={`/bookings/${booking.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-green-600 truncate">
                        {booking.package.name}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === 'paid' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.status.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Visit Date: {booking.visit_date}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          Qty: {booking.quantity} pax
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Total: Rp {booking.total_price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
