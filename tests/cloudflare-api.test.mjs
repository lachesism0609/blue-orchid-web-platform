import assert from "node:assert/strict";
import test from "node:test";
import { onRequest } from "../functions/api/[[path]].js";
import {
  catalogueQueries,
  productCatalogue,
  selectedSku,
} from "../functions/_lib/catalog.js";
import { customerStoreQueries } from "../functions/_lib/customer-store.js";
import { catalogSeed } from "../db/catalog-seed.js";

class AuthDatabase {
  constructor() {
    this.users = [];
    this.sessions = [];
    this.rateLimits = new Map();
    this.errors = [];
    this.favourites = [];
    this.cartItems = [];
    this.productRows = catalogSeed.map((product) => ({
      id: product.id,
      category: product.category,
      name_zh: product.nameZh,
      name_en: product.nameEn,
      description_zh: product.descriptionZh,
      description_en: product.descriptionEn,
      materials_zh: product.materialsZh,
      materials_en: product.materialsEn,
      price: product.price,
      sale_percent: product.salePercent,
      image_url: product.imageUrl,
    }));
    this.variantRows = catalogSeed.flatMap((product) =>
      product.variants.map((variant) => ({
        id: variant.id,
        product_id: product.id,
        code: variant.code,
        name_zh: variant.nameZh,
        name_en: variant.nameEn,
        color_hex: variant.colorHex,
        image_url: variant.imageUrl,
        position: variant.position,
      })),
    );
    this.sizeRows = catalogSeed.flatMap((product) =>
      product.sizeOptions.map((size) => ({
        id: size.id,
        product_id: product.id,
        label: size.label,
        position: size.position,
      })),
    );
    this.skuRows = catalogSeed.flatMap((product) =>
      product.variants.flatMap((variant) =>
        product.sizeOptions.map((size) => ({
          id: product.id * 100 + variant.position * 10 + size.position + 1,
          product_id: product.id,
          variant_id: variant.id,
          size_id: size.id,
          sku: `${variant.code}-S${String(size.position + 1).padStart(2, "0")}`,
          stock: product.id === 5 ? 0 : 2,
        })),
      ),
    );
  }

