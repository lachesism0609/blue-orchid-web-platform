import { productCatalogue } from './catalog.js'

export const productCategories = ['women', 'men', 'bags', 'shoes', 'accessories']
export const orderStatuses = ['confirmed', 'processing', 'shipped', 'completed', 'cancelled']

const legacyStatuses = new Map([
  ['订单已确认', 'confirmed'],
  ['已确认', 'confirmed'],
  ['处理中', 'processing'],
  ['已发货', 'shipped'],
  ['已完成', 'completed'],
  ['已取消', 'cancelled'],
])

export function normalizeOrderStatus(status) {
  const value = String(status || '')
    .trim()
    .toLowerCase()
  return orderStatuses.includes(value) ? value : legacyStatuses.get(String(status || '').trim()) || 'confirmed'
}

export function validateProductInput(input, { partial = false } = {}) {
  const body = input && typeof input === 'object' ? input : {}
  const requiredText = ['category', 'nameZh', 'nameEn', 'descriptionZh', 'descriptionEn', 'materialsZh', 'materialsEn', 'imageUrl']
  const errors = []
  const value = {}

  for (const field of requiredText) {
    if (partial && body[field] === undefined) continue
    const text = String(body[field] || '').trim()
    if (!text) errors.push(`${field} is required.`)
    value[field] = text
  }
  if (value.category && !productCategories.includes(value.category)) errors.push('Unsupported product category.')

  if (!partial || body.price !== undefined) {
    value.price = Number(body.price)
    if (!Number.isInteger(value.price) || value.price < 0 || value.price > 1000000) errors.push('Price must be a whole CNY amount between 0 and 1,000,000.')
  }
  if (!partial || body.salePercent !== undefined) {
    value.salePercent = body.salePercent === '' || body.salePercent === null || body.salePercent === undefined ? null : Number(body.salePercent)
    if (value.salePercent !== null && (!Number.isInteger(value.salePercent) || value.salePercent < 1 || value.salePercent > 99)) errors.push('Discount must be between 1 and 99 percent.')
  }
  if (!partial || body.active !== undefined) value.active = body.active === false || body.active === 0 ? 0 : 1

  if (!partial) {
    const sizes = Array.isArray(body.sizes) ? body.sizes : String(body.sizes || '').split(',')
    value.sizes = [...new Set(sizes.map((size) => String(size).trim()).filter(Boolean))].slice(0, 12)
    if (!value.sizes.length) errors.push('At least one size is required.')
    value.variantNameZh = String(body.variantNameZh || '默认款').trim()
    value.variantNameEn = String(body.variantNameEn || 'Default').trim()
    value.colorHex = String(body.colorHex || '#d8d4cc').trim()
    value.variantImageUrl = String(body.variantImageUrl || value.imageUrl || '').trim()
    value.stock = Number(body.stock ?? 0)
    if (!Number.isInteger(value.stock) || value.stock < 0 || value.stock > 100000) errors.push('Initial stock must be between 0 and 100,000.')
    if (!/^#[0-9a-f]{6}$/i.test(value.colorHex)) errors.push('Colour must use a six-digit hex value.')
  }
  return { value, errors }
}

export function isAdmin(user) {
  return user?.role === 'admin'
}

async function nextIntegerId(database, table) {
  const row = await database.prepare(`SELECT COALESCE(MAX(id), 0) + 1 AS id FROM ${table}`).bind().first()
  return Number(row.id)
}

export async function createAdminProduct(database, input) {
  const { value, errors } = validateProductInput(input)
  if (errors.length) return { errors }
  const [productId, variantId, sizeStart, skuStart] = await Promise.all([nextIntegerId(database, 'products'), nextIntegerId(database, 'product_variants'), nextIntegerId(database, 'product_sizes'), nextIntegerId(database, 'product_skus')])
  const now = new Date().toISOString()
  const code = `BO-${String(productId).padStart(3, '0')}-C01`
  const statements = [
    database
      .prepare(
        'INSERT INTO products (id, category, name_zh, name_en, description_zh, description_en, materials_zh, materials_en, price, sale_percent, image_url, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(productId, value.category, value.nameZh, value.nameEn, value.descriptionZh, value.descriptionEn, value.materialsZh, value.materialsEn, value.price, value.salePercent, value.imageUrl, value.active, now, now),
    database
      .prepare('INSERT INTO product_variants (id, product_id, code, name_zh, name_en, color_hex, image_url, position) VALUES (?, ?, ?, ?, ?, ?, ?, 0)')
      .bind(variantId, productId, code, value.variantNameZh, value.variantNameEn, value.colorHex, value.variantImageUrl),
    database
      .prepare('INSERT INTO product_inventory (product_id, stock, updated_at) VALUES (?, ?, ?) ON CONFLICT (product_id) DO UPDATE SET stock = EXCLUDED.stock, updated_at = EXCLUDED.updated_at')
      .bind(productId, value.stock * value.sizes.length, now),
  ]
  value.sizes.forEach((label, index) => {
    const sizeId = sizeStart + index
    statements.push(
      database.prepare('INSERT INTO product_sizes (id, product_id, label, position) VALUES (?, ?, ?, ?)').bind(sizeId, productId, label, index),
      database
        .prepare('INSERT INTO product_skus (id, product_id, variant_id, size_id, sku, stock, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(skuStart + index, productId, variantId, sizeId, `${code}-${label.replace(/[^a-z0-9]+/gi, '').toUpperCase() || index + 1}`, value.stock, now),
    )
  })
  await database.batch(statements)
  return {
    product: (await productCatalogue(database, { includeInactive: true })).find((product) => product.id === productId),
  }
}
