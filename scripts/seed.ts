
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { eq } from 'drizzle-orm';

async function main() {
  // Dynamically import db after env vars are loaded
  const { db } = await import('../src/db');
  const { ticketPackages, bookings, payments, qrTickets } = await import('../src/db/schema');

  console.log('Clearing existing data...');
  // Delete in order to respect FK constraints
  await db.delete(qrTickets);
  await db.delete(payments);
  await db.delete(bookings);
  await db.delete(ticketPackages);

  console.log('Seeding database with new ticket structure...');

  await db.insert(ticketPackages).values([
    // PILLAR 1: PUBLIC ENGAGEMENT (Personal)
    {
      name: 'Explorer Pass',
      category: 'personal',
      description: 'Standard river access, self-guided digital learning content, and basic conservation awareness material.',
      base_price: 5000,
      quota_per_day: 1000,
      is_active: true,
    },
    {
      name: 'Experience Pass',
      category: 'personal',
      description: 'Includes entry access, scheduled guided mini-tour slots, and interactive learning modules.',
      base_price: 10000,
      quota_per_day: 500,
      is_active: true,
    },
    {
      name: 'Impact Pass',
      category: 'personal',
      description: 'Full guided experience, mini conservation activity participation, digital badge, and individual impact score.',
      base_price: 15000,
      quota_per_day: 200,
      is_active: true,
    },
    
    // PILLAR 2: EDUCATION & INSTITUTIONAL PROGRAMS (School)
    {
      name: 'School Immersion Program',
      category: 'school',
      description: 'Group-based. Bundles guided ecological tour, waste management workshop, and digital learning materials.',
      base_price: 50000,
      quota_per_day: 100,
      is_active: true,
    },
    {
      name: 'Extended Conservation Program',
      category: 'school',
      description: 'Includes immersion components plus tree planting or clean-up activity, and school impact report.',
      base_price: 70000,
      quota_per_day: 50,
      is_active: true,
    },

    // PILLAR 3: RIVER LAB & STRATEGIC COLLABORATION (Mapped to 'school' for Institutional/B2B nature)
    {
      name: 'Research Access Session',
      category: 'school',
      description: 'Facilitated site access for research, community interaction session, and data access permissions.',
      base_price: 50000, // Base starting price
      quota_per_day: 20,
      is_active: true,
    },
    {
      name: 'Strategic Collaboration Package',
      category: 'school',
      description: 'Custom partnership for co-branded events, impact dashboard integration, and sponsored conservation.',
      base_price: 0, // Represents Custom/Contact Us
      quota_per_day: 5,
      is_active: true,
    }
  ]);

  console.log('Seeding complete!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
