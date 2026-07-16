import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

const email = String(process.env.ADMIN_EMAIL || '')
  .trim()
  .toLowerCase()
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.')
if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('ADMIN_EMAIL must be the registered customer email to promote.')

const sql = neon(process.env.DATABASE_URL)
const result = await sql`UPDATE users SET role = 'admin' WHERE lower(email) = ${email} RETURNING id, name, email, role`
if (!result.length) throw new Error(`No registered user found for ${email}. Register and verify that account first.`)
console.log(`Promoted ${result[0].email} to administrator.`)
