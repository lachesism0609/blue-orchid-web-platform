import { createDatabase } from '../_lib/database.js'
import { productCatalogue, selectedSku } from '../_lib/catalog.js'
import { customerStoreState } from '../_lib/customer-store.js'
import { createAdminProduct, isAdmin, normalizeOrderStatus, orderStatuses, validateProductInput } from '../_lib/admin.js'

const textEncoder = new TextEncoder()
const sessionDuration = 60 * 60 * 24 * 7
const verificationDuration = 60 * 60 * 24
const passwordResetDuration = 60 * 60
const passwordIterations = 100000
const sessionCookie = '__Host-blue_orchid_session'

function securityHeaders(extra = {}) {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    ...extra,
  }
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(data === null ? null : JSON.stringify(data), {
    status,
    headers: securityHeaders({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    }),
  })
}

function cachedJson(data, maxAge = 3600) {
  return new Response(JSON.stringify(data), {
    headers: securityHeaders({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
    }),
  })
}

async function latestExchangeRate() {
  const response = await fetch('https://api.frankfurter.dev/v2/rate/EUR/CNY', {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`Exchange-rate provider returned ${response.status}`)
  const data = await response.json()
  const rate = Number(data.rate)
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('Exchange-rate provider returned an invalid rate')
  return {
    base: 'EUR',
    quote: 'CNY',
    rate,
    date: data.date,
    source: 'Frankfurter',
  }
}

function bytesToBase64url(bytes) {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function textToBase64url(value) {
  return bytesToBase64url(textEncoder.encode(value))
}

function base64urlToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function base64urlToText(value) {
  return new TextDecoder().decode(base64urlToBytes(value))
}

async function passwordHash(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: passwordIterations }, key, 256)
  return {
    hash: bytesToBase64url(new Uint8Array(derived)),
    salt: bytesToBase64url(salt),
  }
}

async function passwordMatches(password, hash, salt) {
  const candidate = await passwordHash(password, base64urlToBytes(salt))
  const left = base64urlToBytes(candidate.hash)
  const right = base64urlToBytes(hash)
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index]
  return difference === 0
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(value))
  return bytesToBase64url(new Uint8Array(digest))
}

function cookies(request) {
  return Object.fromEntries(
    (request.headers.get('Cookie') || '')
      .split(';')
      .map((part) => part.trim().split(/=(.*)/s))
      .filter(([name]) => name),
  )
}

function sessionToken(request) {
  return cookies(request)[sessionCookie] || request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || ''
}

function sessionCookieHeader(token, maxAge = sessionDuration) {
  return `${sessionCookie}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`
}

function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0].trim() || 'unknown'
}

async function createSession(user, request, env) {
  const token = bytesToBase64url(crypto.getRandomValues(new Uint8Array(32)))
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + sessionDuration * 1000).toISOString()
  await env.DB.prepare('INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at, last_seen_at, user_agent, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), user.id, await sha256(token), now, expiresAt, now, request.headers.get('User-Agent') || '', clientIp(request))
    .run()
  return token
}

async function checkRateLimit(request, env, route) {
  const rules = route === 'auth/login' ? [10, 15 * 60] : route.startsWith('auth/') ? [20, 15 * 60] : request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE' ? [60, 60] : null
  if (!rules) return null
  const [limit, windowSeconds] = rules
  const key = `${route}:${await sha256(clientIp(request))}`
  const now = Date.now()
  const existing = await env.DB.prepare('SELECT * FROM rate_limits WHERE key = ?').bind(key).first()
  if (!existing || timestampMilliseconds(existing.reset_at) <= now) {
    await env.DB.prepare('INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?) ON CONFLICT (key) DO UPDATE SET count = 1, reset_at = EXCLUDED.reset_at')
      .bind(key, new Date(now + windowSeconds * 1000).toISOString())
      .run()
    return null
  }
  if (existing.count >= limit)
    return json({ message: 'Too many requests. Please try again later.' }, 429, {
      'Retry-After': String(Math.max(1, Math.ceil((timestampMilliseconds(existing.reset_at) - now) / 1000))),
    })
  await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run()
  return null
}

