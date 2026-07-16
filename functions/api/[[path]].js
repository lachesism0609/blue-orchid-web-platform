import { createDatabase } from '../_lib/database.js'

const textEncoder = new TextEncoder()
const sessionDuration = 60 * 60 * 24 * 7
const verificationDuration = 60 * 60 * 24
const passwordIterations = 100000

const products = [
  { id: 1, category: 'women', name: '亚麻短袖衬衫', price: 329, colors: ['#eee3d1', '#d69391', '#a8bdcf'], image: 'https://images.unsplash.com/photo-1598032895397-b9472444bf93?auto=format&fit=crop&w=750&q=85' },
  { id: 2, category: 'men', name: '直筒牛仔裤', price: 399, colors: ['#2e567c', '#9ab8d6'], image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=750&q=85' },
  { id: 3, category: 'men', name: '纯棉基础 T 恤', price: 169, colors: ['#141414', '#f4f2eb', '#c9c9c9'], image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=750&q=85' },
  { id: 4, category: 'women', name: '宽松廓形西装外套', price: 699, colors: ['#dfd0b7', '#191919'], image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=750&q=85' },
  { id: 5, category: 'women', name: '轻盈棉质连衣裙', price: 459, colors: ['#fff', '#e6b7bf', '#171717'], image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=750&q=85' },
  { id: 6, category: 'shoes', name: '极简白色运动鞋', price: 559, colors: ['#fafafa'], image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=750&q=85' },
  { id: 7, category: 'bags', name: '经典皮质托特包', price: 699, colors: ['#b18d68', '#242321'], image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=750&q=85' },
  { id: 8, category: 'bags', name: '迷你斜挎包', price: 459, colors: ['#d9c9b4', '#52707e'], image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=750&q=85' },
  { id: 9, category: 'shoes', name: '柔软乐福鞋', price: 399, colors: ['#9d7657', '#171717'], image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=750&q=85' },
  { id: 10, category: 'shoes', name: '细带凉鞋', price: 299, colors: ['#dfd0b7', '#171717'], image: 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=750&q=85' },
  { id: 11, category: 'accessories', name: '简约弧形太阳镜', price: 219, colors: ['#1f1f1d', '#b77850'], image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=750&q=85' },
  { id: 12, category: 'accessories', name: '真丝方巾', price: 189, colors: ['#d29a8b', '#b8c5b2'], image: 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?auto=format&fit=crop&w=750&q=85' },
  { id: 13, category: 'women', name: '垂感半身长裙', price: 389, colors: ['#d9d0c3', '#222222'], image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=750&q=85' },
  { id: 14, category: 'women', name: '针织开衫', price: 429, colors: ['#e4d7c6', '#87909a'], image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=750&q=85' },
  { id: 15, category: 'women', name: '轻薄风衣', price: 759, colors: ['#c6b8a4', '#303537'], image: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=750&q=85' },
  { id: 16, category: 'men', name: '亚麻立领衬衫', price: 359, colors: ['#f0ebe1', '#53616a'], image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=750&q=85' },
  { id: 17, category: 'men', name: '锥形休闲长裤', price: 449, colors: ['#c6b9a5', '#273137'], image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=750&q=85' },
  { id: 18, category: 'men', name: '简约圆领卫衣', price: 379, colors: ['#d2d2cc', '#262626'], image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=750&q=85' },
  { id: 19, category: 'men', name: '轻量夹克', price: 629, colors: ['#7e8a80', '#1d2220'], image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=750&q=85' },
  { id: 20, category: 'bags', name: '编织腋下包', price: 499, colors: ['#c1a179', '#252525'], image: 'https://images.unsplash.com/photo-1585488434455-255a6d4a9d0b?auto=format&fit=crop&w=750&q=85' },
  { id: 21, category: 'bags', name: '通勤双肩包', price: 569, colors: ['#9d8873', '#252525'], image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=750&q=85' },
  { id: 22, category: 'bags', name: '小号手提包', price: 639, colors: ['#dac7b2', '#583e32'], image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=750&q=85' },
  { id: 23, category: 'bags', name: '尼龙旅行包', price: 429, colors: ['#26333a', '#b0a493'], image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=750&q=85' },
  { id: 24, category: 'shoes', name: '复古跑鞋', price: 649, colors: ['#e6e0d6', '#6c7377'], image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=750&q=85' },
  { id: 25, category: 'shoes', name: '方头芭蕾鞋', price: 369, colors: ['#e5d5c7', '#282828'], image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=750&q=85' },
  { id: 26, category: 'shoes', name: '真皮短靴', price: 729, colors: ['#3d3029', '#c1ab90'], image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=750&q=85' },
  { id: 27, category: 'accessories', name: '精工腕表', price: 899, colors: ['#d8b67a', '#282828'], image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=750&q=85' },
  { id: 28, category: 'accessories', name: '羊毛渔夫帽', price: 199, colors: ['#c7b49e', '#343434'], image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=750&q=85' },
  { id: 29, category: 'accessories', name: '细链项链', price: 259, colors: ['#d5b46f'], image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=750&q=85' },
  { id: 30, category: 'accessories', name: '皮质腰带', price: 279, colors: ['#703f2c', '#191919'], image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=750&q=85' }
]

const saleDiscounts = { 1: 0.8, 2: 0.85, 3: 0.75, 9: 0.8, 10: 0.7, 11: 0.75, 12: 0.8, 13: 0.85, 16: 0.8, 18: 0.75, 25: 0.8, 28: 0.7, 29: 0.8, 30: 0.75 }

function json(data, status = 200) {
  return new Response(data === null ? null : JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  })
}

function cachedJson(data, maxAge = 3600) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
      'X-Content-Type-Options': 'nosniff'
    }
  })
}

async function latestExchangeRate() {
  const response = await fetch('https://api.frankfurter.dev/v2/rate/EUR/CNY', { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Exchange-rate provider returned ${response.status}`)
  const data = await response.json()
  const rate = Number(data.rate)
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('Exchange-rate provider returned an invalid rate')
  return { base: 'EUR', quote: 'CNY', rate, date: data.date, source: 'Frankfurter' }
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
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

function base64urlToText(value) {
  return new TextDecoder().decode(base64urlToBytes(value))
}

async function passwordHash(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: passwordIterations }, key, 256)
  return { hash: bytesToBase64url(new Uint8Array(derived)), salt: bytesToBase64url(salt) }
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

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

async function createToken(user, secret) {
  const payload = textToBase64url(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + sessionDuration }))
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), textEncoder.encode(payload))
  return `${payload}.${bytesToBase64url(new Uint8Array(signature))}`
}

async function verifyToken(token, secret) {
  const [payload, signature] = String(token || '').split('.')
  if (!payload || !signature) return null
  try {
    const valid = await crypto.subtle.verify('HMAC', await hmacKey(secret), base64urlToBytes(signature), textEncoder.encode(payload))
    if (!valid) return null
    const data = JSON.parse(base64urlToText(payload))
    return data.exp > Math.floor(Date.now() / 1000) ? data : null
  } catch { return null }
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(value))
  return bytesToBase64url(new Uint8Array(digest))
}

function siteUrl(request, env) {
  return String(env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '')
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
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
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [user.email], subject: 'Verify your Blue Orchid account', html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#202020"><h1 style="color:#294887">Blue Orchid</h1><p>Hello ${escapeHtml(user.name)},</p><p>Confirm your email address to finish creating your account.</p><p><a href="${verificationUrl}" style="display:inline-block;padding:12px 22px;background:#294887;color:white;text-decoration:none">Verify email</a></p><p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p></div>` })
  })
  if (!response.ok) throw new Error(`Email delivery failed (${response.status})`)
  return {}
}

function verificationPage(success, origin) {
  const title = success ? 'Email verified' : 'Verification link invalid'
  const message = success ? 'Your email has been verified. You can now sign in.' : 'This verification link is invalid or has expired. Please request a new one.'
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head><body style="margin:0;background:#f7f7f4;font-family:Arial,sans-serif;color:#202020"><main style="max-width:520px;margin:12vh auto;background:white;padding:48px;text-align:center"><h1 style="color:#294887">Blue Orchid</h1><h2>${title}</h2><p style="line-height:1.6">${message}</p><a href="${origin}/?emailVerified=${success ? '1' : '0'}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#202020;color:white;text-decoration:none">Return to store</a></main></body></html>`, { status: success ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone || '', createdAt: user.created_at }
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
    createdAt: address.created_at
  }
}

async function authenticatedUser(request, env) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const payload = await verifyToken(token, env.AUTH_SECRET)
  if (!payload) return null
  return env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first()
}

async function requestBody(request) {
  try { return await request.json() } catch { return {} }
}

async function listOrders(env, userId) {
  const { results: orders } = await env.DB.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all()
  if (!orders.length) return []
  const placeholders = orders.map(() => '?').join(', ')
  const { results: items } = await env.DB.prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id`).bind(...orders.map(order => order.id)).all()
  return orders.map(order => ({
    id: order.id,
    total: order.total,
    status: order.status,
    address: typeof order.address_json === 'string' ? JSON.parse(order.address_json) : order.address_json,
    createdAt: order.created_at,
    items: items.filter(item => item.order_id === order.id).map(item => ({ productId: item.product_id, name: item.name, quantity: item.quantity, unitPrice: item.unit_price }))
  }))
}

export async function onRequest({ request, env, params }) {
  const database = createDatabase(env)
  if (!database) return json({ message: '数据库尚未配置。' }, 503)
  env = { ...env, DB: database }
  if (!env.AUTH_SECRET) return json({ message: 'Cloudflare AUTH_SECRET 尚未配置。' }, 503)

  const method = request.method.toUpperCase()
  const route = (Array.isArray(params.path) ? params.path : [params.path]).filter(Boolean).join('/')

  try {
    if (method === 'OPTIONS') return new Response(null, { status: 204 })
    if (method === 'GET' && route === 'exchange-rate') return cachedJson(await latestExchangeRate())
    if (method === 'GET' && route === 'products') return json(products)

    if (method === 'POST' && route === 'auth/register') {
      const body = await requestBody(request)
      const name = String(body.name || '').trim()
      const email = String(body.email || '').trim().toLowerCase()
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
        .bind(id, name, email, '', passwordData.hash, passwordData.salt, createdAt).run()
      const user = { id, name, email, phone: '', created_at: createdAt }
      try {
        const delivery = await issueVerification(user, request, env)
        return json({ message: '注册成功，请查收验证邮件。', requiresVerification: true, ...delivery }, 201)
      } catch (error) {
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
        throw error
      }
    }

    if (method === 'GET' && route === 'auth/verify-email') {
      const token = new URL(request.url).searchParams.get('token') || ''
      const user = token ? await env.DB.prepare('SELECT * FROM users WHERE verification_token_hash = ?').bind(await sha256(token)).first() : null
      const valid = Boolean(user && user.verification_expires_at && new Date(user.verification_expires_at).getTime() > Date.now())
      if (valid) await env.DB.prepare('UPDATE users SET email_verified = 1, verification_token_hash = NULL, verification_expires_at = NULL WHERE id = ?').bind(user.id).run()
      return verificationPage(valid, siteUrl(request, env))
    }

    if (method === 'POST' && route === 'auth/resend-verification') {
      const body = await requestBody(request)
      const email = String(body.email || '').trim().toLowerCase()
      const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
      const delivery = user && !user.email_verified ? await issueVerification(user, request, env) : {}
      return json({ message: '如果该邮箱尚未验证，我们已发送新的验证邮件。', ...delivery })
    }

    if (method === 'POST' && route === 'auth/login') {
      const body = await requestBody(request)
      const email = String(body.email || '').trim().toLowerCase()
      const password = String(body.password || '')
      const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
      if (!user || !(await passwordMatches(password, user.password_hash, user.password_salt))) return json({ message: '邮箱或密码不正确。' }, 401)
      if (!user.email_verified) return json({ message: '请先完成邮箱验证后再登录。', code: 'EMAIL_NOT_VERIFIED' }, 403)
      return json({ token: await createToken(user, env.AUTH_SECRET), user: publicUser(user) })
    }

    const user = await authenticatedUser(request, env)
    if (!user) return json({ message: '请先登录后再继续。' }, 401)

    if (method === 'GET' && route === 'auth/me') return json({ user: publicUser(user) })

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
      const address = Object.fromEntries(fields.map(field => [field, String(body[field] || '').trim()]))
      if (fields.some(field => !address[field])) return json({ message: '请填写所有地址字段。' }, 400)
      const entry = { id: crypto.randomUUID(), ...address, createdAt: new Date().toISOString() }
      await env.DB.prepare('INSERT INTO addresses (id, user_id, recipient, phone, line1, city, postcode, country, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(entry.id, user.id, entry.recipient, entry.phone, entry.line1, entry.city, entry.postcode, entry.country, entry.createdAt).run()
      return json({ address: entry }, 201)
    }

    const addressMatch = route.match(/^account\/addresses\/([^/]+)$/)
    if (addressMatch && method === 'DELETE') {
      const result = await env.DB.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').bind(addressMatch[1], user.id).run()
      if (!result.meta.changes) return json({ message: '未找到该地址。' }, 404)
      return new Response(null, { status: 204 })
    }

    if (route === 'account/orders' && method === 'GET') return json({ orders: await listOrders(env, user.id) })

    if (route === 'account/orders' && method === 'POST') {
      const body = await requestBody(request)
      const requestedItems = Array.isArray(body.items) ? body.items : []
      if (!requestedItems.length) return json({ message: '购物车为空。' }, 400)
      const addressRow = await env.DB.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').bind(String(body.addressId || ''), user.id).first()
      if (!addressRow) return json({ message: '请选择有效的收货地址。' }, 400)

      const orderItems = []
      for (const item of requestedItems) {
        const product = products.find(entry => entry.id === Number(item.productId))
        if (!product) return json({ message: '商品不存在。' }, 400)
        const quantity = Math.max(1, Math.min(10, Number(item.quantity) || 1))
        const unitPrice = saleDiscounts[product.id] ? Math.round(product.price * saleDiscounts[product.id]) : product.price
        orderItems.push({ productId: product.id, name: product.name, quantity, unitPrice })
      }

      const total = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      const address = publicAddress(addressRow)
      const order = {
        id: `BO-${Date.now().toString().slice(-8)}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
        items: orderItems,
        total,
        status: '订单已确认',
        address,
        createdAt: new Date().toISOString()
      }
      const statements = [
        env.DB.prepare('INSERT INTO orders (id, user_id, total, status, address_json, created_at) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(order.id, user.id, order.total, order.status, JSON.stringify(order.address), order.createdAt),
        ...orderItems.map(item => env.DB.prepare('INSERT INTO order_items (order_id, product_id, name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)')
          .bind(order.id, item.productId, item.name, item.quantity, item.unitPrice))
      ]
      await env.DB.batch(statements)
      return json({ order }, 201)
    }

    return json({ message: '未找到该接口。' }, 404)
  } catch (error) {
    console.error(error)
    return json({ message: '服务器暂时无法处理请求，请稍后再试。' }, 500)
  }
}
