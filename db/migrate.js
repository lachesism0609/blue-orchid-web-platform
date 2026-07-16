import 'dotenv/config'
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to migrate PostgreSQL.')
}

const database = drizzle(process.env.DATABASE_URL)

try {
  await migrate(database, { migrationsFolder: './drizzle' })
  console.log('PostgreSQL migrations applied successfully.')
} catch (error) {
  const details = error instanceof Error ? error.stack || error.message : String(error)
  console.error(`PostgreSQL migration failed: ${details}`)
  process.exitCode = 1
}
