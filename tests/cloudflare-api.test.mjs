import assert from 'node:assert/strict'
import test from 'node:test'
import { onRequest } from '../functions/api/[[path]].js'

class AuthDatabase {
  constructor() { this.users = []; this.sessions = []; this.rateLimits = new Map() }

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
            if (sql === 'SELECT * FROM sessions WHERE token_hash = ?') return database.sessions.find(entry => entry.token_hash === values[0]) || null
            if (sql === 'SELECT * FROM rate_limits WHERE key = ?') return database.rateLimits.get(values[0]) || null
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
            } else if (sql.startsWith('INSERT INTO sessions')) {
              const [id, user_id, token_hash, created_at, expires_at, last_seen_at, user_agent, ip_address] = values
              database.sessions.push({ id, user_id, token_hash, created_at, expires_at, last_seen_at, user_agent, ip_address, revoked_at: null })
            } else if (sql.startsWith('UPDATE sessions SET last_seen_at')) {
              const session = database.sessions.find(entry => entry.id === values[1]); session.last_seen_at = values[0]
            } else if (sql.startsWith('UPDATE sessions SET revoked_at')) {
              for (const session of database.sessions) if ((sql.includes('token_hash') && session.token_hash === values[1]) || (sql.includes('user_id') && session.user_id === values[1])) session.revoked_at = values[0]
            } else if (sql.startsWith('INSERT INTO rate_limits')) {
              database.rateLimits.set(values[0], { key: values[0], count: 1, reset_at: values[1] })
            } else if (sql.startsWith('UPDATE rate_limits SET count')) {
              const limit = database.rateLimits.get(values[0]); limit.count += 1
            } else throw new Error(`Unexpected run query: ${sql}`)
            return { success: true, meta: { changes: 1 } }
          }
        }
      }
    }
  }
}

const env = () => ({ DB: new AuthDatabase(), AUTH_SECRET: 'test-secret-that-is-not-used-in-production', DEV_EMAIL_VERIFICATION: 'true' })

function context(databaseEnv, path, { method = 'GET', body, token, cookie, protocol = 'https:' } = {}) {
  return {
    env: databaseEnv,
    params: { path: path.split('/') },
    request: new Request(`${protocol}//blue-orchid.pages.dev/api/${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(cookie ? { Cookie: cookie } : {})
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

test('returns the latest EUR/CNY reference rate', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async url => {
    assert.equal(url, 'https://api.frankfurter.dev/v2/rate/EUR/CNY')
    return new Response(JSON.stringify({ date: '2026-07-16', base: 'EUR', quote: 'CNY', rate: 8.25 }), { status: 200 })
  }
  try {
    const response = await onRequest(context(env(), 'exchange-rate'))
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { base: 'EUR', quote: 'CNY', rate: 8.25, date: '2026-07-16', source: 'Frankfurter' })
    assert.match(response.headers.get('cache-control'), /max-age=3600/)
  } finally { globalThis.fetch = originalFetch }
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
  assert.equal(loggedIn.token, undefined)
  const setCookie = login.headers.get('set-cookie')
  assert.match(setCookie, /HttpOnly/)
  assert.match(setCookie, /Secure/)
  assert.match(setCookie, /SameSite=Strict/)
  const cookie = setCookie.split(';')[0]

  const rejected = await onRequest(context(databaseEnv, 'auth/login', { method: 'POST', body: { email: credentials.email, password: 'incorrect-password' } }))
  assert.equal(rejected.status, 401)

  const currentUser = await onRequest(context(databaseEnv, 'auth/me', { cookie }))
  assert.equal(currentUser.status, 200)
  assert.equal((await currentUser.json()).user.name, credentials.name)

  const logout = await onRequest(context(databaseEnv, 'auth/logout', { method: 'POST', cookie }))
  assert.equal(logout.status, 200)
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/)
  const revoked = await onRequest(context(databaseEnv, 'auth/me', { cookie }))
  assert.equal(revoked.status, 401)
})

test('redirects non-local HTTP requests to HTTPS', async () => {
  const response = await onRequest(context(env(), 'products', { protocol: 'http:' }))
  assert.equal(response.status, 308)
  assert.equal(response.headers.get('location'), 'https://blue-orchid.pages.dev/api/products')
})

test('rate limits repeated login attempts', async () => {
  const databaseEnv = env()
  let response
  for (let index = 0; index < 11; index += 1) response = await onRequest(context(databaseEnv, 'auth/login', { method: 'POST', body: { email: 'none@example.com', password: 'bad-password' } }))
  assert.equal(response.status, 429)
  assert.ok(Number(response.headers.get('retry-after')) > 0)
})
