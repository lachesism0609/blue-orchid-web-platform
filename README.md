# Blue Orchid Fashion Store

Blue Orchid is a bilingual fashion e-commerce application built with React, Vite, Node.js, and Express. It covers the core shopping journey, including product discovery, favourites, cart management, checkout confirmation, customer accounts, and order history.

The project is suitable as an online fashion store prototype, a full-stack learning project, or a foundation for further commercial development.

> This is currently a demonstration project. User data is stored in a local JSON file, currency conversion uses a fixed sample rate, and checkout does not process real payments.

## Features

### Storefront and Products

- Responsive homepage with brand navigation, an automatic hero carousel, category shortcuts, popular products, and service highlights
- Dedicated pages for New Arrivals, Women, Men, Bags, Shoes, Accessories, and Sale
- Chinese and English interface switching
- CNY and EUR currency switching using the sample rate `1 EUR = CNY 7.80`
- Product colour selectors with corresponding image previews
- Consistent sale prices, original prices, and discount badges across all relevant pages
- Product favourites with success notifications and a dedicated favourites page
- Enhanced About page with brand information, values, imagery, and customer service details

### Cart and Orders

- Add-to-cart controls on every product card
- Editable item quantities, item removal, and price totals in the cart
- Complete simulated checkout flow:
  1. Continue from the cart to the order review page
  2. Review products, quantities, unit prices, and the order total
  3. Select an existing delivery address
  4. Confirm the purchase and create an order
  5. View a purchase success page
  6. Automatically continue to Order History in the customer account
- Order history and order details, including products, quantities, prices, order time, status, and delivery address
- Cart and favourite data persisted in browser `localStorage`

### Customer Accounts

- Customer registration, login, and session validation
- Personal information viewing and editing
- Delivery address creation, viewing, and deletion
- Page restoration after refreshing account, cart, favourites, and category pages
- Passwords stored using Node.js `scrypt` with a unique salt
- HMAC-SHA256 signed authentication tokens with a default seven-day lifetime

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite 6, CSS |
| Backend | Node.js, Express 4 |
| Authentication | `crypto.scryptSync`, HMAC-SHA256 tokens |
| Data storage | Local JSON file and browser `localStorage` |
| Development proxy | Vite `/api` proxy to Express |

## Getting Started

### Requirements

- Node.js 18 or later
- npm

### Install Dependencies

```bash
npm install
```

If the Windows PowerShell execution policy prevents `npm.ps1` from running, use:

```powershell
npm.cmd install
```

### Configure the Authentication Secret

The repository includes `.env.example` as a variable reference. The server does not currently load `.env` automatically, so set `AUTH_SECRET` in the terminal or deployment environment before starting the application.

Windows PowerShell:

```powershell
$env:AUTH_SECRET="replace-with-a-long-random-secret"
npm run dev
```

macOS or Linux:

```bash
AUTH_SECRET="replace-with-a-long-random-secret" npm run dev
```

A built-in fallback value is available for local development, but production environments must use a unique, securely generated secret. Changing the secret invalidates previously issued authentication tokens.

### Start the Development Environment

```bash
npm run dev
```

The application is normally available at:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3010`

The `npm run dev` command starts both the Vite frontend and Express backend. Registration, login, address management, and order features require the backend service to be running.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the frontend and backend development services |
| `npm run dev:client` | Start only the Vite frontend |
| `npm run server` | Start only the Express backend on port 3010 by default |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |

## API Overview

During frontend development, Vite proxies `/api` requests to `http://localhost:3010`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/products` | Retrieve products; supports `q`, `category`, `sale`, `inStock`, `minPrice`, `maxPrice`, `page`, and `limit` |
| `GET` | `/api/products/:productId` | Retrieve product details, sizes, materials, price, and live availability |
| `POST` | `/api/auth/register` | Register a customer |
| `POST` | `/api/auth/login` | Log in and create a secure server-side session |
| `POST` | `/api/auth/logout` | Revoke the current session |
| `POST` | `/api/auth/revoke-sessions` | Revoke every active session for the customer |
| `GET` | `/api/auth/me` | Retrieve the authenticated customer |
| `PUT` | `/api/account/profile` | Update personal information |
| `GET` | `/api/account/addresses` | Retrieve delivery addresses |
| `POST` | `/api/account/addresses` | Create a delivery address |
| `DELETE` | `/api/account/addresses/:addressId` | Delete a delivery address |
| `GET` | `/api/account/orders` | Retrieve order history |
| `POST` | `/api/account/orders` | Create an order |

Protected account endpoints use an opaque session token stored in a `Secure`, `HttpOnly`, `SameSite=Strict` cookie. JavaScript cannot read the token. Sessions are stored as SHA-256 token hashes, expire after seven days, track last use, and can be revoked immediately. The API temporarily accepts bearer tokens for backwards compatibility, but the React client no longer stores credentials in `localStorage`.

