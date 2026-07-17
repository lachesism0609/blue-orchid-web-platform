import crypto from 'node:crypto'
import express from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDatabase } from '../functions/_lib/database.js'
import { productCatalogue, selectedSku } from '../functions/_lib/catalog.js'
import { createAdminProduct, normalizeOrderStatus, orderStatuses, validateProductInput } from '../functions/_lib/admin.js'

const app = express()
const port = process.env.PORT || 3010
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDirectory = path.join(__dirname, 'data')
const usersFile = path.join(dataDirectory, 'users.json')
const authSecret = process.env.AUTH_SECRET || 'blue-orchid-development-secret-change-in-production'
const sessionDuration = 60 * 60 * 24 * 7
const sessionCookie = 'blue_orchid_session'
const verificationDuration = 60 * 60 * 24
const passwordResetDuration = 60 * 60
const siteUrl = (process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, '')
const database = createDatabase(process.env)
const adminEmails = new Set(
  String(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
)

app.use(express.json({ limit: '20kb' }))

async function readUsers() {
  await fs.mkdir(dataDirectory, { recursive: true })
  try {
    return JSON.parse(await fs.readFile(usersFile, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

async function writeUsers(users) {
  await fs.mkdir(dataDirectory, { recursive: true })
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8')
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function passwordMatches(password, storedHash) {
  const [salt, hash] = storedHash.split(':')
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'))
}

function base64url(value) {
  return Buffer.from(value).toString('base64url')
}
function createToken(user, sessionId) {
  const payload = base64url(
    JSON.stringify({
      sub: user.id,
      sid: sessionId,
      exp: Math.floor(Date.now() / 1000) + sessionDuration,
    }),
  )
  const signature = crypto.createHmac('sha256', authSecret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

function createVerificationToken() {
  return crypto.randomBytes(32).toString('base64url')
}
function verificationHash(token) {
  return crypto.createHash('sha256').update(token).digest('base64url')
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
}

async function sendVerificationEmail(user, token) {
  const verificationUrl = `${siteUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    if (process.env.DEV_EMAIL_VERIFICATION === 'true') return { verificationUrl }
    throw new Error('Email delivery is not configured')
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [user.email],
      subject: 'Verify your Blue Orchid account',
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px"><h1 style="color:#294887">Blue Orchid</h1><p>Hello ${escapeHtml(user.name)},</p><p>Confirm your email address to finish creating your account.</p><p><a href="${verificationUrl}">Verify email</a></p><p>This link expires in 24 hours.</p></div>`,
    }),
  })
  if (!response.ok) throw new Error(`Email delivery failed (${response.status})`)
  return {}
}

async function sendPasswordResetEmail(user, token) {
  const resetUrl = `${siteUrl}/?resetToken=${encodeURIComponent(token)}`
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    if (process.env.DEV_EMAIL_VERIFICATION === 'true') return { resetUrl }
    throw new Error('Email delivery is not configured')
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [user.email],
      subject: 'Reset your Blue Orchid password',
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px"><h1 style="color:#294887">Blue Orchid</h1><p>Hello ${escapeHtml(user.name)},</p><p>Use the link below to choose a new password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in one hour and can only be used once.</p></div>`,
    }),
  })
  if (!response.ok) throw new Error(`Email delivery failed (${response.status})`)
  return {}
}

function sessionDevice(userAgent) {
  const agent = String(userAgent || '')
  const browser = /Edg\//.test(agent) ? 'Edge' : /Firefox\//.test(agent) ? 'Firefox' : /Chrome\//.test(agent) ? 'Chrome' : /Safari\//.test(agent) ? 'Safari' : 'Browser'
  const platform = /Windows/i.test(agent) ? 'Windows' : /Android/i.test(agent) ? 'Android' : /iPhone|iPad/i.test(agent) ? 'iOS' : /Mac OS/i.test(agent) ? 'macOS' : /Linux/i.test(agent) ? 'Linux' : 'Unknown device'
  return `${browser} · ${platform}`
}

