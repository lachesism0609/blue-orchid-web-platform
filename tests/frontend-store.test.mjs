import assert from 'node:assert/strict'
import test from 'node:test'
import { filterProducts, paginateProducts, updateCartOptions } from '../src/store-utils.js'

const products = [
  { id: 1, category: 'women', displayName: 'Linen dress', price: 260, inStock: true },
  { id: 2, category: 'women', displayName: 'Wool coat', price: 720, inStock: false },
  { id: 3, category: 'men', displayName: 'Cotton shirt', price: 420, inStock: true }
]

test('filters the catalogue by category, search, price, sale, and stock', () => {
  assert.deepEqual(filterProducts(products, { category: 'women', query: 'linen', price: 'under300', stockOnly: true }).map(product => product.id), [1])
  assert.deepEqual(filterProducts(products, { category: 'sale', saleIds: [2, 3] }).map(product => product.id), [2, 3])
})

test('paginates and clamps invalid page numbers', () => {
  const result = paginateProducts(Array.from({ length: 19 }, (_, id) => ({ id })), 9, 8)
  assert.equal(result.page, 3)
  assert.equal(result.pages, 3)
  assert.equal(result.items.length, 3)
})

test('updates only the selected cart item options', () => {
  const cart = [{ productId: 1, size: 'S' }, { productId: 2, size: 'M' }]
  assert.deepEqual(updateCartOptions(cart, 1, { size: 'L', colorIndex: 2 }), [{ productId: 1, size: 'S' }, { productId: 2, size: 'L', colorIndex: 2 }])
})
