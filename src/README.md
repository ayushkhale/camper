# Source Structure

The application source is organized by ownership rather than by file type.

## Top-level areas

- `app/`: application shell, providers, navigation, and startup-only screens.
- `features/`: business modules. Each module owns its screens and feature-specific components.
- `shared/`: reusable components, constants, assets, i18n, services, and utilities.

## API service structure

- `shared/services/api.js`: compatibility facade used by existing application imports.
- `shared/services/api/client.js`: authenticated request helpers, role prefix, refresh queue, logging, and plan-limit handling.
- `shared/services/api/index.js`: combines domain modules into the unchanged public `api` object.
- `shared/services/api/*Api.js`: domain-owned API methods for auth, customers, deliveries, subscriptions, invoices, payments, products, reports, routes, staff, and plan billing.

Screens continue importing `{ api }` from `shared/services/api`; endpoints, method names, payloads, and response handling stay behind that stable boundary.

## Feature modules

- `auth`
- `dashboard`
- `customers`
- `deliveries`
- `delivery-subscriptions`
- `invoices`
- `one-time-orders`
- `payments`
- `plan-billing`
- `products`
- `reports`
- `routes`
- `settings`
- `staff`

Customer delivery subscriptions and vendor plan billing are intentionally separate domains.
Feature `index.js` files are their public entry points for app-level navigation imports.

## Validation

Run `npm run check:imports` after moving a source file. It checks every local import,
export, dynamic import, and `require` path before Metro is started.
