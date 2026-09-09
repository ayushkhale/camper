# Source Structure

The application source is organized by ownership rather than by file type.

## Top-level areas

- `app/`: application shell, providers, navigation, and startup-only screens.
- `features/`: business modules. Each module owns its screens and feature-specific components.
- `shared/`: reusable components, constants, assets, i18n, services, and utilities.

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
