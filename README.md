# Blue Orchid Web Platform

[中文文档](README.zh-CN.md)

Blue Orchid is a bilingual, full-stack fashion commerce demonstration built with React, Node.js, Cloudflare Pages Functions, and managed PostgreSQL. It includes a responsive storefront, authenticated customer journeys, inventory-aware checkout, and a role-protected product and order administration workspace.

The project is intended as a production-oriented learning platform and commerce prototype. Checkout creates real database orders and deducts inventory, but no payment provider is connected.

## Highlights

### Storefront

- Responsive Chinese and English interface with CNY and EUR display
- Automatic hero carousel and category pages for new arrivals, women, men, bags, shoes, accessories, and sale items
- PostgreSQL-backed product catalogue with search, category and price filters, stock filtering, and pagination
- Product details with large images, bilingual descriptions, materials, colour/style variants, sizes, and exact SKU availability
- Consistent original prices, sale prices, and discount badges wherever discounted products appear
- Live EUR/CNY reference rates from Frankfurter with a cached fallback
- Responsive About page with brand content and sample customer-service information

### Customer experience

- Email registration, one-time verification links, login, logout, and one-hour password-reset links
- Device Session management with current-device identification, individual revocation, and sign-out-other-devices controls
- Authenticated favourites and cart data synchronized through PostgreSQL across refreshes and devices
- Editable cart quantities and product-option changes through the product detail view
- Profile editing and delivery-address management
- Inventory-validated checkout flow:
  1. Review cart items, quantities, prices, and total
  2. Select an existing delivery address
  3. Confirm the purchase
  4. Create the order and deduct SKU stock transactionally
  5. Show purchase success and continue to Order History
- Order history and order details with products, quantities, prices, timestamps, status, and delivery address
- Hash-based page restoration for account, cart, favourites, checkout, administration, and catalogue views

### Administration

- Database-backed `customer` and `admin` roles with server-side authorization
- Product creation and editing for bilingual copy, materials, category, price, sale percentage, visibility, and images
- Colour/style management plus size-level SKU inventory updates
- Product editor navigation back to the product and inventory list
- Order lookup, full order details, and controlled status updates for confirmed, processing, shipped, completed, and cancelled orders
- Responsive administration workspace available only to administrator accounts

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite 6, component-based JSX, responsive CSS |
| Production API | Cloudflare Pages Functions |
| Local API | Node.js and Express 4 |
| Database | Neon-compatible PostgreSQL, Drizzle ORM schema and SQL migrations |
| Authentication | PBKDF2 in production, `crypto.scryptSync` in the local fallback, secure cookie sessions |
| Email | Resend verification email delivery with a development demonstration mode |
| Quality | Node test runner, Prettier, Drizzle schema checks, Vite production builds |
| Delivery | GitHub Actions and Cloudflare Pages |

## Requirements

- Node.js 22 recommended
- npm
- A PostgreSQL connection string for catalogue, customer, cart, order, and administration features
- Resend credentials when real verification email delivery is required

## Local setup

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env` for the database scripts, then replace all placeholder values. The Express development server reads environment variables from the process, so export them before starting the combined development environment.

PowerShell example:

```powershell
$env:AUTH_SECRET="replace-with-a-long-random-secret"
$env:DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
$env:SITE_URL="http://localhost:5173"
$env:DEV_EMAIL_VERIFICATION="true"
npm run db:migrate
npm run db:seed
npm run dev
```

The development services are normally available at:

- Frontend: `http://localhost:5173`
- Express API: `http://localhost:3010`

Vite proxies `/api` requests to the Express server. Keep both services running when testing authentication, accounts, carts, addresses, orders, or administration.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `AUTH_SECRET` | Production | Strong secret used by authentication and security helpers |
| `DATABASE_URL` | Yes | Managed PostgreSQL connection string |
| `RESEND_API_KEY` | Email delivery | Resend API credential |
| `EMAIL_FROM` | Email delivery | Sender using a Resend-verified domain |
| `SITE_URL` | Yes | Public application origin used in verification links |
| `DEV_EMAIL_VERIFICATION` | Development only | Returns a demonstration verification link when set to `true` |
| `ADMIN_EMAIL` | Admin provisioning | Registered email promoted by `db:promote-admin` |
| `ADMIN_EMAILS` | Local development | Optional comma-separated Express administrator emails |
| `CLOUDFLARE_API_TOKEN` | Deployment | Cloudflare Pages deployment token |
| `CLOUDFLARE_ACCOUNT_ID` | Deployment | Cloudflare account identifier |

Never commit real secrets or database URLs. Store production values in the GitHub `production` environment and Cloudflare Pages configuration.

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite and the Express API together |
| `npm run dev:client` | Start only the Vite frontend |
| `npm run server` | Start only the Express API |
| `npm run build` | Build the production frontend into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run all frontend and backend tests |
| `npm run test:frontend` | Test catalogue, filtering, pagination, and cart utilities |
| `npm run test:backend` | Test Cloudflare API and administration behaviour |
| `npm run format:check` | Verify source and test formatting |
| `npm run db:generate` | Generate a Drizzle migration after schema changes |
| `npm run db:check` | Validate the Drizzle schema and migration history |
| `npm run db:migrate` | Apply pending PostgreSQL migrations |
| `npm run db:seed` | Insert missing catalogue and SKU seed records without overwriting managed data |
| `npm run db:promote-admin` | Promote the account in `ADMIN_EMAIL` to administrator |

## Project structure

