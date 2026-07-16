import assert from 'node:assert/strict'
import test from 'node:test'
import { onRequest } from '../functions/api/[[path]].js'

class AuthDatabase {
  constructor() { this.users = [] }

  prepare(sql) {
    const database = this
    return {
      bind(...values) {
        return {
          async first() {
            if (sql === 'SELECT id FROM users WHERE email = ?') {
              const user = database.users.find(entry => entry.email === values[0])
              return user ? { id: user.id } : null
            }
            if (sql === 'SELECT * FROM users WHERE email = ?') return database.users.find(entry => entry.email === values[0]) || null
            if (sql === 'SELECT * FROM users WHERE id = ?') return database.users.find(entry => entry.id === values[0]) || null
            if (sql === 'SELECT * FROM users WHERE verification_token_hash = ?') return database.users.find(entry => entry.verification_token_hash === values[0]) || null
            throw new Error(`Unexpected first query: ${sql}`)
          },
          async run() {
            if (sql.startsWith('INSERT INTO users')) {
              const [id, name, email, phone, password_hash, password_salt, created_at] = values
              database.users.push({ id, name, email, phone, password_hash, password_salt, email_verified: 0, created_at })
            } else if (sql.startsWith('UPDATE users SET verification_token_hash')) {
              const user = database.users.find(entry => entry.id === values[2])
              Object.assign(user, { verification_token_hash: values[0], verification_expires_at: values[1] })
            } else if (sql.startsWith('UPDATE users SET email_verified')) {
              const user = database.users.find(entry => entry.id === values[0])
              Object.assign(user, { email_verified: 1, verification_token_hash: null, verification_expires_at: null })
            } else if (sql.startsWith('DELETE FROM users')) {
              database.users = database.users.filter(entry => entry.id !== values[0])
            } else throw new Error(`Unexpected run query: ${sql}`)
            return { success: true, meta: { changes: 1 } }
          }
        }
      }
    }
  }
}

const env = () => ({ DB: new AuthDatabase(), AUTH_SECRET: 'test-secret-that-is-not-used-in-production', DEV_EMAIL_VERIFICATION: 'true' })

function context(databaseEnv, path, { method = 'GET', body, token } = {}) {
  return {
    env: databaseEnv,
    params: { path: path.split('/') },
    request: new Request(`https://blue-orchid.pages.dev/api/${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    })
  }
}

test('returns the complete product catalogue', async () => {
  const response = await onRequest(context(env(), 'products'))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).length, 30)
})

test('registers, verifies email, logs in, rejects a bad password, and validates the token', async () => {
  const databaseEnv = env()
  const credentials = { name: 'Blue Orchid User', email: 'user@example.com', password: 'eRkaC7iT39b!4d5' }

  const registration = await onRequest(context(databaseEnv, 'auth/register', { method: 'POST', body: credentials }))
  assert.equal(registration.status, 201)
  const registered = await registration.json()
  assert.equal(registered.requiresVerification, true)
  assert.ok(registered.verificationUrl)
  assert.notEqual(databaseEnv.DB.users[0].password_hash, credentials.password)

  const blockedLogin = await onRequest(context(databaseEnv, 'auth/login', { method: 'POST', body: { email: credentials.email, password: credentials.password } }))
  assert.equal(blockedLogin.status, 403)

  const verificationToken = new URL(registered.verificationUrl).searchParams.get('token')
  const verification = await onRequest({ ...context(databaseEnv, 'auth/verify-email'), request: new Request(`https://blue-orchid.pages.dev/api/auth/verify-email?token=${verificationToken}`) })
  assert.equal(verification.status, 200)

  const login = await onRequest(context(databaseEnv, 'auth/login', { method: 'POST', body: { email: credentials.email, password: credentials.password } }))
  assert.equal(login.status, 200)
  const loggedIn = await login.json()
  assert.ok(loggedIn.token)

  const rejected = await onRequest(context(databaseEnv, 'auth/login', { method: 'POST', body: { email: credentials.email, password: 'incorrect-password' } }))
  assert.equal(rejected.status, 401)

  const currentUser = await onRequest(context(databaseEnv, 'auth/me', { token: loggedIn.token }))
  assert.equal(currentUser.status, 200)
  assert.equal((await currentUser.json()).user.name, credentials.name)
})