async function recordError(env, request, error, source = 'backend') {
  try {
    const message = String(error?.message || error || 'Unknown error').slice(0, 1000)
    const stack = String(error?.stack || '').slice(0, 6000)
    await env.DB.prepare('INSERT INTO error_events (id, source, message, stack, url, user_agent, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), source, message, stack, String(request.url).slice(0, 2000), String(request.headers.get('User-Agent') || '').slice(0, 500), await sha256(clientIp(request)), new Date().toISOString())
      .run()
  } catch (monitoringError) {
    console.error('Error monitoring failed', monitoringError)
  }
}

function siteUrl(request, env) {
  return String(env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '')
}

function timestampMilliseconds(value) {
  if (value instanceof Date) return value.getTime()
  const normalized = String(value || '')
    .replace(' ', 'T')
    .replace(/([+-]\d{2})$/, '$1:00')
  return Date.parse(normalized)
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
}

async function issueVerification(user, request, env) {
  const token = bytesToBase64url(crypto.getRandomValues(new Uint8Array(32)))
  const tokenHash = await sha256(token)
  const expiresAt = new Date(Date.now() + verificationDuration * 1000).toISOString()
  await env.DB.prepare('UPDATE users SET verification_token_hash = ?, verification_expires_at = ? WHERE id = ?').bind(tokenHash, expiresAt, user.id).run()
  const verificationUrl = `${siteUrl(request, env)}/api/auth/verify-email?token=${encodeURIComponent(token)}`
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    if (env.DEV_EMAIL_VERIFICATION === 'true') return { verificationUrl }
    throw new Error('Email delivery is not configured')
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [user.email],
      subject: 'Verify your Blue Orchid account',
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#202020"><h1 style="color:#294887">Blue Orchid</h1><p>Hello ${escapeHtml(user.name)},</p><p>Confirm your email address to finish creating your account.</p><p><a href="${verificationUrl}" style="display:inline-block;padding:12px 22px;background:#294887;color:white;text-decoration:none">Verify email</a></p><p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p></div>`,
    }),
  })
  if (!response.ok) throw new Error(`Email delivery failed (${response.status})`)
  return {}
}

async function issuePasswordReset(user, request, env) {
  const token = bytesToBase64url(crypto.getRandomValues(new Uint8Array(32)))
  const tokenHash = await sha256(token)
  const expiresAt = new Date(Date.now() + passwordResetDuration * 1000).toISOString()
  await env.DB.prepare('UPDATE users SET password_reset_token_hash = ?, password_reset_expires_at = ? WHERE id = ?').bind(tokenHash, expiresAt, user.id).run()
  const resetUrl = `${siteUrl(request, env)}/?resetToken=${encodeURIComponent(token)}`
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    if (env.DEV_EMAIL_VERIFICATION === 'true') return { resetUrl }
    throw new Error('Email delivery is not configured')
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [user.email],
      subject: 'Reset your Blue Orchid password',
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#202020"><h1 style="color:#294887">Blue Orchid</h1><p>Hello ${escapeHtml(user.name)},</p><p>Use the button below to choose a new password.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 22px;background:#294887;color:white;text-decoration:none">Reset password</a></p><p>This link expires in one hour and can only be used once. If you did not request this change, you can ignore this email.</p></div>`,
    }),
  })
  if (!response.ok) throw new Error(`Email delivery failed (${response.status})`)
  return {}
}

function verificationPage(success, origin) {
  const title = success ? 'Email verified' : 'Verification link invalid'
  const message = success ? 'Your email has been verified. You can now sign in.' : 'This verification link is invalid or has expired. Please request a new one.'
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head><body style="margin:0;background:#f7f7f4;font-family:Arial,sans-serif;color:#202020"><main style="max-width:520px;margin:12vh auto;background:white;padding:48px;text-align:center"><h1 style="color:#294887">Blue Orchid</h1><h2>${title}</h2><p style="line-height:1.6">${message}</p><a href="${origin}/?emailVerified=${success ? '1' : '0'}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#202020;color:white;text-decoration:none">Return to store</a></main></body></html>`,
    {
      status: success ? 200 : 400,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    },
  )
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role || 'customer',
    createdAt: user.created_at,
  }
}

function publicAddress(address) {
  return {
    id: address.id,
    recipient: address.recipient,
    phone: address.phone,
    line1: address.line1,
    city: address.city,
    postcode: address.postcode,
    country: address.country,
    createdAt: address.created_at,
  }
}

function sessionDevice(userAgent) {
  const agent = String(userAgent || '')
  const browser = /Edg\//.test(agent) ? 'Edge' : /Firefox\//.test(agent) ? 'Firefox' : /Chrome\//.test(agent) ? 'Chrome' : /Safari\//.test(agent) ? 'Safari' : 'Browser'
  const platform = /Windows/i.test(agent) ? 'Windows' : /Android/i.test(agent) ? 'Android' : /iPhone|iPad/i.test(agent) ? 'iOS' : /Mac OS/i.test(agent) ? 'macOS' : /Linux/i.test(agent) ? 'Linux' : 'Unknown device'
  return `${browser} · ${platform}`
}

function maskedIp(value) {
  const ip = String(value || '')
  if (ip.includes('.')) return ip.replace(/\.\d+$/, '.xxx')
  if (ip.includes(':')) return `${ip.split(':').slice(0, 3).join(':')}:…`
  return ip || 'unknown'
}

function publicSession(session, currentTokenHash) {
  return {
    id: session.id,
    device: sessionDevice(session.user_agent),
    userAgent: session.user_agent,
    ipAddress: maskedIp(session.ip_address),
    createdAt: session.created_at,
    lastSeenAt: session.last_seen_at,
    expiresAt: session.expires_at,
    current: session.token_hash === currentTokenHash,
  }
}

async function authenticatedUser(request, env) {
  const token = sessionToken(request)
  if (!token) return null
  const session = await env.DB.prepare('SELECT * FROM sessions WHERE token_hash = ?')
    .bind(await sha256(token))
    .first()
  if (!session || session.revoked_at || timestampMilliseconds(session.expires_at) <= Date.now()) return null
  await env.DB.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').bind(new Date().toISOString(), session.id).run()
  return env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first()
}

async function requestBody(request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

async function listOrders(env, userId) {
  const { results: orders } = await env.DB.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all()
  if (!orders.length) return []
  const placeholders = orders.map(() => '?').join(', ')
  const { results: items } = await env.DB.prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id`)
    .bind(...orders.map((order) => order.id))
    .all()
  return orders.map((order) => ({
    id: order.id,
    total: order.total,
    status: order.status,
    address: typeof order.address_json === 'string' ? JSON.parse(order.address_json) : order.address_json,
    createdAt: order.created_at,
    items: items
      .filter((item) => item.order_id === order.id)
      .map((item) => ({
        productId: item.product_id,
        name: item.name,
        quantity: item.quantity,
        size: item.size || 'One size',
        variantId: item.variant_id,
        variantName: item.variant_name || 'Default',
        unitPrice: item.unit_price,
      })),
  }))
}

