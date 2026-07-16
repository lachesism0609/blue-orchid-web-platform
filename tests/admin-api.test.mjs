import assert from "node:assert/strict";
import test from "node:test";
import {
  isAdmin,
  normalizeOrderStatus,
  validateProductInput,
} from "../functions/_lib/admin.js";

const validProduct = {
  category: "women",
  nameZh: "测试连衣裙",
  nameEn: "Test dress",
  descriptionZh: "测试商品描述",
  descriptionEn: "A product used by the administration test.",
  materialsZh: "棉",
  materialsEn: "Cotton",
  price: 399,
  salePercent: 20,
  imageUrl: "https://example.com/product.jpg",
  active: true,
  sizes: "S, M, L",
  stock: 5,
  variantNameZh: "米白色",
  variantNameEn: "Ivory",
  colorHex: "#eee8dd",
  variantImageUrl: "https://example.com/variant.jpg",
};

test("validates and normalizes administration product input", () => {
  const result = validateProductInput(validProduct);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.value.sizes, ["S", "M", "L"]);
  assert.equal(result.value.active, 1);
  assert.equal(result.value.salePercent, 20);
});

test("rejects unsafe inventory and merchandising values", () => {
  const result = validateProductInput({
    ...validProduct,
    category: "unknown",
    price: -1,
    salePercent: 100,
    stock: -2,
    colorHex: "red",
  });
  assert.ok(result.errors.length >= 5);
});

test("normalizes legacy order states and enforces explicit admin roles", () => {
  assert.equal(normalizeOrderStatus("订单已确认"), "confirmed");
  assert.equal(normalizeOrderStatus("SHIPPED"), "shipped");
  assert.equal(isAdmin({ role: "admin" }), true);
  assert.equal(isAdmin({ role: "customer" }), false);
});
