import crypto from 'node:crypto'
import express from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const port = process.env.PORT || 3010
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDirectory = path.join(__dirname, 'data')
const usersFile = path.join(dataDirectory, 'users.json')
const authSecret = process.env.AUTH_SECRET || 'blue-orchid-development-secret-change-in-production'
const sessionDuration = 60 * 60 * 24 * 7

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

app.use(express.json({ limit: '20kb' }))

async function readUsers() {
  await fs.mkdir(dataDirectory, { recursive: true })
  try { return JSON.parse(await fs.readFile(usersFile, 'utf8')) } catch (error) {
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

function base64url(value) { return Buffer.from(value).toString('base64url') }
function createToken(user) {
  const payload = base64url(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + sessionDuration }))
  const signature = crypto.createHmac('sha256', authSecret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

function verifyToken(token) {
  const [payload, signature] = (token || '').split('.')
  if (!payload || !signature) return null
  const expected = crypto.createHmac('sha256', authSecret).update(payload).digest('base64url')
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return data.exp > Math.floor(Date.now() / 1000) ? data : null
  } catch { return null }
}

const publicUser = user => ({ id: user.id, name: user.name, email: user.email, phone: user.phone || '', createdAt: user.createdAt })
const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ message: '请先登录后再继续。' })
  const user = (await readUsers()).find(item => item.id === payload.sub)
  if (!user) return res.status(401).json({ message: '登录状态无效，请重新登录。' })
  req.user = user
  next()
}

app.get('/api/products', (_req, res) => res.json(products))

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')
    if (name.length < 2 || name.length > 50) return res.status(400).json({ message: '姓名长度须为 2 至 50 个字符。' })
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: '请输入有效的邮箱地址。' })
    if (password.length < 8) return res.status(400).json({ message: '密码至少需要 8 个字符。' })
    const users = await readUsers()
    if (users.some(user => user.email === email)) return res.status(409).json({ message: '该邮箱已经注册，请直接登录。' })
    const user = { id: crypto.randomUUID(), name, email, phone: '', addresses: [], orders: [], passwordHash: hashPassword(password), createdAt: new Date().toISOString() }
    users.push(user)
    await writeUsers(users)
    return res.status(201).json({ token: createToken(user), user: publicUser(user) })
  } catch (error) { next(error) }
})

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')
    const user = (await readUsers()).find(item => item.email === email)
    if (!user || !passwordMatches(password, user.passwordHash)) return res.status(401).json({ message: '邮箱或密码不正确。' })
    return res.json({ token: createToken(user), user: publicUser(user) })
  } catch (error) { next(error) }
})

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }))

app.put('/api/account/profile', requireAuth, async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim()
    const phone = String(req.body.phone || '').trim()
    if (name.length < 2 || name.length > 50) return res.status(400).json({ message: '姓名长度须为 2 至 50 个字符。' })
    if (phone.length > 30) return res.status(400).json({ message: '电话号码格式不正确。' })
    const users = await readUsers()
    const user = users.find(item => item.id === req.user.id)
    user.name = name; user.phone = phone
    await writeUsers(users)
    res.json({ user: publicUser(user) })
  } catch (error) { next(error) }
})

app.get('/api/account/addresses', requireAuth, (req, res) => res.json({ addresses: req.user.addresses || [] }))

app.post('/api/account/addresses', requireAuth, async (req, res, next) => {
  try {
    const fields = ['recipient', 'phone', 'line1', 'city', 'postcode', 'country']
    const address = Object.fromEntries(fields.map(field => [field, String(req.body[field] || '').trim()]))
    if (fields.some(field => !address[field])) return res.status(400).json({ message: '请填写所有地址字段。' })
    const users = await readUsers(); const user = users.find(item => item.id === req.user.id)
    user.addresses ||= []
    const entry = { id: crypto.randomUUID(), ...address, createdAt: new Date().toISOString() }
    user.addresses.push(entry)
    await writeUsers(users)
    res.status(201).json({ address: entry })
  } catch (error) { next(error) }
})

app.delete('/api/account/addresses/:addressId', requireAuth, async (req, res, next) => {
  try {
    const users = await readUsers(); const user = users.find(item => item.id === req.user.id)
    const before = (user.addresses || []).length
    user.addresses = (user.addresses || []).filter(address => address.id !== req.params.addressId)
    if (user.addresses.length === before) return res.status(404).json({ message: '未找到该地址。' })
    await writeUsers(users)
    res.status(204).end()
  } catch (error) { next(error) }
})

app.get('/api/account/orders', requireAuth, (req, res) => res.json({ orders: req.user.orders || [] }))

app.post('/api/account/orders', requireAuth, async (req, res, next) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : []
    const addressId = String(req.body.addressId || '')
    const address = (req.user.addresses || []).find(item => item.id === addressId)
    if (!items.length) return res.status(400).json({ message: '购物车为空。' })
    if (!address) return res.status(400).json({ message: '请选择有效的收货地址。' })
    const orderItems = items.map(item => {
      const product = products.find(entry => entry.id === Number(item.productId))
      const quantity = Math.max(1, Math.min(10, Number(item.quantity) || 1))
      if (!product) throw new Error('商品不存在。')
      const unitPrice = saleDiscounts[product.id] ? Math.round(product.price * saleDiscounts[product.id]) : product.price
      return { productId: product.id, name: product.name, quantity, unitPrice }
    })
    const total = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const users = await readUsers(); const user = users.find(item => item.id === req.user.id)
    user.orders ||= []
    const order = { id: `BO-${Date.now().toString().slice(-8)}`, items: orderItems, total, status: '订单已确认', address, createdAt: new Date().toISOString() }
    user.orders.unshift(order)
    await writeUsers(users)
    res.status(201).json({ order })
  } catch (error) { next(error) }
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: '服务器暂时无法处理请求，请稍后再试。' })
})

app.listen(port, () => console.log(`Blue Orchid API ready on http://localhost:${port}`))
