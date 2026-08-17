# Project Documentation Source

## Metadata

**Generated From:** Current project repository (`c:\Camper` workspace containing `/Frontend` and `/backend`)  
**Documentation Purpose:** Source material for formal project documentation  
**Analysis Type:** Repository-based technical and functional analysis  
**Generated Date:** August 10, 2026  

---

# 1. Basic Project Overview — Source Information

## 1.1 Project Name

**Value:**
* **Display Name:** Camper
* **Company / Organization Name:** Compunic
* **Frontend Mobile Package Name:** `com.camper.dailybudgetapp`
* **Backend Application Name:** `camper_backend`
* **Monorepo Repository Name:** `camper`

**Status:** Confirmed

**Evidence:**
* `Frontend/app.json`: `{"name": "Compunic", "displayName": "Camper"}`
* `Frontend/package.json`: `"name": "com.camper.dailybudgetapp"`
* `backend/package.json`: `"name": "camper_backend"`
* Root Git Remote: `https://github.com/ayushkhale/camper.git`
* Backend Git Remote: `https://github.com/Compunic-startup/Camper_backend.git`

---

## 1.2 Project Description

**Documentation-Ready Summary:**
Camper is an enterprise-grade, multi-tenant B2B/B2C Daily Subscription, Route Delivery, and Financial Ledger Management Platform designed for water camper/can suppliers, milk distributors, and daily essential delivery businesses. The platform automates long-term customer subscription scheduling, daily route planning, driver task generation, returnable container deposit tracking, invoicing, customer account ledgers, and secure passwordless OTP authentication.

**Detailed Functional Description:**
The system comprises a mobile client application built with React Native and a RESTful backend API powered by Node.js, Express, Sequelize ORM, and PostgreSQL. 

Key functional subsystems include:
1. **Multi-Tenant Vendor Onboarding & Management:** Vendor owners register business details, choose industry service lines (e.g., Water Camper Delivery), and manage vendor profiles.
2. **Product Catalog & S3 Asset Management:** Products support returnable container flags, deposit amounts, price management, and secure private AWS S3 image storage with dynamic 2-hour pre-signed read URLs.
3. **Customer & Route Logistics:** Customers are linked to delivery routes with GPS coordinates, sequence ordering, opening balances, and credit limits. Routes are assigned to staff drivers with effective start and end date ranges to maintain a complete audit trail.
4. **Subscription Engine:** Flexible recurring rules (`daily`, `alternate_days`, `weekly`, `monthly`) define recurring customer orders.
5. **Daily Delivery Engine & Audit System:** Automated double-cron triggers (8:00 PM evening and 2:00 AM morning) evaluate recurrence rules and generate daily delivery tasks with frozen product pricing. Every delivery status transition (pending, delivered, skipped) is logged synchronously in a `DeliveryLog` audit table.
6. **One-Time Orders & Billing:** Supports ad-hoc customer orders, item fulfillment, uninvoiced delivery summaries, automated invoice generation with line items, and downloadable PDF invoices.
7. **Financial Ledgers & Deposit Management:** Tracks customer running balances, records payments with multi-invoice payment allocations, and manages returnable container deposits (collection, bill settlement, refund).
8. **Context ID OTP Authentication:** Secure, passwordless SMS OTP login and signup for Vendor Owners, Staff, and Customers using session Context IDs to eliminate race conditions and brute-force attempts.

**Status:** Confirmed

**Evidence:**
* Backend controllers and routes in `backend/src/controllers/` and `backend/src/routes/`
* Sequelize models in `backend/src/models/` (`User`, `Customer`, `Product`, `Route`, `Subscription`, `Delivery`, `Invoice`, `CustomerAccountLedger`, `CustomerDepositLedger`, etc.)
* React Native screens in `Frontend/src/Screens/` (`Auth/`, `Main/`)
* Internal engineering design documentation in `backend/memoryBank/` (`auth.md`, `customer.md`, `delivery.md`, `product.md`, `route.md`, `staff.md`, `subscription.md`, `one-time-order.md`, `override.md`)

---

## 1.3 Purpose / Business Problem