  prepare(sql) {
    const database = this;
    return {
      bind(...values) {
        return {
          async all() {
            if (sql === catalogueQueries.productQuery)
              return { results: database.productRows };
            if (sql === catalogueQueries.adminProductQuery)
              return { results: database.productRows };
            if (sql === catalogueQueries.variantQuery)
              return { results: database.variantRows };
            if (sql === catalogueQueries.sizeQuery)
              return { results: database.sizeRows };
            if (sql === catalogueQueries.skuQuery)
              return { results: database.skuRows };
            if (sql === customerStoreQueries.favourites)
              return {
                results: database.favourites
                  .filter((entry) => entry.user_id === values[0])
                  .map((entry) => ({ product_id: entry.product_id })),
              };
            if (sql === customerStoreQueries.cart)
              return {
                results: database.cartItems
                  .filter((entry) => entry.user_id === values[0])
                  .map((entry) => ({
                    ...entry,
                    size: database.sizeRows.find(
                      (size) => size.id === entry.size_id,
                    )?.label,
                    color_index: database.variantRows.find(
                      (variant) => variant.id === entry.variant_id,
                    )?.position,
                  })),
              };
            if (
              sql ===
              "SELECT * FROM sessions WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ? ORDER BY last_seen_at DESC"
            )
              return {
                results: database.sessions
                  .filter(
                    (entry) =>
                      entry.user_id === values[0] &&
                      !entry.revoked_at &&
                      new Date(entry.expires_at).getTime() >
                        new Date(values[1]).getTime(),
                  )
                  .sort(
                    (left, right) =>
                      new Date(right.last_seen_at) -
                      new Date(left.last_seen_at),
                  ),
              };
            throw new Error(`Unexpected all query: ${sql}`);
          },
          async first() {
            if (sql === "SELECT id FROM users WHERE email = ?") {
              const user = database.users.find(
                (entry) => entry.email === values[0],
              );
              return user ? { id: user.id } : null;
            }
            if (sql === "SELECT * FROM users WHERE email = ?")
              return (
                database.users.find((entry) => entry.email === values[0]) ||
                null
              );
            if (sql === "SELECT * FROM users WHERE id = ?")
              return (
                database.users.find((entry) => entry.id === values[0]) || null
              );
            if (sql === "SELECT * FROM users WHERE verification_token_hash = ?")
              return (
                database.users.find(
                  (entry) => entry.verification_token_hash === values[0],
                ) || null
              );
            if (
              sql === "SELECT * FROM users WHERE password_reset_token_hash = ?"
            )
              return (
                database.users.find(
                  (entry) => entry.password_reset_token_hash === values[0],
                ) || null
              );
            if (sql === "SELECT * FROM sessions WHERE token_hash = ?")
              return (
                database.sessions.find(
                  (entry) => entry.token_hash === values[0],
                ) || null
              );
            if (
              sql ===
              "SELECT * FROM sessions WHERE id = ? AND user_id = ? AND revoked_at IS NULL"
            )
              return (
                database.sessions.find(
                  (entry) =>
                    entry.id === values[0] &&
                    entry.user_id === values[1] &&
                    !entry.revoked_at,
                ) || null
              );
            if (sql === "SELECT * FROM rate_limits WHERE key = ?")
              return database.rateLimits.get(values[0]) || null;
            if (
              sql ===
              "SELECT id, quantity FROM cart_items WHERE user_id = ? AND variant_id = ? AND size_id = ?"
            )
              return (
                database.cartItems.find(
                  (entry) =>
                    entry.user_id === values[0] &&
                    entry.variant_id === values[1] &&
                    entry.size_id === values[2],
                ) || null
              );
            if (
              sql ===
              "SELECT id, product_id, variant_id, size_id, quantity FROM cart_items WHERE id = ? AND user_id = ?"
            )
              return (
                database.cartItems.find(
                  (entry) =>
                    entry.id === values[0] && entry.user_id === values[1],
                ) || null
              );
            if (
              sql ===
              "SELECT id, quantity FROM cart_items WHERE user_id = ? AND variant_id = ? AND size_id = ? AND id <> ?"
            )
              return (
                database.cartItems.find(
                  (entry) =>
                    entry.user_id === values[0] &&
                    entry.variant_id === values[1] &&
                    entry.size_id === values[2] &&
                    entry.id !== values[3],
                ) || null
              );
            throw new Error(`Unexpected first query: ${sql}`);
          },
          async run() {
            if (sql.startsWith("INSERT INTO users")) {
              const [
                id,
                name,
                email,
                phone,
                password_hash,
                password_salt,
                created_at,
              ] = values;
              database.users.push({
                id,
                name,
                email,
                phone,
                password_hash,
                password_salt,
                email_verified: 0,
                role: "customer",
                created_at,
              });
            } else if (
              sql.startsWith("UPDATE users SET verification_token_hash")
            ) {
              const user = database.users.find(
                (entry) => entry.id === values[2],
              );
              Object.assign(user, {
                verification_token_hash: values[0],
                verification_expires_at: values[1],
              });
            } else if (sql.startsWith("UPDATE users SET email_verified")) {
              const user = database.users.find(
                (entry) => entry.id === values[0],
              );
              Object.assign(user, {
                email_verified: 1,
                verification_token_hash: null,
                verification_expires_at: null,
              });
            } else if (
              sql.startsWith("UPDATE users SET password_reset_token_hash")
            ) {
              const user = database.users.find(
                (entry) => entry.id === values[2],
              );
              Object.assign(user, {
                password_reset_token_hash: values[0],
                password_reset_expires_at: values[1],
              });
            } else if (sql.startsWith("UPDATE users SET password_hash")) {
              const user = database.users.find(
                (entry) => entry.id === values[2],
              );
              Object.assign(user, {
                password_hash: values[0],
                password_salt: values[1],
                password_reset_token_hash: null,
                password_reset_expires_at: null,
              });
            } else if (sql.startsWith("DELETE FROM users")) {
              database.users = database.users.filter(
                (entry) => entry.id !== values[0],
              );
            } else if (sql.startsWith("INSERT INTO sessions")) {
              const [
                id,
                user_id,
                token_hash,
                created_at,
                expires_at,
                last_seen_at,
                user_agent,
                ip_address,
              ] = values;
              database.sessions.push({
                id,
                user_id,
                token_hash,
                created_at,
                expires_at,
                last_seen_at,
                user_agent,
                ip_address,
                revoked_at: null,
              });
            } else if (sql.startsWith("UPDATE sessions SET last_seen_at")) {
              const session = database.sessions.find(
                (entry) => entry.id === values[1],
              );
              session.last_seen_at = values[0];
            } else if (sql.startsWith("UPDATE sessions SET revoked_at")) {
              for (const session of database.sessions) {
                const matches = sql.includes("token_hash <> ?")
                  ? session.user_id === values[1] &&
                    session.token_hash !== values[2] &&
                    !session.revoked_at
                  : sql.includes("WHERE id = ?")
                    ? session.id === values[1] &&
                      session.user_id === values[2] &&
                      !session.revoked_at
                    : sql.includes("token_hash = ?")
                      ? session.token_hash === values[1]
                      : sql.includes("user_id = ?")
                        ? session.user_id === values[1]
                        : false;
                if (matches) session.revoked_at = values[0];
              }
            } else if (sql.startsWith("INSERT INTO rate_limits")) {
              database.rateLimits.set(values[0], {
                key: values[0],
                count: 1,
                reset_at: values[1],
              });
            } else if (sql.startsWith("UPDATE rate_limits SET count")) {
              const limit = database.rateLimits.get(values[0]);
              limit.count += 1;
            } else if (sql.startsWith("INSERT INTO error_events")) {
              database.errors.push({
                id: values[0],
                source: values[1],
                message: values[2],
              });
            } else if (sql.startsWith("UPDATE product_skus SET stock")) {
              const sku = database.skuRows.find(
                (entry) => entry.id === values[2],
              );
              if (!sku) return { success: true, meta: { changes: 0 } };
              sku.stock = values[0];
            } else if (sql.startsWith("INSERT INTO favourites")) {
              if (
                !database.favourites.some(
                  (entry) =>
                    entry.user_id === values[0] &&
                    entry.product_id === values[1],
                )
              )
                database.favourites.push({
                  user_id: values[0],
                  product_id: values[1],
                  created_at: values[2],
                });
            } else if (sql.startsWith("DELETE FROM favourites")) {
              database.favourites = database.favourites.filter(
                (entry) =>
                  entry.user_id !== values[0] || entry.product_id !== values[1],
              );
            } else if (sql.startsWith("INSERT INTO cart_items")) {
              const [
                id,
                user_id,
                product_id,
                variant_id,
                size_id,
                quantity,
                created_at,
                updated_at,
              ] = values;
              database.cartItems.push({
                id,
                user_id,
                product_id,
                variant_id,
                size_id,
                quantity,
                created_at,
                updated_at,
              });
            } else if (sql.startsWith("UPDATE cart_items SET variant_id")) {
              const item = database.cartItems.find(
                (entry) =>
                  entry.id === values[4] && entry.user_id === values[5],
              );
              Object.assign(item, {
                variant_id: values[0],
                size_id: values[1],
                quantity: values[2],
                updated_at: values[3],
              });
            } else if (sql.startsWith("UPDATE cart_items SET quantity")) {
              const item = database.cartItems.find(
                (entry) =>
                  entry.id === values[2] && entry.user_id === values[3],
              );
              item.quantity = values[0];
              item.updated_at = values[1];
            } else if (sql.startsWith("DELETE FROM cart_items WHERE id")) {
              const before = database.cartItems.length;
              database.cartItems = database.cartItems.filter(
                (entry) =>
                  entry.id !== values[0] || entry.user_id !== values[1],
              );
              return {
                success: true,
                meta: { changes: before - database.cartItems.length },
              };
            } else throw new Error(`Unexpected run query: ${sql}`);
            return { success: true, meta: { changes: 1 } };
          },
        };
      },
    };
  }

