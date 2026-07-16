import { neon } from '@neondatabase/serverless'

function postgresPlaceholders(query) {
  let index = 0
  return query.replace(/\?/g, () => `$${++index}`)
}

function postgresDatabase(connectionString) {
  const sql = neon(connectionString)
  const prepare = query => ({
    bind: (...params) => {
      const text = postgresPlaceholders(query)
      return {
        _text: text,
        _params: params,
        first: async () => (await sql.query(text, params))[0] || null,
        all: async () => ({ results: await sql.query(text, params) }),
        run: async () => {
          const result = await sql.query(text, params, { fullResults: true })
          return { success: true, meta: { changes: result.rowCount || 0 } }
        }
      }
    }
  })

  return {
    kind: 'postgresql',
    prepare,
    batch: async statements => {
      await sql.transaction(statements.map(statement => sql.query(statement._text, statement._params)))
      return statements.map(() => ({ success: true }))
    }
  }
}

export function createDatabase(env) {
  if (env.DATABASE_URL) return postgresDatabase(env.DATABASE_URL)
  return env.DB || null
}