### Confirmed
1. **Manual Log Sheet Inefficiencies:** Eliminates manual paper-based record-keeping for daily recurring deliveries (such as 20L water cans).
2. **Container & Deposit Leakage:** Resolves loss of returnable containers/campers by explicitly tracking container deposits, empty container collections, and deposit refunds/settlements per customer.
3. **Delivery Route Chaos:** Streamlines daily field operations by assigning drivers to specific routes with sequence ordering and automated daily task generation.
4. **Billing & Reconciliation Errors:** Replaces end-of-month manual tallying with automated invoice generation, price-frozen delivery logs, customer account ledgers, and payment allocations.
5. **Authentication Security & Race Conditions:** Prevents OTP brute-force attacks and session conflicts by utilizing session-bound Context IDs (`OtpLog` table) instead of unauthenticated phone number lookups.

### Inferred
1. **Target Market:** Primary deployment target is daily essential logistics and delivery businesses in India, evidenced by default timezone `Asia/Kolkata` (UTC+05:30) and currency formatting patterns.
2. **Business Growth Support:** Designed to help small-to-medium water supply agencies scale operations without adding administrative overhead.

### Confirmation Required
1. Target delivery completion SLAs and explicit customer grace period policies for unpaid invoices.

---

## 1.4 Business Objectives

1. **Automate 100% of Daily Task Planning:** Automate daily delivery list creation for route drivers via automated cron jobs.
2. **Prevent Inventory Loss:** Account for every returnable water can/container through integrated deposit ledgers and empty bottle collection logs.
3. **Ensure Financial Integrity:** Guarantee historical revenue accuracy by freezing unit prices at delivery generation and maintaining immutable account ledger statements.
4. **Enforce Vendor Isolation:** Guarantee complete data isolation between competing vendors on a multi-tenant platform architecture.
5. **Improve Customer Experience:** Provide real-time delivery status tracking, digitized invoices, and multi-language support (English/Hindi).

**Evidence / Reasoning:**
Supported by Sequelize model relationships (`Delivery.unit_price_charged`, `CustomerDepositLedger`, `CustomerAccountLedger`), cross-vendor middleware checks (`serviceLineId` / `vendorAccountId` guards), and internationalization config (`Frontend/src/i18n/`).

---

## 1.5 Scope