```text
blue-orchid-web-platform/
├── src/
│   ├── components/             # Store, account, checkout, product, and admin views
│   ├── App.jsx                 # Application state, API integration, and navigation
│   ├── main.jsx                # React entry point
│   ├── store-utils.js          # Catalogue, pagination, and cart helpers
│   └── styles.css              # Responsive application styles
├── functions/
│   ├── api/[[path]].js         # Cloudflare Pages API router
│   └── _lib/                   # Database, catalogue, customer, and admin helpers
├── server/
│   ├── index.js                # Express development API
│   ├── dev.js                  # Combined local launcher
│   └── data/                   # Development-only JSON fallback data
├── db/
│   ├── schema.js               # Managed PostgreSQL schema
│   ├── migrate.js              # Migration runner
│   ├── seed.js                 # Non-destructive catalogue seeding
│   └── promote-admin.js        # Administrator provisioning
├── drizzle/                    # Version-controlled PostgreSQL migrations
├── tests/                      # Frontend utility and backend integration tests
├── public/_routes.json         # Cloudflare Pages Function routing
└── .github/workflows/          # Verification and deployment pipeline
```

## Database and migrations

PostgreSQL stores products, variants, sizes, SKUs, users, email-verification and password-reset tokens, device sessions, rate limits, favourites, cart items, addresses, orders, order items, and error-monitoring events. Foreign keys, uniqueness rules, indexes, and cascade behaviour are defined in `db/schema.js` and version-controlled under `drizzle/`.

After changing the schema:

```bash
npm run db:generate
npm run db:check
npm run db:migrate
npm run db:seed
```

The seed is intentionally non-destructive. Existing administrator-managed product fields, visibility, merchandising, variant data, and inventory are preserved; only missing seed records are inserted.

Order creation reads the authenticated customer's server-side cart, validates product, variant, size, quantity, and current stock, then creates the order, deducts SKU inventory, and clears the cart in the same database transaction.

### Provision an administrator

Register and verify the account first, then run:

```powershell
$env:DATABASE_URL="postgresql://..."
$env:ADMIN_EMAIL="owner@example.com"
npm run db:migrate
npm run db:promote-admin
```

Sign out and sign in again so `/api/auth/me` returns the updated `admin` role. Every `/api/admin/*` endpoint checks that role on the server; hiding or showing the frontend button is not treated as authorization.

## API overview

| Area | Representative endpoints |
| --- | --- |
| Catalogue | `GET /api/products`, `GET /api/products/:id`, `GET /api/exchange-rate` |
| Authentication | `POST /api/auth/register`, `GET /api/auth/verify-email`, `POST /api/auth/resend-verification`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/revoke-sessions` |
| Customer account | `/api/account/profile`, `/api/account/addresses`, `/api/account/orders` |
| Device Sessions | `GET /api/account/sessions`, `DELETE /api/account/sessions/:id`, `POST /api/account/sessions/revoke-others` |
| Shopping data | `/api/account/favourites`, `/api/account/cart` |
| Administration | `/api/admin/products`, `/api/admin/variants/:id`, `/api/admin/skus/:id`, `/api/admin/orders` |
| Monitoring | `POST /api/errors/report` |

`GET /api/products` supports `q`, `category`, `sale`, `inStock`, `minPrice`, `maxPrice`, `page`, and `limit` parameters.

## Security model

- Production traffic is redirected to HTTPS.
- Session identifiers are opaque values stored in `Secure`, `HttpOnly`, `SameSite=Strict` cookies.
- Only SHA-256 session-token hashes are stored in PostgreSQL.
- Sessions expire after seven days, track last use, and support immediate single-session or all-session revocation.
- State-changing requests reject mismatched origins.
- Authentication and authenticated writes use database-backed rate limiting keyed by hashed client IP.
- Passwords are salted and hashed; raw passwords and session tokens are never stored.
- Email verification tokens are one-time hashes with a 24-hour expiry.
- Password-reset tokens are stored only as one-time hashes, expire after one hour, and successful resets revoke every existing Session for the account.
- Frontend and backend error reports truncate diagnostics and store hashed, not raw, client IP data.

## Testing and deployment

The `Test and deploy` GitHub Actions workflow runs on pull requests and pushes to `codex/complete-blue-orchid-store`. Its verification job performs:

1. Dependency installation
2. Frontend and backend tests
3. Prettier formatting validation
4. Drizzle schema validation
5. Production build

For an eligible push, the deployment job downloads the verified build artifact, applies PostgreSQL migrations, runs the non-destructive seed, and deploys to the `blue-orchid-web-platform` Cloudflare Pages project.

The GitHub `production` environment must provide `DATABASE_URL`, `CLOUDFLARE_API_TOKEN`, and `CLOUDFLARE_ACCOUNT_ID`. Cloudflare must also provide the application runtime secrets and variables used by Pages Functions.

## Current limitations

- Checkout is simulated and does not collect or authorize payments.
- Refunds, returns management, coupons, tax calculation, shipment tracking, and fulfilment-provider integration are not implemented.
- Customer-service contact details and business hours are demonstration content.
- Product imagery is hosted remotely and requires network access.
- The Express development authentication fallback uses a local JSON file, while the deployed Cloudflare application uses PostgreSQL; those account stores are not synchronized.
- Error events are stored in PostgreSQL, but no external alerting dashboard or notification channel is connected yet.

## Suggested next steps

- Integrate a payment provider using server-side payment intents and webhook verification
- Add transactional order and shipping emails
- Add refunds, returns, coupons, tax, and fulfilment workflows
- Add database backup verification and recovery drills
- Expand browser-level end-to-end tests for customer and administrator journeys
- Connect error monitoring to an alerting and incident-management service
