import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { readMigrationFiles } from 'drizzle-orm/migrator'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to migrate PostgreSQL.')
}

const sql = neon(process.env.DATABASE_URL)
const migrations = readMigrationFiles({ migrationsFolder: './drizzle' })

await sql`CREATE SCHEMA IF NOT EXISTS drizzle`
await sql`
  CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  )
`

// Releases before the managed migration pipeline created parts of this schema
// directly. Complete that additive legacy schema before recording its baseline.
await sql.transaction([
  sql.query(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      "key" text PRIMARY KEY NOT NULL,
      "count" integer DEFAULT 0 NOT NULL,
      "reset_at" timestamp with time zone NOT NULL
    )
  `, []),
  sql.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL,
      "token_hash" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "expires_at" timestamp with time zone NOT NULL,
      "revoked_at" timestamp with time zone,
      "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
      "user_agent" text DEFAULT '' NOT NULL,
      "ip_address" text DEFAULT '' NOT NULL
    )
  `, []),
  sql.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_user_id_users_id_fk') THEN
        ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_users_id_fk
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END $$
  `, []),
  sql.query('CREATE INDEX IF NOT EXISTS rate_limits_reset_at_idx ON rate_limits (reset_at)', []),
  sql.query('CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions (token_hash)', []),
  sql.query('CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id)', []),
  sql.query('CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at)', []),
  sql.query(`
    CREATE TABLE IF NOT EXISTS product_inventory (
      "product_id" integer PRIMARY KEY NOT NULL,
      "stock" integer DEFAULT 0 NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `, []),
  sql.query('CREATE INDEX IF NOT EXISTS product_inventory_stock_idx ON product_inventory (stock)', []),
  sql.query("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size text DEFAULT 'One size' NOT NULL", []),
  sql.query(`
    CREATE TABLE IF NOT EXISTS error_events (
      "id" text PRIMARY KEY NOT NULL,
      "source" text NOT NULL,
      "message" text NOT NULL,
      "stack" text DEFAULT '' NOT NULL,
      "url" text DEFAULT '' NOT NULL,
      "user_agent" text DEFAULT '' NOT NULL,
      "ip_hash" text DEFAULT '' NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `, []),
  sql.query('CREATE INDEX IF NOT EXISTS error_events_created_at_idx ON error_events (created_at)', []),
  sql.query('CREATE INDEX IF NOT EXISTS error_events_source_idx ON error_events (source)', [])
])

const legacy = await sql`
  SELECT
    to_regclass('public.addresses') IS NOT NULL AS addresses,
    to_regclass('public.order_items') IS NOT NULL AS order_items,
    to_regclass('public.orders') IS NOT NULL AS orders,
    to_regclass('public.users') IS NOT NULL AS users,
    to_regclass('public.addresses_user_id_idx') IS NOT NULL AS addresses_user_id_idx,
    to_regclass('public.order_items_order_id_idx') IS NOT NULL AS order_items_order_id_idx,
    to_regclass('public.orders_user_id_created_at_idx') IS NOT NULL AS orders_user_id_created_at_idx,
    to_regclass('public.users_email_idx') IS NOT NULL AS users_email_idx,
    to_regclass('public.users_verification_token_hash_idx') IS NOT NULL AS users_verification_token_hash_idx,
    EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'addresses_user_id_users_id_fk') AS addresses_user_fk,
    EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_order_id_orders_id_fk') AS order_items_order_fk,
    EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_users_id_fk') AS orders_user_fk,
    to_regclass('public.rate_limits') IS NOT NULL AS rate_limits,
    to_regclass('public.sessions') IS NOT NULL AS sessions,
    to_regclass('public.rate_limits_reset_at_idx') IS NOT NULL AS rate_limits_reset_at_idx,
    to_regclass('public.sessions_token_hash_idx') IS NOT NULL AS sessions_token_hash_idx,
    to_regclass('public.sessions_user_id_idx') IS NOT NULL AS sessions_user_id_idx,
    to_regclass('public.sessions_expires_at_idx') IS NOT NULL AS sessions_expires_at_idx,
    EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_user_id_users_id_fk') AS sessions_user_fk,
    to_regclass('public.product_inventory') IS NOT NULL AS product_inventory,
    to_regclass('public.product_inventory_stock_idx') IS NOT NULL AS product_inventory_stock_idx,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'size'
    ) AS order_items_size,
    to_regclass('public.error_events') IS NOT NULL AS error_events,
    to_regclass('public.error_events_created_at_idx') IS NOT NULL AS error_events_created_at_idx,
    to_regclass('public.error_events_source_idx') IS NOT NULL AS error_events_source_idx
`

const state = legacy[0]
const completeLegacyMigrations = [
  ['addresses', 'order_items', 'orders', 'users', 'addresses_user_id_idx', 'order_items_order_id_idx', 'orders_user_id_created_at_idx', 'users_email_idx', 'users_verification_token_hash_idx', 'addresses_user_fk', 'order_items_order_fk', 'orders_user_fk'],
  ['rate_limits', 'sessions', 'rate_limits_reset_at_idx', 'sessions_token_hash_idx', 'sessions_user_id_idx', 'sessions_expires_at_idx', 'sessions_user_fk'],
  ['product_inventory', 'product_inventory_stock_idx'],
  ['order_items_size'],
  ['error_events', 'error_events_created_at_idx', 'error_events_source_idx']
]

const appliedRows = await sql`SELECT created_at FROM drizzle.__drizzle_migrations`
const applied = new Set(appliedRows.map(row => Number(row.created_at)))

for (let index = 0; index < completeLegacyMigrations.length; index += 1) {
  const migration = migrations[index]
  if (!migration || applied.has(migration.folderMillis)) continue
  if (!completeLegacyMigrations[index].every(key => state[key])) break

  await sql`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (${migration.hash}, ${migration.folderMillis})
  `
  applied.add(migration.folderMillis)
  console.log(`Recorded existing legacy schema as migration ${index}.`)
}

function describeError(error) {
  if (!(error instanceof Error)) return String(error)
  const metadata = ['code', 'detail', 'hint', 'table', 'column', 'constraint']
    .filter(key => error[key])
    .map(key => `${key}=${error[key]}`)
  const cause = error.cause ? `\nCaused by: ${describeError(error.cause)}` : ''
  return `${error.stack || error.message}${metadata.length ? `\n${metadata.join(', ')}` : ''}${cause}`
}

try {
  for (let index = 0; index < migrations.length; index += 1) {
    const migration = migrations[index]
    if (applied.has(migration.folderMillis)) continue

    const statements = migration.sql.filter(statement => statement.trim())
    await sql.transaction([
      ...statements.map(statement => sql.query(statement, [])),
      sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${migration.hash}, ${migration.folderMillis})`
    ])
    applied.add(migration.folderMillis)
    console.log(`Applied PostgreSQL migration ${index}.`)
  }
  console.log('PostgreSQL migrations applied successfully.')
} catch (error) {
  console.error(`PostgreSQL migration failed: ${describeError(error)}`)
  process.exitCode = 1
}