  async batch(statements) {
    return Promise.all(statements.map((statement) => statement.run()));
  }
}

const env = () => ({
  DB: new AuthDatabase(),
  AUTH_SECRET: "test-secret-that-is-not-used-in-production",
  DEV_EMAIL_VERIFICATION: "true",
});

function context(
  databaseEnv,
  path,
  { method = "GET", body, token, cookie, protocol = "https:", userAgent } = {},
) {
  return {
    env: databaseEnv,
    params: { path: path.split("?")[0].split("/") },
    request: new Request(`${protocol}//blue-orchid.pages.dev/api/${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(userAgent ? { "User-Agent": userAgent } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  };
}

test("returns the complete product catalogue", async () => {
  const response = await onRequest(context(env(), "products"));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).length, 30);
});

test("resolves stock for an exact product variant and size", async () => {
  const catalogue = await productCatalogue(new AuthDatabase());
  const product = catalogue[0];
  const selection = selectedSku(
    product,
    product.variants[0].id,
    product.sizes[0],
  );
  assert.equal(selection.variant.code, "BO-001-C01");
  assert.equal(selection.sku.stock, 2);
  assert.equal(
    selectedSku(product, 999999, product.sizes[0]).error,
    "INVALID_VARIANT",
  );
  assert.equal(
    selectedSku(product, product.variants[0].id, "XXL").error,
    "INVALID_SIZE",
  );
});

test("supports product details, filtering, and pagination", async () => {
  const databaseEnv = env();
  const detail = await onRequest(context(databaseEnv, "products/4"));
  assert.equal(detail.status, 200);
  const product = await detail.json();
  assert.equal(product.id, 4);
  assert.equal(product.nameEn, "Oversized blazer");
  assert.equal(product.variants.length, 2);
  assert.deepEqual(product.sizes, ["XS", "S", "M", "L"]);
  assert.ok(product.skus.every((sku) => sku.variantId && sku.size));

  const filtered = await onRequest(
    context(databaseEnv, "products?category=women&inStock=true&page=1&limit=2"),
  );
  assert.equal(filtered.status, 200);
  const result = await filtered.json();
  assert.equal(result.items.length, 2);
  assert.equal(result.pagination.limit, 2);
  assert.ok(
    result.items.every(
      (product) => product.category === "women" && product.inStock,
    ),
  );

  const englishSearch = await onRequest(
    context(databaseEnv, "products?q=blazer"),
  );
  assert.equal((await englishSearch.json()).items[0].id, 4);
});

test("returns the latest EUR/CNY reference rate", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(url, "https://api.frankfurter.dev/v2/rate/EUR/CNY");
    return new Response(
      JSON.stringify({
        date: "2026-07-16",
        base: "EUR",
        quote: "CNY",
        rate: 8.25,
      }),
      { status: 200 },
    );
  };
  try {
    const response = await onRequest(context(env(), "exchange-rate"));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      base: "EUR",
      quote: "CNY",
      rate: 8.25,
      date: "2026-07-16",
      source: "Frankfurter",
    });
    assert.match(response.headers.get("cache-control"), /max-age=3600/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("records sanitized frontend error reports", async () => {
  const databaseEnv = env();
  const response = await onRequest(
    context(databaseEnv, "errors/report", {
      method: "POST",
      body: { message: "Render failed", stack: "component stack" },
    }),
  );
  assert.equal(response.status, 204);
  assert.equal(databaseEnv.DB.errors.length, 1);
  assert.equal(databaseEnv.DB.errors[0].source, "frontend");
  assert.equal(databaseEnv.DB.errors[0].message, "Render failed");
});

test("registers, verifies email, logs in, rejects a bad password, and validates the token", async () => {
  const databaseEnv = env();
  const credentials = {
    name: "Blue Orchid User",
    email: "user@example.com",
    password: "eRkaC7iT39b!4d5",
  };

  const registration = await onRequest(
    context(databaseEnv, "auth/register", {
      method: "POST",
      body: credentials,
    }),
  );
  assert.equal(registration.status, 201);
  const registered = await registration.json();
  assert.equal(registered.requiresVerification, true);
  assert.ok(registered.verificationUrl);
  assert.notEqual(databaseEnv.DB.users[0].password_hash, credentials.password);

  const blockedLogin = await onRequest(
    context(databaseEnv, "auth/login", {
      method: "POST",
      body: { email: credentials.email, password: credentials.password },
    }),
  );
  assert.equal(blockedLogin.status, 403);

  const verificationToken = new URL(
    registered.verificationUrl,
  ).searchParams.get("token");
  const verification = await onRequest({
    ...context(databaseEnv, "auth/verify-email"),
    request: new Request(
      `https://blue-orchid.pages.dev/api/auth/verify-email?token=${verificationToken}`,
    ),
  });
  assert.equal(verification.status, 200);

  const login = await onRequest(
    context(databaseEnv, "auth/login", {
      method: "POST",
      body: { email: credentials.email, password: credentials.password },
    }),
  );
  assert.equal(login.status, 200);
  const loggedIn = await login.json();
  assert.equal(loggedIn.token, undefined);
  const setCookie = login.headers.get("set-cookie");
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /SameSite=Strict/);
  const cookie = setCookie.split(";")[0];

  const rejected = await onRequest(
    context(databaseEnv, "auth/login", {
      method: "POST",
      body: { email: credentials.email, password: "incorrect-password" },
    }),
  );
  assert.equal(rejected.status, 401);

  const currentUser = await onRequest(
    context(databaseEnv, "auth/me", { cookie }),
  );
  assert.equal(currentUser.status, 200);
  const currentUserBody = await currentUser.json();
  assert.equal(currentUserBody.user.name, credentials.name);
  assert.equal(currentUserBody.user.role, "customer");

  const blockedAdmin = await onRequest(
    context(databaseEnv, "admin/products", { cookie }),
  );
  assert.equal(blockedAdmin.status, 403);

  databaseEnv.DB.users[0].role = "admin";
  const adminProducts = await onRequest(
    context(databaseEnv, "admin/products", { cookie }),
  );
  assert.equal(adminProducts.status, 200);
  assert.equal((await adminProducts.json()).products.length, 30);

  const skuId = databaseEnv.DB.skuRows[0].id;
  const stockUpdate = await onRequest(
    context(databaseEnv, `admin/skus/${skuId}`, {
      method: "PUT",
      cookie,
      body: { stock: 9 },
    }),
  );
  assert.equal(stockUpdate.status, 200);
  assert.equal(databaseEnv.DB.skuRows[0].stock, 9);

  const logout = await onRequest(
    context(databaseEnv, "auth/logout", { method: "POST", cookie }),
  );
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
  const revoked = await onRequest(context(databaseEnv, "auth/me", { cookie }));
  assert.equal(revoked.status, 401);
});