function publicLocalSession(session, currentId) {
  return {
    id: session.id,
    device: sessionDevice(session.userAgent),
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    createdAt: session.createdAt,
    lastSeenAt: session.lastSeenAt,
    expiresAt: session.expiresAt,
    current: session.id === currentId,
  }
}

function verifyToken(token) {
  const [payload, signature] = (token || '').split('.')
  if (!payload || !signature) return null
  const expected = crypto.createHmac('sha256', authSecret).update(payload).digest('base64url')
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return data.exp > Math.floor(Date.now() / 1000) ? data : null
  } catch {
    return null
  }
}

const localRole = (user) => (user.role === 'admin' || adminEmails.has(String(user.email).toLowerCase()) ? 'admin' : 'customer')
const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: localRole(user),
  createdAt: user.createdAt,
})
const requireAuth = async (req, res, next) => {
  const cookies = Object.fromEntries(
    String(req.headers.cookie || '')
      .split(';')
      .map((part) => part.trim().split(/=(.*)/s))
      .filter(([name]) => name),
  )
  const token = cookies[sessionCookie] || req.headers.authorization?.replace(/^Bearer\s+/i, '')
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ message: '请先登录后再继续。' })
  const users = await readUsers()
  const user = users.find((item) => item.id === payload.sub)
  if (!user) return res.status(401).json({ message: '登录状态无效，请重新登录。' })
  const session = (user.sessions || []).find((entry) => entry.id === payload.sid && !entry.revokedAt && new Date(entry.expiresAt).getTime() > Date.now())
  if (!session) return res.status(401).json({ message: '登录状态无效，请重新登录。' })
  session.lastSeenAt = new Date().toISOString()
  await writeUsers(users)
  req.user = user
  req.session = session
  next()
}
const requireAdmin = (req, res, next) => {
  if (localRole(req.user) !== 'admin') return res.status(403).json({ message: 'Administrator access is required.' })
  next()
}

app.get('/api/products', async (_req, res, next) => {
  try {
    if (!database) return res.status(503).json({ message: 'DATABASE_URL is required.' })
    return res.json(await productCatalogue(database))
  } catch (error) {
    next(error)
  }
})