async function listAdminOrders(database) {
  const { results: orders } = await database.prepare('SELECT o.*, u.name AS customer_name, u.email AS customer_email FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC').bind().all()
  if (!orders.length) return []
  const placeholders = orders.map(() => '?').join(', ')
  const { results: items } = await database
    .prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id`)
    .bind(...orders.map((order) => order.id))
    .all()
  return orders.map((order) => ({
    id: order.id,
    customer: {
      id: order.user_id,
      name: order.customer_name,
      email: order.customer_email,
    },
    total: Number(order.total),
    status: normalizeOrderStatus(order.status),
    address: typeof order.address_json === 'string' ? JSON.parse(order.address_json) : order.address_json,
    createdAt: order.created_at,
    items: items
      .filter((item) => item.order_id === order.id)
      .map((item) => ({
        productId: Number(item.product_id),
        name: item.name,
        quantity: Number(item.quantity),
        size: item.size || 'One size',
        variantId: item.variant_id === null ? null : Number(item.variant_id),
        variantName: item.variant_name || 'Default',
        unitPrice: Number(item.unit_price),
      })),
  }))
}

export async function onRequest({ request, env, params }) {
  const database = createDatabase(env)
  if (!database) return json({ message: '数据库尚未配置。' }, 503)
  env = { ...env, DB: database }
  if (!env.AUTH_SECRET) return json({ message: 'Cloudflare AUTH_SECRET 尚未配置。' }, 503)

  const method = request.method.toUpperCase()
  const route = (Array.isArray(params.path) ? params.path : [params.path]).filter(Boolean).join('/')

  const url = new URL(request.url)
  const forwardedProto = request.headers.get('X-Forwarded-Proto')
  if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    url.protocol = 'https:'
    return Response.redirect(url, 308)
  }
  if (forwardedProto && forwardedProto !== 'https' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    url.protocol = 'https:'
    return Response.redirect(url, 308)
  }

  try {
    if (method === 'OPTIONS') return new Response(null, { status: 204 })
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const origin = request.headers.get('Origin')
      if (origin && origin !== url.origin) return json({ message: 'Cross-origin request rejected.' }, 403)
    }
    const limited = await checkRateLimit(request, env, route)
    if (limited) return limited
    if (method === 'GET' && route === 'exchange-rate') return cachedJson(await latestExchangeRate())
    if (method === 'POST' && route === 'errors/report') {
      const body = await requestBody(request)
      await recordError(
        env,
        request,
        {
          message: String(body.message || 'Client error'),
          stack: String(body.stack || ''),
        },
        'frontend',
      )
      return new Response(null, { status: 204 })
    }
    if (method === 'GET' && route === 'products') {
      const catalogue = await productCatalogue(env.DB)
      const query = url.searchParams.get('q')?.trim().toLowerCase() || ''
      const category = url.searchParams.get('category') || ''
      const sale = url.searchParams.get('sale') === 'true'
      const inStock = url.searchParams.get('inStock') === 'true'
      const minPrice = url.searchParams.has('minPrice') ? Number(url.searchParams.get('minPrice')) : null
      const maxPrice = url.searchParams.has('maxPrice') ? Number(url.searchParams.get('maxPrice')) : null
      const requestedPage = Math.max(1, Number(url.searchParams.get('page')) || 1)
      const limit = Math.max(1, Math.min(24, Number(url.searchParams.get('limit')) || 12))
      let filtered = catalogue.filter(
        (product) =>
          (!query || `${product.nameZh} ${product.nameEn}`.toLowerCase().includes(query)) &&
          (!category || product.category === category) &&
          (!sale || product.salePrice !== null) &&
          (!inStock || product.inStock) &&
          (minPrice === null || !Number.isFinite(minPrice) || product.price >= minPrice) &&
          (maxPrice === null || !Number.isFinite(maxPrice) || product.price <= maxPrice),
      )
      const total = filtered.length
      const pages = Math.max(1, Math.ceil(total / limit))
      const page = Math.min(requestedPage, pages)
      const items = filtered.slice((page - 1) * limit, page * limit)
      return url.search ? json({ items, pagination: { page, limit, total, pages } }) : json(catalogue)
    }

    const productMatch = route.match(/^products\/(\d+)$/)
    if (method === 'GET' && productMatch) {
      const product = (await productCatalogue(env.DB)).find((entry) => entry.id === Number(productMatch[1]))
      return product ? json(product) : json({ message: 'Product not found.' }, 404)
    }

    if (method === 'POST' && route === 'auth/register') {
      const body = await requestBody(request)
      const name = String(body.name || '').trim()
      const email = String(body.email || '')
        .trim()
        .toLowerCase()
      const password = String(body.password || '')
      if (name.length < 2 || name.length > 50) return json({ message: '姓名长度须为 2 至 50 个字符。' }, 400)
      if (!/^\S+@\S+\.\S+$/.test(email)) return json({ message: '请输入有效的邮箱地址。' }, 400)
      if (password.length < 8) return json({ message: '密码至少需要 8 个字符。' }, 400)
      const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
      if (existing) return json({ message: '该邮箱已经注册，请直接登录。' }, 409)
      const id = crypto.randomUUID()
      const createdAt = new Date().toISOString()
      const passwordData = await passwordHash(password)
      await env.DB.prepare('INSERT INTO users (id, name, email, phone, password_hash, password_salt, email_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)')
        .bind(id, name, email, '', passwordData.hash, passwordData.salt, createdAt)
        .run()
      const user = { id, name, email, phone: '', created_at: createdAt }
      try {
        const delivery = await issueVerification(user, request, env)
        return json(
          {
            message: '注册成功，请查收验证邮件。',
            requiresVerification: true,
            ...delivery,
          },
          201,
        )
      } catch (error) {
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
        throw error
      }
    }

    if (method === 'GET' && route === 'auth/verify-email') {
      const token = new URL(request.url).searchParams.get('token') || ''
      const user = token
        ? await env.DB.prepare('SELECT * FROM users WHERE verification_token_hash = ?')
            .bind(await sha256(token))
            .first()
        : null
      const valid = Boolean(user && user.verification_expires_at && timestampMilliseconds(user.verification_expires_at) > Date.now())
      if (valid) await env.DB.prepare('UPDATE users SET email_verified = 1, verification_token_hash = NULL, verification_expires_at = NULL WHERE id = ?').bind(user.id).run()
      return verificationPage(valid, siteUrl(request, env))
    }

    if (method === 'POST' && route === 'auth/resend-verification') {
      const body = await requestBody(request)
      const email = String(body.email || '')
        .trim()
        .toLowerCase()
      const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
      const delivery = user && !user.email_verified ? await issueVerification(user, request, env) : {}
      return json({
        message: '如果该邮箱尚未验证，我们已发送新的验证邮件。',
        ...delivery,
      })
    }

    if (method === 'POST' && route === 'auth/forgot-password') {
      const body = await requestBody(request)
      const email = String(body.email || '')
        .trim()
        .toLowerCase()
      const user = /^\S+@\S+\.\S+$/.test(email) ? await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first() : null
      const delivery = user ? await issuePasswordReset(user, request, env) : {}
      return json({
        message: '如果该邮箱已注册，我们已发送密码重置邮件。',
        ...delivery,
      })
    }

    if (method === 'POST' && route === 'auth/reset-password') {
      const body = await requestBody(request)
      const token = String(body.token || '')
      const password = String(body.password || '')
      if (password.length < 8) return json({ message: '密码至少需要 8 个字符。' }, 400)
      const user = token
        ? await env.DB.prepare('SELECT * FROM users WHERE password_reset_token_hash = ?')
            .bind(await sha256(token))
            .first()
        : null
      const valid = Boolean(user && user.password_reset_expires_at && timestampMilliseconds(user.password_reset_expires_at) > Date.now())
      if (!valid) return json({ message: '密码重置链接无效或已过期。' }, 400)
      const passwordData = await passwordHash(password)
      const now = new Date().toISOString()
      await env.DB.batch([
        env.DB.prepare('UPDATE users SET password_hash = ?, password_salt = ?, password_reset_token_hash = NULL, password_reset_expires_at = NULL WHERE id = ?').bind(passwordData.hash, passwordData.salt, user.id),
        env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').bind(now, user.id),
      ])
      return json({ message: '密码已更新，请使用新密码登录。' }, 200, {
        'Set-Cookie': sessionCookieHeader('', 0),
      })
    }

    if (method === 'POST' && route === 'auth/login') {
      const body = await requestBody(request)
      const email = String(body.email || '')
        .trim()
        .toLowerCase()
      const password = String(body.password || '')
      const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
      if (!user || !(await passwordMatches(password, user.password_hash, user.password_salt))) return json({ message: '邮箱或密码不正确。' }, 401)
      if (!user.email_verified) return json({ message: '请先完成邮箱验证后再登录。', code: 'EMAIL_NOT_VERIFIED' }, 403)
      const token = await createSession(user, request, env)
      return json({ user: publicUser(user) }, 200, {
        'Set-Cookie': sessionCookieHeader(token),
      })
    }

    if (method === 'POST' && route === 'auth/logout') {
      const token = sessionToken(request)
      if (token)
        await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL')
          .bind(new Date().toISOString(), await sha256(token))
          .run()
      return json({ message: 'Signed out.' }, 200, {
        'Set-Cookie': sessionCookieHeader('', 0),
      })
    }

    const user = await authenticatedUser(request, env)
    if (!user) return json({ message: '请先登录后再继续。' }, 401)

    if (method === 'GET' && route === 'auth/me') return json({ user: publicUser(user) })

    if (method === 'POST' && route === 'auth/revoke-sessions') {
      await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').bind(new Date().toISOString(), user.id).run()
      return json({ message: 'All sessions revoked.' }, 200, {
        'Set-Cookie': sessionCookieHeader('', 0),
      })
    }

    if (method === 'GET' && route === 'account/sessions') {
      const currentTokenHash = await sha256(sessionToken(request))
      const { results } = await env.DB.prepare('SELECT * FROM sessions WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ? ORDER BY last_seen_at DESC').bind(user.id, new Date().toISOString()).all()
      return json({
        sessions: results.map((session) => publicSession(session, currentTokenHash)),
      })
    }

    if (method === 'POST' && route === 'account/sessions/revoke-others') {
      const currentTokenHash = await sha256(sessionToken(request))
      await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND token_hash <> ? AND revoked_at IS NULL').bind(new Date().toISOString(), user.id, currentTokenHash).run()
      return json({ message: 'Other sessions revoked.' })
    }

    const sessionMatch = route.match(/^account\/sessions\/([^/]+)$/)
    if (method === 'DELETE' && sessionMatch) {
      const currentTokenHash = await sha256(sessionToken(request))
      const sessionId = decodeURIComponent(sessionMatch[1])
      const target = await env.DB.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ? AND revoked_at IS NULL').bind(sessionId, user.id).first()
      if (!target) return json({ message: 'Session not found.' }, 404)
      await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL').bind(new Date().toISOString(), sessionId, user.id).run()
      const current = target.token_hash === currentTokenHash
      return json({ current }, 200, current ? { 'Set-Cookie': sessionCookieHeader('', 0) } : {})
    }

    if (route.startsWith('admin/')) {
      if (!isAdmin(user)) return json({ message: 'Administrator access is required.' }, 403)

      if (method === 'GET' && route === 'admin/products') {
        return json({
          products: await productCatalogue(env.DB, { includeInactive: true }),
        })
      }

      if (method === 'POST' && route === 'admin/products') {
        const result = await createAdminProduct(env.DB, await requestBody(request))
        return result.errors ? json({ message: result.errors[0], errors: result.errors }, 400) : json(result, 201)
      }

      const adminProductMatch = route.match(/^admin\/products\/(\d+)$/)
      if (method === 'PUT' && adminProductMatch) {
        const products = await productCatalogue(env.DB, {
          includeInactive: true,
        })
        const existing = products.find((product) => product.id === Number(adminProductMatch[1]))
        if (!existing) return json({ message: 'Product not found.' }, 404)
        const body = await requestBody(request)
        const { value, errors } = validateProductInput({
          ...existing,
          ...body,
          sizes: existing.sizes,
          imageUrl: body.imageUrl ?? existing.image,
        })
        if (errors.length) return json({ message: errors[0], errors }, 400)
        const now = new Date().toISOString()
        await env.DB.prepare(
          'UPDATE products SET category = ?, name_zh = ?, name_en = ?, description_zh = ?, description_en = ?, materials_zh = ?, materials_en = ?, price = ?, sale_percent = ?, image_url = ?, active = ?, updated_at = ? WHERE id = ?',
        )
          .bind(value.category, value.nameZh, value.nameEn, value.descriptionZh, value.descriptionEn, value.materialsZh, value.materialsEn, value.price, value.salePercent, value.imageUrl, value.active, now, existing.id)
          .run()
        return json({
          product: (await productCatalogue(env.DB, { includeInactive: true })).find((product) => product.id === existing.id),
        })
      }

      const adminVariantMatch = route.match(/^admin\/variants\/(\d+)$/)
      if (method === 'PUT' && adminVariantMatch) {
        const body = await requestBody(request)
        const nameZh = String(body.nameZh || '').trim()
        const nameEn = String(body.nameEn || '').trim()
        const colorHex = String(body.colorHex || '').trim()
        const imageUrl = String(body.imageUrl || '').trim()
        if (!nameZh || !nameEn || !imageUrl || !/^#[0-9a-f]{6}$/i.test(colorHex))
          return json(
            {
              message: 'Style names, image, and a valid hex colour are required.',
            },
            400,
          )
        const result = await env.DB.prepare('UPDATE product_variants SET name_zh = ?, name_en = ?, color_hex = ?, image_url = ? WHERE id = ?').bind(nameZh, nameEn, colorHex, imageUrl, Number(adminVariantMatch[1])).run()
        if (!result.meta.changes) return json({ message: 'Product style not found.' }, 404)
        return json({
          products: await productCatalogue(env.DB, { includeInactive: true }),
        })
      }

      const adminSkuMatch = route.match(/^admin\/skus\/(\d+)$/)
      if (method === 'PUT' && adminSkuMatch) {
        const body = await requestBody(request)
        const stock = Number(body.stock)
        if (!Number.isInteger(stock) || stock < 0 || stock > 100000) return json({ message: 'Stock must be a whole number between 0 and 100,000.' }, 400)
        const result = await env.DB.prepare('UPDATE product_skus SET stock = ?, updated_at = ? WHERE id = ?').bind(stock, new Date().toISOString(), Number(adminSkuMatch[1])).run()
        if (!result.meta.changes) return json({ message: 'SKU not found.' }, 404)
        return json({ stock })
      }

      if (method === 'GET' && route === 'admin/orders') {
        const allOrders = await listAdminOrders(env.DB)
        const query = url.searchParams.get('q')?.trim().toLowerCase() || ''
        const status = url.searchParams.get('status') || ''
        const requestedPage = Math.max(1, Number(url.searchParams.get('page')) || 1)
        const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit')) || 25))
        const filtered = allOrders.filter((order) => (!query || `${order.id} ${order.customer.name} ${order.customer.email}`.toLowerCase().includes(query)) && (!status || order.status === status))
        const pages = Math.max(1, Math.ceil(filtered.length / limit))
        const page = Math.min(requestedPage, pages)
        return json({
          orders: filtered.slice((page - 1) * limit, page * limit),
          pagination: { page, limit, total: filtered.length, pages },
        })
      }

      const adminOrderMatch = route.match(/^admin\/orders\/([^/]+)$/)
      if (method === 'PUT' && adminOrderMatch) {
        const body = await requestBody(request)
        const status = String(body.status || '')
          .trim()
          .toLowerCase()
        if (!orderStatuses.includes(status)) return json({ message: 'Unsupported order status.' }, 400)
        const result = await env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(status, decodeURIComponent(adminOrderMatch[1])).run()
        if (!result.meta.changes) return json({ message: 'Order not found.' }, 404)
        return json({ status })
      }

      return json({ message: 'Admin endpoint not found.' }, 404)
    }

    if (method === 'PUT' && route === 'account/profile') {
      const body = await requestBody(request)
      const name = String(body.name || '').trim()
      const phone = String(body.phone || '').trim()
      if (name.length < 2 || name.length > 50) return json({ message: '姓名长度须为 2 至 50 个字符。' }, 400)
      if (phone.length > 30) return json({ message: '电话号码格式不正确。' }, 400)
      await env.DB.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').bind(name, phone, user.id).run()
      return json({ user: publicUser({ ...user, name, phone }) })
    }

    if (route === 'account/addresses' && method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at').bind(user.id).all()
      return json({ addresses: results.map(publicAddress) })
    }

    if (route === 'account/addresses' && method === 'POST') {
      const body = await requestBody(request)
      const fields = ['recipient', 'phone', 'line1', 'city', 'postcode', 'country']
      const address = Object.fromEntries(fields.map((field) => [field, String(body[field] || '').trim()]))
      if (fields.some((field) => !address[field])) return json({ message: '请填写所有地址字段。' }, 400)
      const entry = {
        id: crypto.randomUUID(),
        ...address,
        createdAt: new Date().toISOString(),
      }
      await env.DB.prepare('INSERT INTO addresses (id, user_id, recipient, phone, line1, city, postcode, country, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(entry.id, user.id, entry.recipient, entry.phone, entry.line1, entry.city, entry.postcode, entry.country, entry.createdAt)
        .run()
      return json({ address: entry }, 201)
    }

    const addressMatch = route.match(/^account\/addresses\/([^/]+)$/)
    if (addressMatch && method === 'DELETE') {
      const result = await env.DB.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').bind(addressMatch[1], user.id).run()
      if (!result.meta.changes) return json({ message: '未找到该地址。' }, 404)
      return new Response(null, { status: 204 })
    }

    if (route === 'account/store-state' && method === 'GET') return json(await customerStoreState(env.DB, user.id))

    const favouriteMatch = route.match(/^account\/favourites\/(\d+)$/)
    if (favouriteMatch && method === 'PUT') {
      const productId = Number(favouriteMatch[1])
      const catalogue = await productCatalogue(env.DB)
      if (!catalogue.some((product) => product.id === productId)) return json({ message: 'Product not found.' }, 404)
      await env.DB.prepare('INSERT INTO favourites (user_id, product_id, created_at) VALUES (?, ?, ?) ON CONFLICT (user_id, product_id) DO NOTHING').bind(user.id, productId, new Date().toISOString()).run()
      return json(await customerStoreState(env.DB, user.id))
    }

    if (favouriteMatch && method === 'DELETE') {
      await env.DB.prepare('DELETE FROM favourites WHERE user_id = ? AND product_id = ?').bind(user.id, Number(favouriteMatch[1])).run()
      return json(await customerStoreState(env.DB, user.id))
    }

    if (route === 'account/cart' && method === 'POST') {
      const body = await requestBody(request)
      const catalogue = await productCatalogue(env.DB)
      const product = catalogue.find((entry) => entry.id === Number(body.productId))
      if (!product) return json({ message: 'Product not found.' }, 404)
      const quantity = Number(body.quantity)
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return json({ message: 'Quantity must be between 1 and 10.' }, 400)
      const selection = selectedSku(product, Number(body.variantId), String(body.size || ''))
      if (selection.error)
        return json(
          {
            message: 'The selected style or size is not available.',
            code: selection.error,
          },
          400,
        )
      const existing = await env.DB.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND variant_id = ? AND size_id = ?').bind(user.id, selection.variant.id, selection.sku.sizeId).first()
      const desiredQuantity = Number(existing?.quantity || 0) + quantity
      if (desiredQuantity > Math.min(10, selection.sku.stock))
        return json(
          {
            message: `${product.name} has only ${selection.sku.stock} item(s) available in this style and size.`,
            code: 'INSUFFICIENT_STOCK',
            available: selection.sku.stock,
          },
          409,
        )
      const now = new Date().toISOString()
      if (existing) {
        await env.DB.prepare('UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ? AND user_id = ?').bind(desiredQuantity, now, existing.id, user.id).run()
      } else {
        await env.DB.prepare('INSERT INTO cart_items (id, user_id, product_id, variant_id, size_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(crypto.randomUUID(), user.id, product.id, selection.variant.id, selection.sku.sizeId, quantity, now, now)
          .run()
      }
      return json(await customerStoreState(env.DB, user.id), 201)
    }

    const cartMatch = route.match(/^account\/cart\/([^/]+)$/)
    if (cartMatch && method === 'PUT') {
      const body = await requestBody(request)
      const current = await env.DB.prepare('SELECT id, product_id, variant_id, size_id, quantity FROM cart_items WHERE id = ? AND user_id = ?').bind(cartMatch[1], user.id).first()
      if (!current) return json({ message: 'Cart item not found.' }, 404)
      const catalogue = await productCatalogue(env.DB)
      const product = catalogue.find((entry) => entry.id === Number(current.product_id))
      if (!product) return json({ message: 'Product not found.' }, 404)
      const quantity = Number(body.quantity ?? current.quantity)
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return json({ message: 'Quantity must be between 1 and 10.' }, 400)
      const currentVariant = product.variants.find((entry) => entry.id === Number(current.variant_id))
      const currentSize = product.skus.find((entry) => entry.sizeId === Number(current.size_id))?.size
      const selection = selectedSku(product, Number(body.variantId ?? currentVariant?.id), String(body.size ?? currentSize ?? ''))
      if (selection.error)
        return json(
          {
            message: 'The selected style or size is not available.',
            code: selection.error,
          },
          400,
        )
      const duplicate = await env.DB.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND variant_id = ? AND size_id = ? AND id <> ?').bind(user.id, selection.variant.id, selection.sku.sizeId, current.id).first()
      const desiredQuantity = quantity + Number(duplicate?.quantity || 0)
      if (desiredQuantity > Math.min(10, selection.sku.stock))
        return json(
          {
            message: `${product.name} has only ${selection.sku.stock} item(s) available in this style and size.`,
            code: 'INSUFFICIENT_STOCK',
            available: selection.sku.stock,
          },
          409,
        )
      const now = new Date().toISOString()
      if (duplicate) {
        await env.DB.batch([
          env.DB.prepare('UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ? AND user_id = ?').bind(desiredQuantity, now, duplicate.id, user.id),
          env.DB.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').bind(current.id, user.id),
        ])
      } else {
        await env.DB.prepare('UPDATE cart_items SET variant_id = ?, size_id = ?, quantity = ?, updated_at = ? WHERE id = ? AND user_id = ?').bind(selection.variant.id, selection.sku.sizeId, quantity, now, current.id, user.id).run()
      }
      return json(await customerStoreState(env.DB, user.id))
    }

    if (cartMatch && method === 'DELETE') {
      const result = await env.DB.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').bind(cartMatch[1], user.id).run()
      if (!result.meta.changes) return json({ message: 'Cart item not found.' }, 404)
      return json(await customerStoreState(env.DB, user.id))
    }

    if (route === 'account/orders' && method === 'GET') return json({ orders: await listOrders(env, user.id) })

    if (route === 'account/orders' && method === 'POST') {
      const body = await requestBody(request)
      const requestedItems = (await customerStoreState(env.DB, user.id)).cart
      if (!requestedItems.length) return json({ message: '购物车为空。' }, 400)
      const addressRow = await env.DB.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?')
        .bind(String(body.addressId || ''), user.id)
        .first()
      if (!addressRow) return json({ message: '请选择有效的收货地址。' }, 400)

      const catalogue = await productCatalogue(env.DB)
      const orderItems = []
      for (const item of requestedItems) {
        const product = catalogue.find((entry) => entry.id === Number(item.productId))
        if (!product) return json({ message: '商品不存在。' }, 400)
        const quantity = Math.max(1, Math.min(10, Number(item.quantity) || 1))
        const size = String(item.size || product.sizes[0])
        const variantId = Number(item.variantId || product.variants[0]?.id)
        const selection = selectedSku(product, variantId, size)
        if (selection.error === 'INVALID_VARIANT')
          return json(
            {
              message: `${product.name} is not available in the selected style.`,
              code: 'INVALID_VARIANT',
              productId: product.id,
            },
            400,
          )
        if (selection.error)
          return json(
            {
              message: `${product.name} is not available in size ${size}.`,
              code: 'INVALID_SIZE',
              productId: product.id,
            },
            400,
          )
        if (selection.sku.stock < quantity)
          return json(
            {
              message: `${product.name} has only ${selection.sku.stock} item(s) available in this style and size.`,
              code: 'INSUFFICIENT_STOCK',
              productId: product.id,
              variantId: selection.variant.id,
              size,
              available: selection.sku.stock,
            },
            409,
          )
        const unitPrice = product.salePrice ?? product.price
        orderItems.push({
          productId: product.id,
          name: product.name,
          quantity,
          size,
          variantId: selection.variant.id,
          variantName: selection.variant.nameZh,
          skuId: selection.sku.id,
          unitPrice,
        })
      }
      const total = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      const address = publicAddress(addressRow)
      const order = {
        id: `BO-${Date.now().toString().slice(-8)}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
        items: orderItems,
        total,
        status: 'confirmed',
        address,
        createdAt: new Date().toISOString(),
      }
      const statements = [
        ...orderItems.map((item) => env.DB.prepare('UPDATE product_skus SET stock = stock - ?, updated_at = ? WHERE id = ? AND stock >= ?').bind(item.quantity, order.createdAt, item.skuId, item.quantity)),
        env.DB.prepare('INSERT INTO orders (id, user_id, total, status, address_json, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(order.id, user.id, order.total, order.status, JSON.stringify(order.address), order.createdAt),
        ...orderItems.map((item) =>
          env.DB.prepare('INSERT INTO order_items (order_id, product_id, name, quantity, size, variant_id, variant_name, unit_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(
            order.id,
            item.productId,
            item.name,
            item.quantity,
            item.size,
            item.variantId,
            item.variantName,
            item.unitPrice,
          ),
        ),
        env.DB.prepare('DELETE FROM cart_items WHERE user_id = ?').bind(user.id),
      ]
      await env.DB.batch(statements)
      return json({ order, cart: [] }, 201)
    }

    return json({ message: '未找到该接口。' }, 404)
  } catch (error) {
    console.error(error)
    await recordError(env, request, error)
    return json({ message: '服务器暂时无法处理请求，请稍后再试。' }, 500)
  }
}