test("resets a forgotten password and manages device sessions", async () => {
  const databaseEnv = env();
  const credentials = {
    name: "Session User",
    email: "sessions@example.com",
    password: "initial-password-123",
  };
  const registration = await onRequest(
    context(databaseEnv, "auth/register", {
      method: "POST",
      body: credentials,
    }),
  );
  const verificationToken = new URL(
    (await registration.json()).verificationUrl,
  ).searchParams.get("token");
  await onRequest({
    ...context(databaseEnv, "auth/verify-email"),
    request: new Request(
      `https://blue-orchid.pages.dev/api/auth/verify-email?token=${verificationToken}`,
    ),
  });

  const login = async (userAgent, password = credentials.password) => {
    const response = await onRequest(
      context(databaseEnv, "auth/login", {
        method: "POST",
        userAgent,
        body: { email: credentials.email, password },
      }),
    );
    return {
      response,
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
  };

  const first = await login(
    "Mozilla/5.0 (Windows NT 10.0) Chrome/126.0 Safari/537.36",
  );
  const second = await login("Mozilla/5.0 (X11; Linux x86_64) Firefox/128.0");
  assert.equal(first.response.status, 200);
  assert.equal(second.response.status, 200);

  const sessionResponse = await onRequest(
    context(databaseEnv, "account/sessions", { cookie: first.cookie }),
  );
  const sessionBody = await sessionResponse.json();
  assert.equal(sessionBody.sessions.length, 2);
  assert.equal(
    sessionBody.sessions.filter((session) => session.current).length,
    1,
  );
  assert.match(
    sessionBody.sessions.find((session) => session.current).device,
    /Chrome · Windows/,
  );

  const otherSession = sessionBody.sessions.find((session) => !session.current);
  const revokeOne = await onRequest(
    context(databaseEnv, `account/sessions/${otherSession.id}`, {
      method: "DELETE",
      cookie: first.cookie,
    }),
  );
  assert.equal(revokeOne.status, 200);
  assert.equal(
    (
      await onRequest(
        context(databaseEnv, "auth/me", { cookie: second.cookie }),
      )
    ).status,
    401,
  );

  const third = await login("Mozilla/5.0 (Macintosh) Safari/605.1");
  assert.equal(third.response.status, 200);

  const revokeOthers = await onRequest(
    context(databaseEnv, "account/sessions/revoke-others", {
      method: "POST",
      cookie: first.cookie,
    }),
  );
  assert.equal(revokeOthers.status, 200);
  assert.equal(
    (await onRequest(context(databaseEnv, "auth/me", { cookie: third.cookie })))
      .status,
    401,
  );
  assert.equal(
    (await onRequest(context(databaseEnv, "auth/me", { cookie: first.cookie })))
      .status,
    200,
  );

  const forgot = await onRequest(
    context(databaseEnv, "auth/forgot-password", {
      method: "POST",
      body: { email: credentials.email },
    }),
  );
  const resetUrl = (await forgot.json()).resetUrl;
  assert.ok(resetUrl);
  const resetToken = new URL(resetUrl).searchParams.get("resetToken");
  const newPassword = "new-password-456";
  const reset = await onRequest(
    context(databaseEnv, "auth/reset-password", {
      method: "POST",
      body: { token: resetToken, password: newPassword },
    }),
  );
  assert.equal(reset.status, 200);
  assert.equal(
    (await onRequest(context(databaseEnv, "auth/me", { cookie: first.cookie })))
      .status,
    401,
  );
  assert.equal(
    (await login("Chrome", credentials.password)).response.status,
    401,
  );
  assert.equal((await login("Chrome", newPassword)).response.status, 200);
});

test("redirects non-local HTTP requests to HTTPS", async () => {
  const response = await onRequest(
    context(env(), "products", { protocol: "http:" }),
  );
  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get("location"),
    "https://blue-orchid.pages.dev/api/products",
  );
});

