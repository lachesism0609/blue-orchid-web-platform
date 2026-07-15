import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const node = process.execPath
const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const api = spawn(node, ['server/index.js'], { cwd: root, stdio: 'inherit', env: { ...process.env, PORT: '3010' } })
const client = spawn(node, [vite], { cwd: root, stdio: 'inherit' })

function shutdown() {
  api.kill()
  client.kill()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
api.on('exit', code => { if (code && code !== 0) process.exitCode = code })
client.on('exit', code => { if (code && code !== 0) process.exitCode = code })
