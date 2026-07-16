export const customerStoreQueries = {
  favourites: 'SELECT product_id FROM favourites WHERE user_id = ? ORDER BY created_at, product_id',
  cart: `SELECT ci.id, ci.product_id, ci.variant_id, ps.label AS size, pv.position AS color_index, ci.quantity
    FROM cart_items ci
    JOIN product_variants pv ON pv.id = ci.variant_id AND pv.product_id = ci.product_id
    JOIN product_sizes ps ON ps.id = ci.size_id AND ps.product_id = ci.product_id
    WHERE ci.user_id = ?
    ORDER BY ci.created_at, ci.id`,
}

export async function customerStoreState(database, userId) {
  const [favouriteResult, cartResult] = await Promise.all([database.prepare(customerStoreQueries.favourites).bind(userId).all(), database.prepare(customerStoreQueries.cart).bind(userId).all()])
  return {
    favourites: (favouriteResult.results || []).map((row) => Number(row.product_id)),
    cart: (cartResult.results || []).map((row) => ({
      id: row.id,
      productId: Number(row.product_id),
      variantId: Number(row.variant_id),
      size: row.size,
      colorIndex: Number(row.color_index),
      quantity: Number(row.quantity),
    })),
  }
}
