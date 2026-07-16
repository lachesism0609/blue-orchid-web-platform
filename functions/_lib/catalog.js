const productQuery = `SELECT id, category, name_zh, name_en, description_zh, description_en, materials_zh, materials_en, price, sale_percent, image_url FROM products WHERE active = 1 ORDER BY id`
const variantQuery = `SELECT id, product_id, code, name_zh, name_en, color_hex, image_url, position FROM product_variants ORDER BY product_id, position`
const sizeQuery = `SELECT id, product_id, label, position FROM product_sizes ORDER BY product_id, position`
const skuQuery = `SELECT id, product_id, variant_id, size_id, sku, stock FROM product_skus ORDER BY product_id, variant_id, size_id`

async function rows(database, query) {
  const result = await database.prepare(query).bind().all()
  return result.results || []
}

export async function productCatalogue(database) {
  const [productRows, variantRows, sizeRows, skuRows] = await Promise.all([
    rows(database, productQuery),
    rows(database, variantQuery),
    rows(database, sizeQuery),
    rows(database, skuQuery)
  ])

  const variantsByProduct = new Map()
  const sizesByProduct = new Map()
  const skusByProduct = new Map()
  for (const row of variantRows) {
    const variant = {
      id: Number(row.id),
      code: row.code,
      nameZh: row.name_zh,
      nameEn: row.name_en,
      color: row.color_hex,
      image: row.image_url,
      position: Number(row.position),
      stock: 0
    }
    const variants = variantsByProduct.get(Number(row.product_id)) || []
    variants.push(variant)
    variantsByProduct.set(Number(row.product_id), variants)
  }
  for (const row of sizeRows) {
    const sizes = sizesByProduct.get(Number(row.product_id)) || []
    sizes.push({ id: Number(row.id), label: row.label, position: Number(row.position) })
    sizesByProduct.set(Number(row.product_id), sizes)
  }
  for (const row of skuRows) {
    const sku = {
      id: Number(row.id),
      variantId: Number(row.variant_id),
      sizeId: Number(row.size_id),
      sku: row.sku,
      stock: Number(row.stock)
    }
    const skus = skusByProduct.get(Number(row.product_id)) || []
    skus.push(sku)
    skusByProduct.set(Number(row.product_id), skus)
  }

  return productRows.map(row => {
    const id = Number(row.id)
    const variants = variantsByProduct.get(id) || []
    const sizeOptions = sizesByProduct.get(id) || []
    const skus = skusByProduct.get(id) || []
    const sizeById = new Map(sizeOptions.map(size => [size.id, size.label]))
    const variantById = new Map(variants.map(variant => [variant.id, variant]))
    for (const sku of skus) {
      sku.size = sizeById.get(sku.sizeId)
      const variant = variantById.get(sku.variantId)
      if (variant) variant.stock += sku.stock
    }
    const stock = skus.reduce((sum, sku) => sum + sku.stock, 0)
    const salePercent = row.sale_percent === null ? null : Number(row.sale_percent)
    const price = Number(row.price)
    return {
      id,
      category: row.category,
      name: row.name_zh,
      nameZh: row.name_zh,
      nameEn: row.name_en,
      description: row.description_en,
      descriptionZh: row.description_zh,
      descriptionEn: row.description_en,
      materials: row.materials_en,
      materialsZh: row.materials_zh,
      materialsEn: row.materials_en,
      price,
      salePercent,
      salePrice: salePercent === null ? null : Math.round(price * (100 - salePercent) / 100),
      image: row.image_url,
      colors: variants.map(variant => variant.color),
      variants,
      sizes: sizeOptions.map(size => size.label),
      skus,
      stock,
      inStock: stock > 0
    }
  })
}

export function selectedSku(product, variantId, sizeLabel) {
  const variant = product.variants.find(entry => entry.id === Number(variantId))
  if (!variant) return { error: 'INVALID_VARIANT' }
  if (!product.sizes.includes(sizeLabel)) return { error: 'INVALID_SIZE' }
  const sku = product.skus.find(entry => entry.variantId === variant.id && entry.size === sizeLabel)
  return sku ? { variant, sku } : { error: 'SKU_NOT_FOUND' }
}

export const catalogueQueries = { productQuery, variantQuery, sizeQuery, skuQuery }
