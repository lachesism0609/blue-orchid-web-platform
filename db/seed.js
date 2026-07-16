import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { catalogSeed, defaultProductStock } from './catalog-seed.js'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required to seed the PostgreSQL catalogue.')

const sql = neon(process.env.DATABASE_URL)

let inventory = new Map()
try {
  const rows = await sql`SELECT product_id, stock FROM product_inventory`
  inventory = new Map(rows.map((row) => [Number(row.product_id), Number(row.stock)]))
} catch {
  // A new database may not contain the compatibility inventory table.
}

const queries = []

for (const product of catalogSeed) {
  queries.push(sql`
    INSERT INTO products (id, category, name_zh, name_en, description_zh, description_en, materials_zh, materials_en, price, sale_percent, image_url, active, updated_at)
    VALUES (${product.id}, ${product.category}, ${product.nameZh}, ${product.nameEn}, ${product.descriptionZh}, ${product.descriptionEn}, ${product.materialsZh}, ${product.materialsEn}, ${product.price}, ${product.salePercent}, ${product.imageUrl}, 1, now())
    ON CONFLICT (id) DO UPDATE SET category = EXCLUDED.category, name_zh = EXCLUDED.name_zh, name_en = EXCLUDED.name_en,
      description_zh = EXCLUDED.description_zh, description_en = EXCLUDED.description_en, materials_zh = EXCLUDED.materials_zh,
      materials_en = EXCLUDED.materials_en, price = EXCLUDED.price, sale_percent = EXCLUDED.sale_percent,
      image_url = EXCLUDED.image_url, active = 1, updated_at = now()
  `)

  for (const variant of product.variants) {
    queries.push(sql`
      INSERT INTO product_variants (id, product_id, code, name_zh, name_en, color_hex, image_url, position)
      VALUES (${variant.id}, ${product.id}, ${variant.code}, ${variant.nameZh}, ${variant.nameEn}, ${variant.colorHex}, ${variant.imageUrl}, ${variant.position})
      ON CONFLICT (id) DO UPDATE SET product_id = EXCLUDED.product_id, code = EXCLUDED.code, name_zh = EXCLUDED.name_zh,
        name_en = EXCLUDED.name_en, color_hex = EXCLUDED.color_hex, image_url = EXCLUDED.image_url, position = EXCLUDED.position
    `)
  }
  for (const size of product.sizeOptions) {
    queries.push(sql`
      INSERT INTO product_sizes (id, product_id, label, position)
      VALUES (${size.id}, ${product.id}, ${size.label}, ${size.position})
      ON CONFLICT (id) DO UPDATE SET product_id = EXCLUDED.product_id, label = EXCLUDED.label, position = EXCLUDED.position
    `)
  }

  const skuCount = product.variants.length * product.sizeOptions.length
  const totalStock = inventory.get(product.id) ?? defaultProductStock[product.id - 1] ?? 0
  const stockPerSku = Math.floor(totalStock / skuCount)
  let remainder = totalStock % skuCount
  for (const variant of product.variants) {
    for (const size of product.sizeOptions) {
      const stock = stockPerSku + (remainder-- > 0 ? 1 : 0)
      const skuId = product.id * 100 + variant.position * 10 + size.position + 1
      const sku = `${variant.code}-S${String(size.position + 1).padStart(2, '0')}`
      queries.push(sql`
        INSERT INTO product_skus (id, product_id, variant_id, size_id, sku, stock, updated_at)
        VALUES (${skuId}, ${product.id}, ${variant.id}, ${size.id}, ${sku}, ${stock}, now())
        ON CONFLICT (id) DO UPDATE SET product_id = EXCLUDED.product_id, variant_id = EXCLUDED.variant_id,
          size_id = EXCLUDED.size_id, sku = EXCLUDED.sku, stock = EXCLUDED.stock, updated_at = now()
      `)
    }
  }
}

await sql.transaction(queries)
console.log(`Seeded ${catalogSeed.length} products with variants, sizes, and SKU inventory.`)
