import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Helper for timestamps
const timestamp = (name: string) =>
  text(name).default(sql`CURRENT_TIMESTAMP`);

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'staff', 'user', 'school'] })
    .default('user')
    .notNull(),
  created_at: timestamp('created_at'),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  roleIdx: index('idx_users_role').on(table.role),
}));

export const ticketPackages = sqliteTable('ticket_packages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  category: text('category', { enum: ['personal', 'school'] }).notNull(),
  description: text('description').notNull(),
  base_price: integer('base_price').notNull(),
  promo_price: integer('promo_price'),
  quota_per_day: integer('quota_per_day').notNull().default(50),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  created_at: timestamp('created_at'),
}, (table) => ({
  activeIdx: index('idx_packages_active').on(table.is_active),
  categoryIdx: index('idx_packages_category').on(table.category),
}));

export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: text('user_id').notNull().references(() => users.id),
  package_id: text('package_id').notNull().references(() => ticketPackages.id),
  visit_date: text('visit_date').notNull(), // YYYY-MM-DD
  quantity: integer('quantity').notNull(),
  total_price: integer('total_price').notNull(),
  status: text('status', { enum: ['pending', 'paid', 'cancelled'] })
    .default('pending')
    .notNull(),
  created_at: timestamp('created_at'),
}, (table) => ({
  userIdx: index('idx_bookings_user').on(table.user_id),
  packageIdx: index('idx_bookings_package').on(table.package_id),
  dateIdx: index('idx_bookings_date').on(table.visit_date),
  statusIdx: index('idx_bookings_status').on(table.status),
}));

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  booking_id: text('booking_id').notNull().unique().references(() => bookings.id),
  provider: text('provider').notNull(),
  payment_status: text('payment_status', { enum: ['pending', 'success', 'failed'] })
    .default('pending'),
  external_ref: text('external_ref'),
  paid_at: text('paid_at'),
  created_at: timestamp('created_at'),
}, (table) => ({
  bookingIdx: index('idx_payments_booking').on(table.booking_id),
  statusIdx: index('idx_payments_status').on(table.payment_status),
}));

export const qrTickets = sqliteTable('qr_tickets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  booking_id: text('booking_id').notNull().references(() => bookings.id),
  qr_token: text('qr_token').notNull().unique(),
  is_checked_in: integer('is_checked_in', { mode: 'boolean' }).default(false),
  checked_in_at: text('checked_in_at'),
  created_at: timestamp('created_at'),
}, (table) => ({
  bookingIdx: index('idx_tickets_booking').on(table.booking_id),
  tokenIdx: index('idx_tickets_token').on(table.qr_token),
  checkinIdx: index('idx_tickets_checkin').on(table.is_checked_in),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const ticketPackagesRelations = relations(ticketPackages, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.user_id],
    references: [users.id],
  }),
  package: one(ticketPackages, {
    fields: [bookings.package_id],
    references: [ticketPackages.id],
  }),
  payment: one(payments, {
    fields: [bookings.id],
    references: [payments.booking_id],
  }),
  qrTickets: many(qrTickets),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.booking_id],
    references: [bookings.id],
  }),
}));

export const qrTicketsRelations = relations(qrTickets, ({ one }) => ({
  booking: one(bookings, {
    fields: [qrTickets.booking_id],
    references: [bookings.id],
  }),
}));
