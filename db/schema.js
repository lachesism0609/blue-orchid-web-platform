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

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  userAgent: text('user_agent').notNull().default(''),
  ipAddress: text('ip_address').notNull().default('')
}, table => [uniqueIndex('sessions_token_hash_idx').on(table.tokenHash), index('sessions_user_id_idx').on(table.userId), index('sessions_expires_at_idx').on(table.expiresAt)])

export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  resetAt: timestamp('reset_at', { withTimezone: true, mode: 'string' }).notNull()
}, table => [index('rate_limits_reset_at_idx').on(table.resetAt)])

export const productInventory = pgTable('product_inventory', {
  productId: integer('product_id').primaryKey(),
  stock: integer('stock').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
}, table => [index('product_inventory_stock_idx').on(table.stock)])

export const errorEvents = pgTable('error_events', {
  id: text('id').primaryKey(),
  source: text('source').notNull(),
  message: text('message').notNull(),
  stack: text('stack').notNull().default(''),
  url: text('url').notNull().default(''),
  userAgent: text('user_agent').notNull().default(''),
  ipHash: text('ip_hash').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
}, table => [index('error_events_created_at_idx').on(table.createdAt), index('error_events_source_idx').on(table.source)])

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
  size: text('size').notNull().default('One size'),
  unitPrice: integer('unit_price').notNull()
}, table => [index('order_items_order_id_idx').on(table.orderId)])
