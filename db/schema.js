import { index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull().default(''),
  passwordHash: text('password_hash').notNull(),
  passwordSalt: text('password_salt').notNull(),
  emailVerified: integer('email_verified').notNull().default(0),
  verificationTokenHash: text('verification_token_hash'),
  verificationExpiresAt: timestamp('verification_expires_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
}, table => [uniqueIndex('users_email_idx').on(table.email), uniqueIndex('users_verification_token_hash_idx').on(table.verificationTokenHash)])

export const addresses = pgTable('addresses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipient: text('recipient').notNull(),
  phone: text('phone').notNull(),
  line1: text('line1').notNull(),
  city: text('city').notNull(),
  postcode: text('postcode').notNull(),
  country: text('country').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
}, table => [index('addresses_user_id_idx').on(table.userId)])

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  total: integer('total').notNull(),
  status: text('status').notNull(),
  addressJson: jsonb('address_json').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
}, table => [index('orders_user_id_created_at_idx').on(table.userId, table.createdAt)])

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull(),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull()
}, table => [index('order_items_order_id_idx').on(table.orderId)])