### In Scope
* **Mobile Client Application (React Native 0.86.0):**
  * Auth screens (Login, OTP Verification, Vendor Signup, Complete Registration).
  * Main Navigation (Drawer navigation, Bottom Tabs, Stack Navigators).
  * Dashboard & Overview Screen.
  * Customer Management (Add, Edit, Detail, History, Delivery History, GPS location view).
  * Route Logistics & Builder (Create routes, assign staff with date ranges, sequence customers).
  * Product SKU Catalog (Create/edit products, returnable container deposit config, S3 image upload).
  * Subscriptions (Create recurring schedules, pause, update recurrence patterns).
  * Deliveries Engine UI (Today's deliveries, past deliveries, unbilled deliveries, mark delivered/skipped, collect empty cans).
  * One-Time Orders (Add ad-hoc orders, list orders, fulfill orders).
  * Billing & Invoicing (Pre-summary view, batch generate invoices, invoice detail, PDF view & print).
  * Ledgers & Payments (Record payments, account ledger statement, deposit ledger management).
  * Staff Management (Provision drivers/staff, activate/deactivate, assign to routes).
  * Multi-language support (English and local language translations via `i18next`).

* **Backend API & Processing Core (Node.js Express 5.2.1):**
  * REST API endpoints under `/api/public`, `/api/auth`, `/api/vendor/...`.
  * Context ID OTP verification system with dual IP & DB rate limiting.
  * AWS S3 integration for private product image storage and dynamic 2-hour pre-signed URL generation.
  * Dual-cron job engine (`08:00 PM` evening run & `02:00 AM` morning run) for delivery task generation.
  * `DeliveryLog` audit trail system for status transitions.
  * Invoicing calculation engine and PDF generation support (Handlebars HTML to PDF).
  * Multi-tenant data scoping enforced via JWT middleware (`authenticate`, `isVendorOwner`).
  * Database schema with 26 Sequelize models and paranoid soft deletes (`deleted_at`).

### Out of Scope
* **Payment Gateway Webhook Execution:** Razorpay webhook endpoint registration is commented out in `backend/src/app.js` (`app.use('/api/payment/webhook'...)`), indicating manual payment recording is currently used.
* **Super Admin Web Dashboard:** Web-based super admin management portal is not present in the frontend repository (super admin role exists in backend validation, but platform admin tasks are managed via direct DB/API).

### Scope Requiring Confirmation
* Out-of-scope boundaries require confirmation from the project owner regarding third-party payment gateway automation and SMS vendor API credentials in production.

---

## 1.6 Client / Department

**Value:** Compunic / Compunic Startup  
**Status:** Inferred — requires confirmation from project owner for end-client details if white-labeled.  
**Evidence:** Repository URL `https://github.com/Compunic-startup/Camper_backend.git` and `Frontend/app.json` (`"name": "Compunic"`).

---

## 1.7 Stakeholders

### Project / Business Stakeholders
* **Platform Owner Organization:** Compunic
* **Product Manager / Owner:** Ayush Khale (GitHub repository owner)
* **Technical Lead / Architect:** Compunic Development Team
* **Target Enterprise Clients:** Water Camper Vendors, Bottled Water Distributors, Daily Essential Suppliers

### System User Roles
1. `super_admin`: Platform Super Administrator (system maintenance, business category management).
2. `owner`: Vendor Account Owner (full access to vendor's products, routes, customers, staff, subscriptions, invoices, and ledgers).
3. `staff`: Field Delivery Driver / Staff Member (access to daily route delivery tasks, delivery status updates, bottle collection).
4. `customer`: End Customer (views subscriptions, order history, billing invoices, and account ledgers).

### Confirmation Required
* Individual business stakeholder names and steering committee contact details.

---

## 1.8 Project Owner

**Value:** Compunic (`ayushkhale` / `Compunic-startup`)  
**Status:** Inferred — project owner confirmation required for official enterprise entity name.  
**Evidence:** GitHub workspace remote `https://github.com/ayushkhale/camper.git` and backend repository `https://github.com/Compunic-startup/Camper_backend.git`.

---

## 1.9 Current Status

**Environment / Stage:** Active Development / Staging / Pre-Production  
**Evidence:** 
* Full backend API and data models operational with Docker (`Dockerfile`) and PM2 configuration (`ecosystem.config.js`).
* Comprehensive frontend mobile client implemented with React Native.
* API service configured for local development (`http://192.168.1.5:3007`) and staging environments (`https://api-camper.compunic.co.in`, Cloudflare tunnel `https://europe-template-bbs-feels.trycloudflare.com`).  

**Confidence:** High

---

## 1.10 Go-Live Date

**Value:** Not identified from current project files — project owner confirmation required.  
**Status:** Not Identified  

---

## 1.11 Version Information

| Component | Version | Evidence/Source |
| --- | --- | --- |
| Application (Overall) | `0.0.1` / `1.0.0` | Workspace configuration |
| Frontend Mobile App | `0.0.1` | `Frontend/package.json` |
| Backend API | `1.0.0` | `backend/package.json` |
| React Native Framework | `0.86.0` | `Frontend/package.json` |
| Node.js Runtime Engine | `>= 22.11.0` / `22-alpine` | `backend/package.json` & `backend/Dockerfile` |
| Express Framework | `5.2.1` | `backend/package.json` |
| Database Schema / ORM | Sequelize `6.37.8` | `backend/package.json` |

---

## 1.12 Technology Stack

### Frontend
* **Core Framework:** React Native `0.86.0`, React `19.2.3`
* **Build Tools & CLI:** `@react-native-community/cli` `20.1.0`, Metro `0.86.0`, Babel `7.25.2`
* **Navigation Architecture:** React Navigation `v7` (`@react-navigation/native` `7.3.8`, `@react-navigation/native-stack` `7.17.10`, `@react-navigation/bottom-tabs` `7.18.8`, `@react-navigation/drawer` `7.12.8`)
* **UI Components & Icons:** `lucide-react-native` `1.24.0`, `react-native-svg` `15.15.5`
* **Typography:** `@fontsource/geologica` `5.3.0`, `@expo-google-fonts/geologica` `0.4.2`
* **Animations & Gestures:** `react-native-reanimated` `4.5.1`, `react-native-worklets-core` `1.6.3`, `react-native-gesture-handler` `3.0.2`
* **Internationalization:** `i18next` `26.3.6`, `react-i18next` `17.0.9`
* **Storage & Native Modules:** `@react-native-async-storage/async-storage` `3.1.1`, `@react-native-community/datetimepicker` `9.1.0`, `react-native-contacts` `8.0.10`, `react-native-image-picker` `8.2.1`
* **PDF & Printing:** `react-native-html-to-pdf` `1.3.0`, `react-native-print` `0.11.0`, `react-native-share` `12.3.1`, `react-native-blob-util` `0.24.10`

### Backend
* **Runtime:** Node.js (v22 Alpine)
* **Framework:** Express `5.2.1` (ES Modules `"type": "module"`)
* **API Paradigm:** RESTful JSON API Architecture
* **Authentication & Security:** JWT (`jsonwebtoken` `9.0.3`), OTP Context ID architecture (`OtpLog`), Helmet `8.3.0`, CORS `2.8.6`, Express Rate Limit `8.5.2`
* **Data Validation:** Joi `18.2.3`
* **File Processing:** Multer `2.2.0` (Memory storage buffer)
* **Scheduling:** `node-cron` `4.6.0`
* **Templating & Utilities:** Handlebars `4.7.9`, Moment.js `2.30.1`, Axios `1.18.1`, Morgan `1.11.0`

### Database
* **Database Engine:** PostgreSQL
* **Driver:** `pg` `8.22.0`, `pg-hstore` `2.3.4`
* **ORM:** Sequelize `6.37.8`
* **Features:** Paranoid Soft Deletes (`deleted_at`), Timezone `Asia/Kolkata` (`+05:30`), Connection Pooling (max 5), SSL enabled (`rejectUnauthorized: false`)

### Infrastructure
* **Cloud Storage:** AWS S3 (`@aws-sdk/client-s3` `3.1087.0`, `@aws-sdk/s3-request-presigner` `3.1087.0`) with private bucket policy and dynamic pre-signed URLs
* **Containerization:** Docker (`node:22-alpine` image with unprivileged `camper_user`)
* **Process Manager:** PM2 (`ecosystem.config.js`)
* **Reverse Proxy / SSL:** Configured for Cloudflare (`app.set('trust proxy', 1)`)

### External Services / Integrations
* **AWS S3:** Product image storage & presigned URL delivery
* **SMS Gateway:** Abstracted SMS helper service (`src/services/otp.helper.service.js`)
* **Payment Gateway:** Razorpay infrastructure prepared (`app.js`)
* **Cloudflare:** CDN and Tunnel staging (`europe-template-bbs-feels.trycloudflare.com`)

### Development Tooling
* **Package Manager:** `npm`
* **Dev Server:** `nodemon` `3.1.12`
* **Linting & Formatting:** ESLint `8.19.0`, Prettier `2.8.8`
* **Testing Framework:** Jest `29.6.3`

---

## 1.13 Development Environment

* **Node.js Requirement:** `>= 22.11.0`
* **Backend Port:** `3007` (configurable via `PORT`)
* **Frontend Dev Server:** Metro Bundler on default React Native port `8081`
* **Build Commands:**
  * Backend Start: `npm start` (`node src/server.js`)
  * Backend Dev: `npm run dev` (`nodemon src/server.js`)
  * Frontend Android: `npm run android` (`react-native run-android`)
  * Frontend iOS: `npm run ios` (`react-native run-ios`)
  * Frontend Metro: `npm start` (`react-native start`)

* **Environment Variables (Name Reference Only — Secrets Redacted):**
  * `PORT` — Backend HTTP port
  * `NODE_ENV` — Execution environment (`development`, `production`)
  * `TZ` — Server timezone setting (`Asia/Kolkata`)
  * `DB_HOST` — PostgreSQL database host
  * `DB_NAME` — PostgreSQL database name
  * `DB_USER` — Database user
  * `DB_PASSWORD` — `[REDACTED — sensitive credential]`
  * `DB_TIMEZONE` — Database connection timezone (`+05:30`)
  * `JWT_SECRET` — `[REDACTED — sensitive credential]`
  * `AWS_REGION` — AWS S3 region (`ap-south-1`)
  * `AWS_ACCESS_KEY_ID` — AWS access key ID
  * `AWS_SECRET_ACCESS_KEY` — `[REDACTED — sensitive credential]`
  * `AWS_S3_BUCKET` — AWS S3 bucket name
  * `SMS_API_KEY` — `[REDACTED — sensitive credential]`

---

## 1.14 Server Details

* **Container Base:** Docker `node:22-alpine`
* **Process Manager:** PM2 (`ecosystem.config.js`, application name: `camper`)
* **User Security:** Dedicated unprivileged Linux user `camper_user` inside Docker container
* **Listening Port:** `3007`
* **Staging Server Domains:**
  * `https://api-camper.compunic.co.in`
  * `https://surakshamart.icompunic.com`
  * `https://europe-template-bbs-feels.trycloudflare.com`

---

## 1.15 Database Information

**Database Engine:** PostgreSQL  
**Database Name:** Configured via `DB_NAME` (Environment variable)  
**ORM / Data Access:** Sequelize `6.37.8`  
**Additional Notes:**
* 26 Database Models: `users`, `vendor_accounts`, `business_categories`, `vendor_service_lines`, `platform_plans`, `platform_subscriptions`, `platform_subscription_logs`, `products`, `routes`, `customers`, `staff_routes`, `subscriptions`, `subscription_overrides`, `subscription_pauses`, `deliveries`, `delivery_logs`, `service_tickets`, `one_time_orders`, `one_time_order_items`, `invoices`, `invoice_line_items`, `customer_account_ledgers`, `customer_deposit_ledgers`, `payment_allocations`, `otp_logs`.
* Soft Deletion: Applied across critical entities via `paranoid: true` (`deleted_at`).
* Multi-Tenant Isolation: Enforced by `vendor_account_id` and `service_line_id` foreign keys.

---

## 1.16 Source Code Repository

* **Monorepo / Workspace:** `c:\Camper`
* **Root Git Repository:** `https://github.com/ayushkhale/camper.git`
* **Backend Git Repository:** `https://github.com/Compunic-startup/Camper_backend.git`
* **Default Branch:** `main`

---

## 1.17 Deployment Environment

**Stage:** Staging / Pre-Production  
**Confirmed Mechanisms:**
* Docker Containerization (`Dockerfile`)
* PM2 Runtime Execution (`ecosystem.config.js`)
* Cloudflare Tunnel Reverse Proxy

**Inferred Mechanisms:**
* CI/CD automation via GitHub Actions (inferred from repository structure, requires confirmation).

---

## 1.18 Key Contacts

| Responsibility | Name / Contact | Status |
| --- | --- | --- |
| Project Owner | Compunic / Ayush Khale | Inferred — Confirmation Required |
| Business Owner | Confirmation Required | User Confirmation Required |
| Technical Lead | Ayush Khale / Compunic Team | Inferred — Confirmation Required |
| Frontend Lead | Confirmation Required | User Confirmation Required |
| Backend Lead | Confirmation Required | User Confirmation Required |
| Database Administrator | Confirmation Required | User Confirmation Required |
| DevOps / Infrastructure | Confirmation Required | User Confirmation Required |
| Client Contact | Confirmation Required | User Confirmation Required |

---

# 2. Repository Evidence

| Documentation Item | File/Folder Used | What It Confirms |
| --- | --- | --- |
| Project Identity & Name | `Frontend/app.json`, `Frontend/package.json`, `backend/package.json` | App display name "Camper", package name "com.camper.dailybudgetapp", backend name "camper_backend". |
| Monorepo & Git Origin | `.git/config`, `backend/.git/config` | Remotes `https://github.com/ayushkhale/camper.git` and `https://github.com/Compunic-startup/Camper_backend.git`. |
| Technology Stack (Frontend) | `Frontend/package.json` | React Native 0.86.0, React 19.2.3, React Navigation 7, Reanimated 4, i18next, PDF/Print utilities. |
| Technology Stack (Backend) | `backend/package.json`, `backend/src/app.js` | Express 5.2.1, Sequelize 6.37.8, AWS SDK v3, Joi, Node-Cron, Multer, Helmet, Rate Limiter. |
| Database Engine & Schema | `backend/src/config/db.js`, `backend/src/models/index.js` | PostgreSQL engine with SSL, timezone +05:30, 26 Sequelize models with full relational associations. |
| Authentication System | `backend/src/controllers/auth.controller.js`, `backend/memoryBank/auth.md` | OTP verification using session Context IDs (`OtpLog`), rate limiting, stub user creation, complete registration flow. |
| Product & S3 Management | `backend/src/controllers/product.controller.js`, `backend/memoryBank/product.md` | AWS S3 private storage, 2-hour pre-signed URLs, returnable container deposit configuration. |
| Delivery Generator Engine | `backend/src/services/delivery-generator.service.js`, `backend/src/jobs/delivery.cron.js` | Idempotent task generation for recurrence patterns, 8 PM & 2 AM crons, price freezing, `DeliveryLog` audit trail. |
| Route Logistics & Staff | `backend/src/controllers/route.controller.js`, `backend/src/models/StaffRoute.js` | Route zones, customer sequence order, staff assignment with effective start/end date ranges. |
| Billing & Financial Ledgers | `backend/src/routes/invoice.routes.js`, `ledger.routes.js`, `deposit.routes.js` | Invoicing summaries, invoice generation, customer account ledger statements, deposit collection/settlement/refund. |
| Deployment Setup | `backend/Dockerfile`, `backend/ecosystem.config.js` | Node 22 Alpine Docker image, unprivileged `camper_user`, PM2 cluster runtime on port 3007. |

---

# 3. Missing Information / Questions for Project Owner

1. **What is the official target production go-live date?**
   * *Reason:* No launch date or release milestone is present in repository configuration files.
2. **Which SMS Gateway provider credentials will be used for production OTP delivery?**
   * *Reason:* `src/services/otp.helper.service.js` contains abstract SMS dispatch logic; production API key and template IDs need confirmation.
3. **What are the official payment gateway credentials and webhook secrets for Razorpay?**
   * *Reason:* Razorpay webhook handler registration is commented out in `backend/src/app.js`.
4. **Who are the named leads for Project Owner, Business Lead, Frontend Lead, Backend Lead, and DevOps?**
   * *Reason:* Repository metadata identifies organization (`Compunic`) and maintainer (`ayushkhale`), but individual operational roles require confirmation.
5. **Is the mobile application planned for public App Store / Play Store release or private enterprise distribution?**
   * *Reason:* Mobile bundle ID `com.camper.dailybudgetapp` exists, but store deployment configuration (signing credentials, provision profiles) is not checked into the repository.

---

# 4. Documentation Confidence Summary

| Area | Confidence | Notes |
| --- | --- | --- |
| Project Identity | High | Verified from package manifest files, app config, and git remotes. |
| Functional Description | High | Inferred directly from 26 backend models, 13 API route modules, and 33 React Native screens. |
| Technology Stack | High | Extracted directly from package lock and configuration files. |
| Database Architecture | High | Confirmed by inspecting Sequelize database config and model association map. |
| Deployment & Server | High | Validated from `Dockerfile`, PM2 `ecosystem.config.js`, and Express server config. |
| Business Information | Medium | Core business logic is fully visible in code, but target corporate client names require confirmation. |
| Stakeholder Information | Medium | Developer handle and company namespace identified; individual human roles require owner confirmation. |

---

# Suggested Documentation Modules Discovered

Based on the actual implementation of this application, the following specialized documentation modules should logically be generated in subsequent steps:

1. **System Architecture & Data Isolation Specification:** Deep dive into multi-tenant scoping (`serviceLineId`/`vendorAccountId`), micro-service readiness, and JWT payload structure.
2. **OTP Context ID Authentication & Security Model:** Complete technical specification of passwordless login, Context ID state machine, rate limiting, and stub-to-complete vendor signup flow.
3. **Product Catalog & AWS S3 Presigned URL Lifecycle:** Specification of S3 bucket security, memory-buffered file uploads, presigned URL generation, and returnable container deposit setup.
4. **Delivery Generator Engine & Recurrence Mathematics:** Algorithm documentation for `daily`, `alternate_days`, `weekly`, and `monthly` delivery task generation, price freezing, and double-cron scheduling.
5. **Route Logistics & Staff Assignment History Module:** Detailed guide for route zones, customer sequence ordering, and staff route assignments with date range auditing (`effectiveFrom`/`effectiveTo`).
6. **Billing, Invoicing & PDF Generation Engine:** Documentation of uninvoiced delivery summaries, batch invoice generation, line item calculation, and PDF export workflows.
7. **Customer Account & Deposit Ledger Accounting System:** Detailed accounting specification for customer running balances, payment allocations, deposit collections, settlements, and refunds.
8. **Mobile Application Architecture & Screen Flow Guide:** Detailed walkthrough of React Native navigation hierarchy, screen states, i18n localization, and offline/API integration patterns.
9. **DevOps, Docker & PM2 Deployment Guide:** Operational guide for container building, PM2 process management, Cloudflare tunnel setup, and environment variable configuration.
