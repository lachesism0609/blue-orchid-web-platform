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
            throw new Error(`Unexpected first query: ${sql}`)
          },
          async run() {
            if (!sql.startsWith('INSERT INTO users')) throw new Error(`Unexpected run query: ${sql}`)
            const [id, name, email, phone, password_hash, password_salt, created_at] = values
            database.users.push({ id, name, email, phone, password_hash, password_salt, created_at })
            return { success: true, meta: { changes: 1 } }
          }
        }
      }
    }
  }
}

const env = () => ({ DB: new AuthDatabase(), AUTH_SECRET: 'test-secret-that-is-not-used-in-production' })

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

test('registers, logs in, rejects a bad password, and validates the token', async () => {
  const databaseEnv = env()
  const credentials = { name: 'Blue Orchid User', email: 'user@example.com', password: 'eRkaC7iT39b!4d5' }

  const registration = await onRequest(context(databaseEnv, 'auth/register', { method: 'POST', body: credentials }))
  assert.equal(registration.status, 201)
  const registered = await registration.json()
  assert.equal(registered.user.email, credentials.email)
  assert.ok(registered.token)
  assert.notEqual(databaseEnv.DB.users[0].password_hash, credentials.password)

  const login = await onRequest(context(databaseEnv, 'auth/login', { method: 'POST', body: { email: credentials.email, password: credentials.password } }))
  assert.equal(login.status, 200)
  assert.ok((await login.json()).token)

  const rejected = await onRequest(context(databaseEnv, 'auth/login', { method: 'POST', body: { email: credentials.email, password: 'incorrect-password' } }))
  assert.equal(rejected.status, 401)

  const currentUser = await onRequest(context(databaseEnv, 'auth/me', { token: registered.token }))
  assert.equal(currentUser.status, 200)
  assert.equal((await currentUser.json()).user.name, credentials.name)
})