test("rate limits repeated login attempts", async () => {
  const databaseEnv = env();
  let response;
  for (let index = 0; index < 11; index += 1)
    response = await onRequest(
      context(databaseEnv, "auth/login", {
        method: "POST",
        body: { email: "none@example.com", password: "bad-password" },
      }),
    );
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("retry-after")) > 0);
});

test("persists favourites and cart selections in the customer database", async () => {
  const databaseEnv = env();
  const credentials = {
    name: "Store State User",
    email: "store-state@example.com",
    password: "eRkaC7iT39b!4d5",
  };
  const registration = await onRequest(
    context(databaseEnv, "auth/register", {
      method: "POST",
      body: credentials,
    }),
  );
  const verificationToken = new URL(
    (await registration.json()).verificationUrl,
  ).searchParams.get("token");
  await onRequest({
    ...context(databaseEnv, "auth/verify-email"),
    request: new Request(
      `https://blue-orchid.pages.dev/api/auth/verify-email?token=${verificationToken}`,
    ),
  });
  const login = await onRequest(
    context(databaseEnv, "auth/login", {
      method: "POST",
      body: { email: credentials.email, password: credentials.password },
    }),
  );
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const catalogue = await productCatalogue(databaseEnv.DB);
  const product = catalogue[0];
  const variant = product.variants[0];
  const size = product.sizes[0];

  const favourite = await onRequest(
    context(databaseEnv, `account/favourites/${product.id}`, {
      method: "PUT",
      cookie,
    }),
  );
  assert.equal(favourite.status, 200);
  assert.deepEqual((await favourite.json()).favourites, [product.id]);

  const added = await onRequest(
    context(databaseEnv, "account/cart", {
      method: "POST",
      cookie,
      body: {
        productId: product.id,
        variantId: variant.id,
        size,
        quantity: 1,
      },
    }),
  );
  assert.equal(added.status, 201);
  const addedState = await added.json();
  assert.equal(addedState.cart[0].variantId, variant.id);
  assert.equal(addedState.cart[0].size, size);

  const reloaded = await onRequest(
    context(databaseEnv, "account/store-state", { cookie }),
  );
  assert.deepEqual(await reloaded.json(), addedState);

  const updated = await onRequest(
    context(databaseEnv, `account/cart/${addedState.cart[0].id}`, {
      method: "PUT",
      cookie,
      body: { quantity: 2 },
    }),
  );
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).cart[0].quantity, 2);
});
