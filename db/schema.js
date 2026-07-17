import { sql } from 'drizzle-orm'
import { check, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull().default(''),
    role: text('role').notNull().default('customer'),
    passwordHash: text('password_hash').notNull(),
    passwordSalt: text('password_salt').notNull(),
    emailVerified: integer('email_verified').notNull().default(0),
    verificationTokenHash: text('verification_token_hash'),
    verificationExpiresAt: timestamp('verification_expires_at', {
      withTimezone: true,
      mode: 'string',
    }),
    passwordResetTokenHash: text('password_reset_token_hash'),
    passwordResetExpiresAt: timestamp('password_reset_expires_at', {
      withTimezone: true,
      mode: 'string',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('users_email_idx').on(table.email),
    uniqueIndex('users_verification_token_hash_idx').on(table.verificationTokenHash),
    uniqueIndex('users_password_reset_token_hash_idx').on(table.passwordResetTokenHash),
    index('users_role_idx').on(table.role),
    check('users_role_check', sql`${table.role} IN ('customer', 'admin')`),
  ],
)

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
    lastSeenAt: timestamp('last_seen_at', {
      withTimezone: true,
      mode: 'string',
    })
      .notNull()
      .defaultNow(),
    userAgent: text('user_agent').notNull().default(''),
    ipAddress: text('ip_address').notNull().default(''),
  },
  (table) => [uniqueIndex('sessions_token_hash_idx').on(table.tokenHash), index('sessions_user_id_idx').on(table.userId), index('sessions_expires_at_idx').on(table.expiresAt)],
)

export const rateLimits = pgTable(
  'rate_limits',
  {
    key: text('key').primaryKey(),
    count: integer('count').notNull().default(0),
    resetAt: timestamp('reset_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
  },
  (table) => [index('rate_limits_reset_at_idx').on(table.resetAt)],
)

export const products = pgTable(
  'products',
  {
    id: integer('id').primaryKey(),
    category: text('category').notNull(),
    nameZh: text('name_zh').notNull(),
    nameEn: text('name_en').notNull(),
    descriptionZh: text('description_zh').notNull(),
    descriptionEn: text('description_en').notNull(),
    materialsZh: text('materials_zh').notNull(),
    materialsEn: text('materials_en').notNull(),
    price: integer('price').notNull(),
    salePercent: integer('sale_percent'),
    imageUrl: text('image_url').notNull(),
    active: integer('active').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('products_category_active_idx').on(table.category, table.active),
    index('products_sale_percent_idx').on(table.salePercent),
    check('products_price_check', sql`${table.price} >= 0`),
    check('products_sale_percent_check', sql`${table.salePercent} IS NULL OR (${table.salePercent} BETWEEN 1 AND 99)`),
    check('products_active_check', sql`${table.active} IN (0, 1)`),
  ],
)

export const productVariants = pgTable(
  'product_variants',
  {
    id: integer('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    nameZh: text('name_zh').notNull(),
    nameEn: text('name_en').notNull(),
    colorHex: text('color_hex').notNull(),
    imageUrl: text('image_url').notNull(),
    position: integer('position').notNull().default(0),
  },
  (table) => [uniqueIndex('product_variants_code_idx').on(table.code), uniqueIndex('product_variants_product_position_idx').on(table.productId, table.position)],
)

export const productSizes = pgTable(
  'product_sizes',
  {
    id: integer('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    position: integer('position').notNull().default(0),
  },
  (table) => [uniqueIndex('product_sizes_product_label_idx').on(table.productId, table.label), uniqueIndex('product_sizes_product_position_idx').on(table.productId, table.position)],
)

export const productSkus = pgTable(
  'product_skus',
  {
    id: integer('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    variantId: integer('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    sizeId: integer('size_id')
      .notNull()
      .references(() => productSizes.id, { onDelete: 'cascade' }),
    sku: text('sku').notNull(),
    stock: integer('stock').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('product_skus_sku_idx').on(table.sku),
    uniqueIndex('product_skus_variant_size_idx').on(table.variantId, table.sizeId),
    index('product_skus_product_stock_idx').on(table.productId, table.stock),
    check('product_skus_stock_check', sql`${table.stock} >= 0`),
  ],
)

export const favourites = pgTable(
  'favourites',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.productId] }), index('favourites_user_created_at_idx').on(table.userId, table.createdAt)],
)

export const cartItems = pgTable(
  'cart_items',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    variantId: integer('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    sizeId: integer('size_id')
      .notNull()
      .references(() => productSizes.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('cart_items_user_variant_size_idx').on(table.userId, table.variantId, table.sizeId),
    index('cart_items_user_created_at_idx').on(table.userId, table.createdAt),
    check('cart_items_quantity_check', sql`${table.quantity} BETWEEN 1 AND 10`),
  ],
)

export const productInventory = pgTable(
  'product_inventory',
  {
    productId: integer('product_id').primaryKey(),
    stock: integer('stock').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [index('product_inventory_stock_idx').on(table.stock)],
)

export const errorEvents = pgTable(
  'error_events',
  {
    id: text('id').primaryKey(),
    source: text('source').notNull(),
    message: text('message').notNull(),
    stack: text('stack').notNull().default(''),
    url: text('url').notNull().default(''),
    userAgent: text('user_agent').notNull().default(''),
    ipHash: text('ip_hash').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [index('error_events_created_at_idx').on(table.createdAt), index('error_events_source_idx').on(table.source)],
)

export const addresses = pgTable(
  'addresses',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipient: text('recipient').notNull(),
    phone: text('phone').notNull(),
    line1: text('line1').notNull(),
    city: text('city').notNull(),
    postcode: text('postcode').notNull(),
    country: text('country').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [index('addresses_user_id_idx').on(table.userId)],
)

export const orders = pgTable(
  'orders',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    total: integer('total').notNull(),
    status: text('status').notNull(),
    addressJson: jsonb('address_json').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [index('orders_user_id_created_at_idx').on(table.userId, table.createdAt)],
)

export const orderItems = pgTable(
  'order_items',
  {
    id: serial('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: integer('product_id').notNull(),
    name: text('name').notNull(),
    quantity: integer('quantity').notNull(),
    size: text('size').notNull().default('One size'),
    variantId: integer('variant_id').references(() => productVariants.id, {
      onDelete: 'set null',
    }),
    variantName: text('variant_name').notNull().default('Default'),
    unitPrice: integer('unit_price').notNull(),
  },
  (table) => [index('order_items_order_id_idx').on(table.orderId)],
)