app.get('/api/exchange-rate', async (_req, res, next) => {
  try {
    const response = await fetch('https://api.frankfurter.dev/v2/rate/EUR/CNY', { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error(`Exchange-rate provider returned ${response.status}`)
    const data = await response.json()
    const rate = Number(data.rate)
    if (!Number.isFinite(rate) || rate <= 0) throw new Error('Exchange-rate provider returned an invalid rate')
    res.set('Cache-Control', 'public, max-age=3600').json({
      base: 'EUR',
      quote: 'CNY',
      rate,
      date: data.date,
      source: 'Frankfurter',
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase()
    const password = String(req.body.password || '')
    if (name.length < 2 || name.length > 50) return res.status(400).json({ message: '姓名长度须为 2 至 50 个字符。' })
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: '请输入有效的邮箱地址。' })
    if (password.length < 8) return res.status(400).json({ message: '密码至少需要 8 个字符。' })
    const users = await readUsers()
    if (users.some((user) => user.email === email)) return res.status(409).json({ message: '该邮箱已经注册，请直接登录。' })
    const verificationToken = createVerificationToken()
    const user = {
      id: crypto.randomUUID(),
      name,
      email,
      phone: '',
      addresses: [],
      orders: [],
      passwordHash: hashPassword(password),
      emailVerified: false,
      verificationTokenHash: verificationHash(verificationToken),
      verificationExpiresAt: new Date(Date.now() + verificationDuration * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    }
    users.push(user)
    await writeUsers(users)
    try {
      const delivery = await sendVerificationEmail(user, verificationToken)
      return res.status(201).json({
        message: '注册成功，请查收验证邮件。',
        requiresVerification: true,
        ...delivery,
      })
    } catch (error) {
      await writeUsers(users.filter((entry) => entry.id !== user.id))
      throw error
    }
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase()
    const password = String(req.body.password || '')
    const users = await readUsers()
    const user = users.find((item) => item.email === email)
    if (!user || !passwordMatches(password, user.passwordHash)) return res.status(401).json({ message: '邮箱或密码不正确。' })
    if (user.emailVerified === false)
      return res.status(403).json({
        message: '请先完成邮箱验证后再登录。',
        code: 'EMAIL_NOT_VERIFIED',
      })
    const now = new Date().toISOString()
    const session = {
      id: crypto.randomUUID(),
      createdAt: now,
      lastSeenAt: now,
      expiresAt: new Date(Date.now() + sessionDuration * 1000).toISOString(),
      revokedAt: null,
      userAgent: req.get('user-agent') || '',
      ipAddress: req.ip || 'local',
    }
    user.sessions ||= []
    user.sessions.push(session)
    await writeUsers(users)
    res.cookie(sessionCookie, createToken(user, session.id), {
      httpOnly: true,
      sameSite: 'strict',
      secure: siteUrl.startsWith('https://'),
      maxAge: sessionDuration * 1000,
    })
    return res.json({ user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/auth/verify-email', async (req, res, next) => {
  try {
    const token = String(req.query.token || '')
    const users = await readUsers()
    const user = token ? users.find((entry) => entry.verificationTokenHash === verificationHash(token)) : null
    const valid = Boolean(user && user.verificationExpiresAt && new Date(user.verificationExpiresAt).getTime() > Date.now())
    if (valid) {
      Object.assign(user, {
        emailVerified: true,
        verificationTokenHash: null,
        verificationExpiresAt: null,
      })
      await writeUsers(users)
    }
    const title = valid ? 'Email verified' : 'Verification link invalid'
    res
      .status(valid ? 200 : 400)
      .type('html')
      .send(
        `<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:Arial;text-align:center;padding:10vh"><h1 style="color:#294887">Blue Orchid</h1><h2>${title}</h2><p>${valid ? 'You can now sign in.' : 'Please request a new verification email.'}</p><a href="${siteUrl}/?emailVerified=${valid ? '1' : '0'}">Return to store</a></body></html>`,
      )
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/resend-verification', async (req, res, next) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase()
    const users = await readUsers()
    const user = users.find((entry) => entry.email === email)
    let delivery = {}
    if (user && user.emailVerified === false) {
      const token = createVerificationToken()
      user.verificationTokenHash = verificationHash(token)
      user.verificationExpiresAt = new Date(Date.now() + verificationDuration * 1000).toISOString()
      await writeUsers(users)
      delivery = await sendVerificationEmail(user, token)
    }
    return res.json({
      message: '如果该邮箱尚未验证，我们已发送新的验证邮件。',
      ...delivery,
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/forgot-password', async (req, res, next) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase()
    const users = await readUsers()
    const user = users.find((item) => item.email === email)
    let delivery = {}
    if (user) {
      const token = createVerificationToken()
      user.passwordResetTokenHash = verificationHash(token)
      user.passwordResetExpiresAt = new Date(Date.now() + passwordResetDuration * 1000).toISOString()
      await writeUsers(users)
      delivery = await sendPasswordResetEmail(user, token)
    }
    res.json({
      message: '如果该邮箱已注册，我们已发送密码重置邮件。',
      ...delivery,
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/reset-password', async (req, res, next) => {
  try {
    const token = String(req.body.token || '')
    const password = String(req.body.password || '')
    if (password.length < 8) return res.status(400).json({ message: '密码至少需要 8 个字符。' })
    const users = await readUsers()
    const user = token ? users.find((entry) => entry.passwordResetTokenHash === verificationHash(token)) : null
    const valid = Boolean(user && user.passwordResetExpiresAt && new Date(user.passwordResetExpiresAt).getTime() > Date.now())
    if (!valid) return res.status(400).json({ message: '密码重置链接无效或已过期。' })
    user.passwordHash = hashPassword(password)
    user.passwordResetTokenHash = null
    user.passwordResetExpiresAt = null
    user.sessions = []
    await writeUsers(users)
    res.clearCookie(sessionCookie, {
      httpOnly: true,
      sameSite: 'strict',
      secure: siteUrl.startsWith('https://'),
    })
    res.json({ message: '密码已更新，请使用新密码登录。' })
  } catch (error) {
    next(error)
  }
})

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }))

app.post('/api/auth/logout', requireAuth, async (req, res, next) => {
  try {
    const users = await readUsers()
    const user = users.find((item) => item.id === req.user.id)
    const session = (user?.sessions || []).find((entry) => entry.id === req.session.id)
    if (session) session.revokedAt = new Date().toISOString()
    await writeUsers(users)
    res.clearCookie(sessionCookie, {
      httpOnly: true,
      sameSite: 'strict',
      secure: siteUrl.startsWith('https://'),
    })
    res.json({ message: 'Signed out.' })
  } catch (error) {
    next(error)
  }
})

app.get('/api/account/sessions', requireAuth, (req, res) => {
  const sessions = (req.user.sessions || [])
    .filter((session) => !session.revokedAt && new Date(session.expiresAt).getTime() > Date.now())
    .sort((left, right) => new Date(right.lastSeenAt) - new Date(left.lastSeenAt))
    .map((session) => publicLocalSession(session, req.session.id))
  res.json({ sessions })
})

app.post('/api/account/sessions/revoke-others', requireAuth, async (req, res, next) => {
  try {
    const users = await readUsers()
    const user = users.find((item) => item.id === req.user.id)
    const now = new Date().toISOString()
    for (const session of user.sessions || []) if (session.id !== req.session.id && !session.revokedAt) session.revokedAt = now
    await writeUsers(users)
    res.json({ message: 'Other sessions revoked.' })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/account/sessions/:sessionId', requireAuth, async (req, res, next) => {
  try {
    const users = await readUsers()
    const user = users.find((item) => item.id === req.user.id)
    const session = (user.sessions || []).find((entry) => entry.id === req.params.sessionId && !entry.revokedAt)
    if (!session) return res.status(404).json({ message: 'Session not found.' })
    session.revokedAt = new Date().toISOString()
    await writeUsers(users)
    const current = session.id === req.session.id
    if (current)
      res.clearCookie(sessionCookie, {
        httpOnly: true,
        sameSite: 'strict',
        secure: siteUrl.startsWith('https://'),
      })
    res.json({ current })
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/products', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    if (!database) return res.status(503).json({ message: 'DATABASE_URL is required.' })
    res.json({
      products: await productCatalogue(database, { includeInactive: true }),
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/products', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!database) return res.status(503).json({ message: 'DATABASE_URL is required.' })
    const result = await createAdminProduct(database, req.body)
    if (result.errors) return res.status(400).json({ message: result.errors[0], errors: result.errors })
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/products/:productId', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!database) return res.status(503).json({ message: 'DATABASE_URL is required.' })
    const products = await productCatalogue(database, {
      includeInactive: true,
    })
    const existing = products.find((product) => product.id === Number(req.params.productId))
    if (!existing) return res.status(404).json({ message: 'Product not found.' })
    const { value, errors } = validateProductInput({
      ...existing,
      ...req.body,
      sizes: existing.sizes,
      imageUrl: req.body.imageUrl ?? existing.image,
    })
    if (errors.length) return res.status(400).json({ message: errors[0], errors })
    await database
      .prepare('UPDATE products SET category = ?, name_zh = ?, name_en = ?, description_zh = ?, description_en = ?, materials_zh = ?, materials_en = ?, price = ?, sale_percent = ?, image_url = ?, active = ?, updated_at = ? WHERE id = ?')
      .bind(value.category, value.nameZh, value.nameEn, value.descriptionZh, value.descriptionEn, value.materialsZh, value.materialsEn, value.price, value.salePercent, value.imageUrl, value.active, new Date().toISOString(), existing.id)
      .run()
    res.json({
      product: (await productCatalogue(database, { includeInactive: true })).find((product) => product.id === existing.id),
    })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/variants/:variantId', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const nameZh = String(req.body.nameZh || '').trim()
    const nameEn = String(req.body.nameEn || '').trim()
    const colorHex = String(req.body.colorHex || '').trim()
    const imageUrl = String(req.body.imageUrl || '').trim()
    if (!nameZh || !nameEn || !imageUrl || !/^#[0-9a-f]{6}$/i.test(colorHex))
      return res.status(400).json({
        message: 'Style names, image, and a valid hex colour are required.',
      })
    const result = await database.prepare('UPDATE product_variants SET name_zh = ?, name_en = ?, color_hex = ?, image_url = ? WHERE id = ?').bind(nameZh, nameEn, colorHex, imageUrl, Number(req.params.variantId)).run()
    if (!result.meta.changes) return res.status(404).json({ message: 'Product style not found.' })
    res.json({
      products: await productCatalogue(database, { includeInactive: true }),
    })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/skus/:skuId', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const stock = Number(req.body.stock)
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000)
      return res.status(400).json({
        message: 'Stock must be a whole number between 0 and 100,000.',
      })
    const result = await database.prepare('UPDATE product_skus SET stock = ?, updated_at = ? WHERE id = ?').bind(stock, new Date().toISOString(), Number(req.params.skuId)).run()
    if (!result.meta.changes) return res.status(404).json({ message: 'SKU not found.' })
    res.json({ stock })
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/orders', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const users = await readUsers()
    const query = String(req.query.q || '')
      .trim()
      .toLowerCase()
    const status = String(req.query.status || '')
    const requestedPage = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 25))
    const allOrders = users.flatMap((user) =>
      (user.orders || []).map((order) => ({
        ...order,
        status: normalizeOrderStatus(order.status),
        customer: { id: user.id, name: user.name, email: user.email },
      })),
    )
    allOrders.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    const filtered = allOrders.filter((order) => (!query || `${order.id} ${order.customer.name} ${order.customer.email}`.toLowerCase().includes(query)) && (!status || order.status === status))
    const pages = Math.max(1, Math.ceil(filtered.length / limit))
    const page = Math.min(requestedPage, pages)
    res.json({
      orders: filtered.slice((page - 1) * limit, page * limit),
      pagination: { page, limit, total: filtered.length, pages },
    })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/orders/:orderId', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const status = String(req.body.status || '')
      .trim()
      .toLowerCase()
    if (!orderStatuses.includes(status)) return res.status(400).json({ message: 'Unsupported order status.' })
    const users = await readUsers()
    const order = users.flatMap((user) => user.orders || []).find((entry) => entry.id === req.params.orderId)
    if (!order) return res.status(404).json({ message: 'Order not found.' })
    order.status = status
    await writeUsers(users)
    res.json({ status })
  } catch (error) {
    next(error)
  }
})

app.put('/api/account/profile', requireAuth, async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim()
    const phone = String(req.body.phone || '').trim()
    if (name.length < 2 || name.length > 50) return res.status(400).json({ message: '姓名长度须为 2 至 50 个字符。' })
    if (phone.length > 30) return res.status(400).json({ message: '电话号码格式不正确。' })
    const users = await readUsers()
    const user = users.find((item) => item.id === req.user.id)
    user.name = name
    user.phone = phone
    await writeUsers(users)
    res.json({ user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/account/addresses', requireAuth, (req, res) => res.json({ addresses: req.user.addresses || [] }))

app.post('/api/account/addresses', requireAuth, async (req, res, next) => {
  try {
    const fields = ['recipient', 'phone', 'line1', 'city', 'postcode', 'country']
    const address = Object.fromEntries(fields.map((field) => [field, String(req.body[field] || '').trim()]))
    if (fields.some((field) => !address[field])) return res.status(400).json({ message: '请填写所有地址字段。' })
    const users = await readUsers()
    const user = users.find((item) => item.id === req.user.id)
    user.addresses ||= []
    const entry = {
      id: crypto.randomUUID(),
      ...address,
      createdAt: new Date().toISOString(),
    }
    user.addresses.push(entry)
    await writeUsers(users)
    res.status(201).json({ address: entry })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/account/addresses/:addressId', requireAuth, async (req, res, next) => {
  try {
    const users = await readUsers()
    const user = users.find((item) => item.id === req.user.id)
    const before = (user.addresses || []).length
    user.addresses = (user.addresses || []).filter((address) => address.id !== req.params.addressId)
    if (user.addresses.length === before) return res.status(404).json({ message: '未找到该地址。' })
    await writeUsers(users)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

app.get('/api/account/store-state', requireAuth, (req, res) =>
  res.json({
    favourites: req.user.favourites || [],
    cart: req.user.cart || [],
  }),
)

app.put('/api/account/favourites/:productId', requireAuth, async (req, res, next) => {
  try {
    if (!database) return res.status(503).json({ message: 'DATABASE_URL is required.' })
    const productId = Number(req.params.productId)
    const catalogue = await productCatalogue(database)
    if (!catalogue.some((product) => product.id === productId)) return res.status(404).json({ message: 'Product not found.' })
    const users = await readUsers()
    const user = users.find((item) => item.id === req.user.id)
    user.favourites = [...new Set([...(user.favourites || []), productId])]
    await writeUsers(users)
    res.json({ favourites: user.favourites, cart: user.cart || [] })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/account/favourites/:productId', requireAuth, async (req, res, next) => {
  try {
    const users = await readUsers()
    const user = users.find((item) => item.id === req.user.id)
    user.favourites = (user.favourites || []).filter((productId) => productId !== Number(req.params.productId))
    await writeUsers(users)
    res.json({ favourites: user.favourites, cart: user.cart || [] })
  } catch (error) {
    next(error)
  }
})

app.post('/api/account/cart', requireAuth, async (req, res, next) => {
  try {
    if (!database) return res.status(503).json({ message: 'DATABASE_URL is required.' })
    const catalogue = await productCatalogue(database)
    const product = catalogue.find((entry) => entry.id === Number(req.body.productId))
    if (!product) return res.status(404).json({ message: 'Product not found.' })
    const quantity = Number(req.body.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return res.status(400).json({ message: 'Quantity must be between 1 and 10.' })
    const selection = selectedSku(product, Number(req.body.variantId), String(req.body.size || ''))
    if (selection.error)
      return res.status(400).json({
        message: 'The selected style or size is not available.',
        code: selection.error,
      })
    const users = await readUsers()
    const user = users.find((item) => item.id === req.user.id)
    user.cart ||= []
    const existing = user.cart.find((item) => item.variantId === selection.variant.id && item.size === selection.sku.size)
    const desiredQuantity = Number(existing?.quantity || 0) + quantity
    if (desiredQuantity > Math.min(10, selection.sku.stock))
      return res.status(409).json({
        message: `${product.name} has only ${selection.sku.stock} item(s) available in this style and size.`,
        code: 'INSUFFICIENT_STOCK',
        available: selection.sku.stock,
      })
    if (existing) existing.quantity = desiredQuantity
    else
      user.cart.push({
        id: crypto.randomUUID(),
        productId: product.id,
        variantId: selection.variant.id,
        size: selection.sku.size,
        colorIndex: selection.variant.position,
        quantity,
      })
    await writeUsers(users)
    res.status(201).json({ favourites: user.favourites || [], cart: user.cart })
  } catch (error) {
    next(error)
  }
})

app.put('/api/account/cart/:cartItemId', requireAuth, async (req, res, next) => {
  try {
    if (!database) return res.status(503).json({ message: 'DATABASE_URL is required.' })
    const users = await readUsers()
    const user = users.find((item) => item.id === req.user.id)
    user.cart ||= []
    const current = user.cart.find((item) => item.id === req.params.cartItemId)
    if (!current) return res.status(404).json({ message: 'Cart item not found.' })
    const catalogue = await productCatalogue(database)
    const product = catalogue.find((entry) => entry.id === current.productId)
    if (!product) return res.status(404).json({ message: 'Product not found.' })
    const quantity = Number(req.body.quantity ?? current.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return res.status(400).json({ message: 'Quantity must be between 1 and 10.' })
    const selection = selectedSku(product, Number(req.body.variantId ?? current.variantId), String(req.body.size ?? current.size))
    if (selection.error)
      return res.status(400).json({
        message: 'The selected style or size is not available.',
        code: selection.error,
      })
    const duplicate = user.cart.find((item) => item.id !== current.id && item.variantId === selection.variant.id && item.size === selection.sku.size)
    const desiredQuantity = quantity + Number(duplicate?.quantity || 0)
    if (desiredQuantity > Math.min(10, selection.sku.stock))
      return res.status(409).json({
        message: `${product.name} has only ${selection.sku.stock} item(s) available in this style and size.`,
        code: 'INSUFFICIENT_STOCK',
        available: selection.sku.stock,
      })
    if (duplicate) {
      duplicate.quantity = desiredQuantity
      user.cart = user.cart.filter((item) => item.id !== current.id)
    } else
      Object.assign(current, {
        variantId: selection.variant.id,
        size: selection.sku.size,
        colorIndex: selection.variant.position,
        quantity,
      })
    await writeUsers(users)
    res.json({ favourites: user.favourites || [], cart: user.cart })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/account/cart/:cartItemId', requireAuth, async (req, res, next) => {
  try {
    const users = await readUsers()
    const user = users.find((item) => item.id === req.user.id)
    const before = (user.cart || []).length
    user.cart = (user.cart || []).filter((item) => item.id !== req.params.cartItemId)
    if (user.cart.length === before) return res.status(404).json({ message: 'Cart item not found.' })
    await writeUsers(users)
    res.json({ favourites: user.favourites || [], cart: user.cart })
  } catch (error) {
    next(error)
  }
})

app.get('/api/account/orders', requireAuth, (req, res) => res.json({ orders: req.user.orders || [] }))

app.post('/api/account/orders', requireAuth, async (req, res, next) => {
  try {
    const items = req.user.cart || []
    const addressId = String(req.body.addressId || '')
    const address = (req.user.addresses || []).find((item) => item.id === addressId)
    if (!items.length) return res.status(400).json({ message: '购物车为空。' })
    if (!address) return res.status(400).json({ message: '请选择有效的收货地址。' })
    if (!database) return res.status(503).json({ message: 'DATABASE_URL is required.' })
    const catalogue = await productCatalogue(database)
    const orderItems = items.map((item) => {
      const product = catalogue.find((entry) => entry.id === Number(item.productId))
      const quantity = Math.max(1, Math.min(10, Number(item.quantity) || 1))
      if (!product) throw new Error('商品不存在。')
      const size = String(item.size || product.sizes[0])
      const selection = selectedSku(product, item.variantId || product.variants[0]?.id, size)
      if (selection.error) throw new Error('所选商品款式或尺码不存在。')
      if (selection.sku.stock < quantity) throw new Error('所选商品款式与尺码库存不足。')
      return {
        productId: product.id,
        name: product.name,
        quantity,
        size,
        variantId: selection.variant.id,
        variantName: selection.variant.nameZh,
        skuId: selection.sku.id,
        unitPrice: product.salePrice ?? product.price,
      }
    })
    const total = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const users = await readUsers()
    const user = users.find((item) => item.id === req.user.id)
    user.orders ||= []
    const order = {
      id: `BO-${Date.now().toString().slice(-8)}`,
      items: orderItems,
      total,
      status: 'confirmed',
      address,
      createdAt: new Date().toISOString(),
    }
    await database.batch(orderItems.map((item) => database.prepare('UPDATE product_skus SET stock = stock - ?, updated_at = ? WHERE id = ? AND stock >= ?').bind(item.quantity, order.createdAt, item.skuId, item.quantity)))
    user.orders.unshift(order)
    user.cart = []
    await writeUsers(users)
    res.status(201).json({ order, cart: [] })
  } catch (error) {
    next(error)
  }
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: '服务器暂时无法处理请求，请稍后再试。' })
})

app.listen(port, () => console.log(`Blue Orchid API ready on http://localhost:${port}`))