Production HTTP requests are redirected to HTTPS. State-changing requests reject a mismatched `Origin`, authentication endpoints are rate limited per hashed client IP, and authenticated writes have a separate limit. Rate-limit state and session revocations are stored in the database so they remain effective across Cloudflare isolates.

## Project Structure

```text
blue-orchid-web-platform/
├─ src/
│  ├─ main.jsx          # React views, navigation state, and store interactions
│  └─ styles.css        # Application-wide responsive styles
├─ server/
│  ├─ index.js          # Express API, authentication, and data handling
│  ├─ dev.js            # Combined frontend and backend development launcher
│  └─ data/             # Local customer, address, and order data (not committed)
├─ .env.example         # Authentication secret variable reference
├─ vite.config.js       # Vite configuration and API proxy
└─ package.json         # Dependencies and project scripts
```

## Data and Navigation State

- Customer, address, and order data is stored in `server/data/users.json`. The data directory is excluded from Git.
- Favourites and cart contents are stored in the browser. Clearing the site's browser data removes them.
- The current page is represented by a URL hash such as `#cart`, `#account`, or `#about`, allowing the application to restore the page after a refresh.
- Product images are loaded from remote image services and may be unavailable when offline or when an image provider cannot be reached.

## Cloudflare Deployment

The repository includes a Cloudflare Pages Functions backend and a D1 schema for a full-stack deployment:

- `functions/api/[[path]].js` provides the product, authentication, profile, address, and order APIs.
- `migrations/0001_initial.sql` creates the D1 tables and indexes.
- `public/_routes.json` limits Pages Functions invocations to `/api/*`, leaving static assets on the Pages CDN.

Create a Cloudflare Pages project connected to this repository with the following build settings:

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

Create a D1 database, execute `migrations/0001_initial.sql`, `migrations/0002_email_verification.sql`, and `migrations/0003_secure_sessions.sql`, then bind it to the Pages project using the variable name `DB`. Also create encrypted Pages secrets named `AUTH_SECRET` and `RESEND_API_KEY`, plus the `EMAIL_FROM` and `SITE_URL` variables. `EMAIL_FROM` must use a sender/domain verified in Resend; `SITE_URL` must be the public Pages origin such as `https://blue-orchid-web-platform.pages.dev`. Redeploy the project after adding or changing bindings.

New customers receive a one-time verification link that expires after 24 hours. Login is blocked until verification succeeds, and the login dialog can resend the message. For development demonstrations, `DEV_EMAIL_VERIFICATION=true` returns the verification URL in the registration response and displays a demo verification button when email delivery is not configured. Do not enable this variable for a public production store.

The original Express server remains available for local development through `npm run dev`. Local Express data and production Cloudflare D1 data are independent and are not synchronized automatically.

### Managed PostgreSQL and migrations

The application supports managed PostgreSQL through Neon's serverless HTTP driver. When `DATABASE_URL` is configured, Pages Functions use PostgreSQL; when it is absent, the existing D1 binding remains available as a transition fallback.

The version-controlled Drizzle schema is located in `db/schema.js`, and generated SQL migrations are stored in `drizzle/`. Use the following workflow after changing the schema:

```bash
npm run db:generate
npm run db:check
DATABASE_URL="postgresql://..." npm run db:migrate
```

For PowerShell:

```powershell
$env:DATABASE_URL="postgresql://..."
npm run db:migrate
```

Never commit `DATABASE_URL`. Store it as an encrypted Cloudflare Pages secret. Apply migrations before deploying application code that depends on a schema change. The PostgreSQL migrations create customers, verification tokens, sessions, rate limits, product inventory, addresses, orders, order items, foreign keys, indexes, and cascade rules. Order creation validates requested quantities against current inventory and deducts stock in the same database batch as the order.

## Current Limitations

- No real payment gateway is connected; confirming a purchase only creates a simulated order.
- The local Express server still uses JSON storage and is intended only for development. Cloudflare deployments can use managed PostgreSQL, with D1 retained only as a migration fallback.
- There is no administration dashboard, inventory management, delivery tracking, refund workflow, or coupon system.
- EUR prices use the latest EUR/CNY reference rate supplied by Frankfurter and cached for one hour. The last successful rate is retained locally as a network-failure fallback.
- Customer service email addresses, telephone numbers, and opening hours shown in the application are sample information.

## Suggested Next Steps

- Add automated database backups, migration checks in CI, and recovery drills
- Use HTTPS, secure cookies, request rate limiting, and stronger session revocation controls
- Add product details, search, filtering, pagination, and inventory validation
- Integrate payment, fulfilment, transactional order emails, and order status workflows
- Add automated frontend and backend tests, error monitoring, and a deployment pipeline
