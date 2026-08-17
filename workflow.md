# Camper Frontend Architecture & Component Workflow Analysis

> **Last Updated:** August 13, 2026  
> **Workspace Root:** `c:\Camper\Frontend`  
> **Framework:** React Native (CLI / Bare)  
> **Navigation:** `@react-navigation/native` (Stack + Drawer + Bottom Tabs)  
> **State & Auth:** React Context (`AuthContext`, `AlertContext`) + `@react-native-async-storage/async-storage`  
> **Styling & UI:** Custom Theme System (`src/constants/colors.js`), SVG Graphics (`react-native-svg`), Lucide Icons (`lucide-react-native`), Custom Animated Toasts & Dialogs  
> **Internationalization:** `react-i18next` (English & Hindi support)  

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Project Structure](#2-project-structure)
3. [Navigation Hierarchy & Flow](#3-navigation-hierarchy--flow)
4. [Global State & Context Systems](#4-global-state--context-systems)
5. [Page & Screen Components Analysis](#5-page--screen-components-analysis)
   - [5.1 Authentication Screens](#51-authentication-screens)
   - [5.2 Onboarding Screens](#52-onboarding-screens)
   - [5.3 Main Bottom Tab Screens](#53-main-bottom-tab-screens)
   - [5.4 Customer Management Screens](#54-customer-management-screens)
   - [5.5 Order & Delivery Management Screens](#55-order--delivery-management-screens)
   - [5.6 Route Management Screens](#56-route-management-screens)
   - [5.7 Product Catalog & SKU Screens](#57-product-catalog--sku-screens)
   - [5.8 Subscription Management Screens](#58-subscription-management-screens)
   - [5.9 One-Time Order Screens](#59-one-time-order-screens)
   - [5.10 Invoicing & Billing Screens](#510-invoicing--billing-screens)
   - [5.11 Staff & Settings Screens](#511-staff--settings-screens)
6. [Reusable Components & Modals](#6-reusable-components--modals)
7. [API Service Layer (`src/services/api.js`)](#7-api-service-layer-srcservicesapijs)
8. [Design Tokens & i18n Localization](#8-design-tokens--i18n-localization)
9. [Automated Code-Change Workflow & Maintenance Guidelines](#9-automated-code-change-workflow--maintenance-guidelines)
10. [Date & Day-Wise Task Activity Log](#10-date--day-wise-task-activity-log)

---

## 1. Architecture Overview

The **Camper Frontend** application is a production-grade React Native mobile application built for water delivery vendors, staff, and logistics management. It supports multi-tenant vendor operations, daily delivery routing, customer jar tracking, automated monthly invoicing, security deposit collection, and customer account ledgers.

```
                  +-----------------------------------+
                  |          App.jsx Entry            |
                  +-----------------------------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
  +------------------+                             +------------------+
  |  SafeAreaView    |                             |  AlertProvider   |
  +------------------+                             +------------------+
                                    |
                            +---------------+
                            | AuthProvider  |
                            +---------------+
                                    |
                        +-----------------------+
                        |    RootNavigator      |
                        +-----------------------+
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
+-------------------+     +--------------------+    +--------------------+
|    AuthStack      |     |  CompleteRegister  |    |     MainDrawer     |
| (Login/OTP/Reg)   |     |    (Vendor Info)   |    |  (Tabs + Screens)  |
+-------------------+     +--------------------+    +--------------------+
```

---

## 2. Project Structure

```
c:\Camper\Frontend\
├── App.jsx                               # Root application wrapper
├── index.js                              # React Native entry point
├── package.json                          # Dependencies & scripts
├── metro.config.js / babel.config.js     # Build configurations
└── src/
    ├── assets/                           # Logos, images & fallbacks
    │   ├── englishlogo.png
    │   ├── hindilogo.png
    │   └── customerfallback.png
    ├── constants/
    │   └── colors.js                     # Design system palette
    ├── context/
    │   ├── AlertContext.jsx              # Global animated toast & dialog popups
    │   └── AuthContext.js                # Auth token & user persistence
    ├── i18n/
    │   └── index.js                      # Translations (English / Hindi)
    ├── navigation/
    │   ├── AuthStack.jsx                 # Login & Registration stack
    │   ├── CustomDrawerContent.jsx       # Drawer side-menu UI
    │   ├── MainDrawer.jsx                # Main Drawer navigator
    │   ├── MainTabs.jsx                  # Bottom Tab navigator
    │   └── RootNavigator.jsx             # Top-level dynamic navigator
    ├── services/
    │   └── api.js                        # Complete REST API client & PDF downloader
    ├── utils/
    │   └── seedDatabase.js               # Dev data seeder
    ├── components/
    │   ├── CurvedHeader.jsx              # Reusable curved SVG header
    │   ├── DeliveryStatusSlider.jsx      # Swipe-to-confirm status control
    │   └── modals/
    │       ├── AddCustomerModal.jsx      # Quick customer creation modal
    │       ├── AddProductModal.jsx       # Quick product creation modal
    │       └── AddRouteModal.jsx         # Quick route creation modal
    └── Screens/
        ├── Auth/
        │   ├── LoginScreen.jsx
        │   ├── OtpVerificationScreen.jsx
        │   ├── RegisterScreen.jsx
        │   └── CompleteRegistrationScreen.jsx
        ├── onboardings/
        │   ├── OnboardingScreen1.jsx
        │   └── OnboardingScreen2.jsx
        └── Main/
            ├── AddCustomerScreen.jsx
            ├── AddOneTimeOrderScreen.jsx
            ├── AddProductScreen.jsx
            ├── AddRouteScreen.jsx
            ├── AddStaffScreen.jsx
            ├── AddSubscriptionScreen.jsx
            ├── CustomerDeliveryHistoryScreen.jsx
            ├── CustomerDetailScreen.jsx
            ├── CustomerHistoryScreen.jsx
            ├── CustomerListScreen.jsx
            ├── GenerateInvoiceScreen.jsx
            ├── HomeScreen.jsx
            ├── InvoiceDetailScreen.jsx
            ├── InvoiceListScreen.jsx
            ├── OneTimeOrderListScreen.jsx
            ├── OrdersScreen.jsx
            ├── PastDeliveriesScreen.jsx
            ├── PaymentsScreen.jsx
            ├── ProductCatalogScreen.jsx
            ├── ProductDetailScreen.jsx
            ├── ProfileScreen.jsx
            ├── RouteBuilderScreen.jsx
            ├── RouteDetailScreen.jsx
            ├── RouteListScreen.jsx
            ├── SettingsScreen.jsx
            ├── StaffManagementScreen.jsx
            ├── SubscriptionDetailScreen.jsx
            ├── SubscriptionListScreen.jsx
            └── UnbilledDeliveriesScreen.jsx
```

---

## 3. Navigation Hierarchy & Flow

Navigation is powered by `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/drawer`, and `@react-navigation/bottom-tabs`.

### Navigation Decision Engine (`src/navigation/RootNavigator.jsx`)
1. **Loading State**: If `isLoading` is true, displays a full-screen `ActivityIndicator`.
2. **Logged Out (`userToken === null`)**: Renders `AuthStack` (`Login`, `Register`, `OtpVerification`).
3. **Registration Incomplete (`user.vendorAccountId === null`)**: Renders `CompleteRegistrationScreen`.
4. **Authenticated Vendor**: Renders `MainDrawer` as root, with nested Stack screens for detail pages.

### Bottom Tab Bar (`src/navigation/MainTabs.jsx`)
- **`Home`**: Links to `HomeScreen` with custom `HomeHeader` containing drawer toggle, `Camper` logo, and vendor avatar.
- **`Deliveries`**: Links to `OrdersScreen`.
- **`Payments`**: Links to `PaymentsScreen`.
- **`Customers`**: Links to `CustomerListScreen`.

### Side Drawer (`src/navigation/MainDrawer.jsx` + `src/navigation/CustomDrawerContent.jsx`)
- **Header**: Vendor business profile card, avatar, contact phone, and active status indicator.
- **Navigation Options**:
  - Home (`MainTabs`)
  - Route Management (`RouteList`)
  - Product Catalog (`ProductCatalog`)
  - Subscriptions (`SubscriptionList`)
  - One-Time Orders (`OneTimeOrderList`)
  - Invoices & Billing (`InvoiceList`)
  - Unbilled Deliveries (`UnbilledDeliveries`)
  - Staff Management (`StaffManagement`)
  - Settings & Profile (`Settings`)
- **Footer**: Language toggle (English / Hindi) and Logout trigger.

---

## 4. Global State & Context Systems

### 1. `AuthContext.js` ([AuthContext.js](file:///c:/Camper/Frontend/src/context/AuthContext.js))
- **State**: `isLoading`, `userToken`, `user`.
- **AsyncStorage Keys**: `jwt_token`, `user_data`.
- **Methods**:
  - `login(token, userData)`: Stores token & user in storage and context state.
  - `logout()`: Clears storage and resets user context state to `null`.

### 2. `AlertContext.jsx` ([AlertContext.jsx](file:///c:/Camper/Frontend/src/context/AlertContext.jsx))
- **Toast Notifications**: `showAlert(title, message, type)`
  - Animated top banner (`success`, `error`, `warning`, `info`) with spring entrance and auto-dismiss after 3.5 seconds.
- **Minimal Popups**: `showPopup(title, message, buttons)`
  - Modal overlay styled after iOS native alert dialogs with customizable action buttons (`destructive`, `cancel`, `default`).

---

## 5. Page & Screen Components Analysis

### 5.1 Authentication Screens

#### `LoginScreen.jsx` ([LoginScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Auth/LoginScreen.jsx))
- **Purpose**: Mobile number login entry point.
- **Key Features**: Phone input (+91 prefix), rate-limiting error handling, bilingual app logo display, navigation to OTP Verification & Registration.
- **API Call**: `api.loginRequestOtp(phone)`

#### `OtpVerificationScreen.jsx` ([OtpVerificationScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Auth/OtpVerificationScreen.jsx))
- **Purpose**: 6-digit OTP code verification for both login & signup workflows.
- **Key Features**: Auto-focus OTP inputs, resend timer countdown (30s), rate-limit toast alert, context-driven auth login.
- **API Calls**: `api.loginVerifyOtp(contextId, otp)`, `api.signupVerifyOtp(contextId, otp)`, `api.resendOtp(contextId)`

#### `RegisterScreen.jsx` ([RegisterScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Auth/RegisterScreen.jsx))
- **Purpose**: Initial vendor sign-up step.
- **Key Features**: Phone number collection, terms & conditions acknowledgment link, navigation to OTP screen on success.
- **API Call**: `api.signupRequestOtp(phone)`

#### `CompleteRegistrationScreen.jsx` ([CompleteRegistrationScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Auth/CompleteRegistrationScreen.jsx))
- **Purpose**: Business profile onboarding after initial phone OTP verification.
- **Key Features**: Owner name, business name, category selection, email, full address, pincode, city, state, country. Updates global user state upon completion.
- **API Calls**: `api.getCategories()`, `api.completeRegistration(...)`

---

### 5.2 Onboarding Screens

#### `OnboardingScreen1.jsx` & `OnboardingScreen2.jsx`
- **Purpose**: Interactive feature walk-through slides for first-time app users explaining water delivery scheduling and automated invoicing.

---

### 5.3 Main Bottom Tab Screens

#### `HomeScreen.jsx` ([HomeScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/HomeScreen.jsx))
- **Purpose**: Main operations dashboard.
- **Key Features**:
  - Dynamic visual widgets & animated graphs (SVG routes, bar graphs).
  - High-level KPIs: Today's Deliveries, Active Customers, Monthly Revenue, Pending Payments.
  - Granular Delivery Stats: Combined highlighted tracking for Pending and Skipped deliveries (`X Pending • Y Skipped`) with progress indicator.
  - Jar Inventory Counter (Full Jars vs Empty Jars in circulation).
  - Quick Action Buttons: Add Customer, Generate Daily Deliveries, Record Payment, Create Route.
  - Today's Route & Delivery Progress cards with pull-to-refresh (`useFocusEffect`).
- **API Calls**: `api.getDashboardStats()`, `api.generateDeliveries(...)`, `api.listDeliveries(...)`

#### `OrdersScreen.jsx` (Deliveries) ([OrdersScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/OrdersScreen.jsx))
- **Purpose**: Real-time daily delivery route tracking and status updating.
- **Key Features**:
  - Interactive Date Selector bar.
  - Route & Status filter modals (Pending, Completed, Skipped, All).
  - Linear Progress Card with explicit Completed, Pending, and Skipped delivery counters.
  - Delivery Card list featuring customer details, sequence number, address, assigned items, and jar counts.
  - Delivery Status updating via `DeliveryStatusSlider` (Delivered, Pending, Skipped/Missed, Cancelled).
  - Empty jar collection & extra bottle counter controls.
- **API Calls**: `api.listDeliveries(date, routeId, status)`, `api.updateDeliveryStatus(id, statusData)`, `api.listRoutes()`

#### `PaymentsScreen.jsx` ([PaymentsScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/PaymentsScreen.jsx))
- **Purpose**: Payment collection, customer account ledger management, and deposit records.
- **Key Features**:
  - Tabbed views: Record Payment, Ledger History, Deposit Collection.
  - Payment mode selection (Cash, UPI, Bank Transfer, Cheque).
  - Outstanding balance summary per customer.
- **API Calls**: `api.recordPayment(...)`, `api.getAccountStatement(customerId)`, `api.collectDeposit(...)`, `api.refundDeposit(...)`

#### `CustomerListScreen.jsx` ([CustomerListScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/CustomerListScreen.jsx))
- **Purpose**: Central customer directory.
- **Key Features**: Search bar, route filter dropdown, customer list with contact buttons (Call, WhatsApp), active subscription badges, navigation to Customer Details & Add Customer screen.
- **API Calls**: `api.listCustomers(search, routeId)`

---

### 5.4 Customer Management Screens

#### `AddCustomerScreen.jsx` ([AddCustomerScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/AddCustomerScreen.jsx))
- **Purpose**: Full-featured customer creation & editing wizard.
- **Key Features**: Personal info (name, mobile, alternate phone), delivery address, route assignment, sequence positioning, pricing model (Standard vs Custom per-SKU rates), initial jar balance setup, security deposit recording.
- **API Calls**: `api.createCustomer(...)`, `api.updateCustomer(...)`, `api.listRoutes()`, `api.listProducts()`

#### `CustomerDetailScreen.jsx` ([CustomerDetailScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/CustomerDetailScreen.jsx))
- **Purpose**: 360-degree view of a single customer profile.
- **Key Features**: Contact details, active subscriptions overview, jar holding count (Filled/Empty), account balance ledger, quick actions (Add Subscription, Record Payment, Edit Profile, View Delivery History).
- **API Calls**: `api.getCustomer(id)`, `api.getCustomerDeliveries(id)`, `api.getDepositLedger(id)`, `api.deleteCustomer(id)`

#### `CustomerDeliveryHistoryScreen.jsx` & `CustomerHistoryScreen.jsx`
- **Purpose**: Comprehensive audit logs of past deliveries, jar transactions, and payment history for specific customers.

---

### 5.5 Order & Delivery Management Screens

#### `PastDeliveriesScreen.jsx` ([PastDeliveriesScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/PastDeliveriesScreen.jsx))
- **Purpose**: Historical delivery log archive. Filterable by date range, route, and fulfillment status with export capability.

---

### 5.6 Route Management Screens

#### `RouteListScreen.jsx` ([RouteListScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/RouteListScreen.jsx))
- **Purpose**: View all configured delivery routes. Displays total assigned customers, assigned delivery staff, and route active status.

#### `AddRouteScreen.jsx` ([AddRouteScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/AddRouteScreen.jsx))
- **Purpose**: Form to create or modify delivery routes (Route name, code, description, starting point, default delivery order).

#### `RouteDetailScreen.jsx` ([RouteDetailScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/RouteDetailScreen.jsx))
- **Purpose**: View route metadata, assigned staff members, and full customer stop sequence. Allows reassigning staff to routes.

#### `RouteBuilderScreen.jsx` ([RouteBuilderScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/RouteBuilderScreen.jsx))
- **Purpose**: Drag-and-drop / sequence ordering interface to re-arrange customer delivery sequence for optimal route driving efficiency.
- **API Call**: `api.updateCustomerSequence(sequences)`

---

### 5.7 Product Catalog & SKU Screens

#### `ProductCatalogScreen.jsx` ([ProductCatalogScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/ProductCatalogScreen.jsx))
- **Purpose**: Display vendor product catalog (20L Jars, 1L Water Bottles, Dispensers, Coolers).

#### `AddProductScreen.jsx` ([AddProductScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/AddProductScreen.jsx))
- **Purpose**: Create or edit products with multi-part form image upload (product photo, title, default price, deposit requirement, empty jar trackable flag).

#### `ProductDetailScreen.jsx` ([ProductDetailScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/ProductDetailScreen.jsx))
- **Purpose**: View SKU pricing details, deposit rules, active customer subscription counts for this product, and deletion/edit actions.

---

### 5.8 Subscription Management Screens

#### `SubscriptionListScreen.jsx` ([SubscriptionListScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/SubscriptionListScreen.jsx))
- **Purpose**: Overview of all active, paused, and cancelled customer subscriptions.

#### `AddSubscriptionScreen.jsx` ([AddSubscriptionScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/AddSubscriptionScreen.jsx))
- **Purpose**: Set up recurring daily/alternate day/custom schedule subscriptions for customers (product selection, quantity, frequency, start date).

#### `SubscriptionDetailScreen.jsx` ([SubscriptionDetailScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/SubscriptionDetailScreen.jsx))
- **Purpose**: Manage individual subscription rules, temporary delivery pauses (vacation holds), and quantity overrides.
- **API Calls**: `api.listPauses(...)`, `api.addPause(...)`, `api.deletePause(...)`, `api.listOverrides(...)`, `api.addOverride(...)`

---

### 5.9 One-Time Order Screens

#### `OneTimeOrderListScreen.jsx` & `AddOneTimeOrderScreen.jsx`
- **Purpose**: Manage ad-hoc, non-recurring water bottle and equipment orders (e.g., party/event bulk orders).

---

### 5.10 Invoicing & Billing Screens

#### `GenerateInvoiceScreen.jsx` ([GenerateInvoiceScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/GenerateInvoiceScreen.jsx))
- **Purpose**: Bulk and single-customer monthly invoice generation wizard. Formats billing cycle ranges, computes uninvoiced delivery totals, applies discounts, and emits invoice generation request.

#### `InvoiceListScreen.jsx` ([InvoiceListScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/InvoiceListScreen.jsx))
- **Purpose**: Tax invoices archive with status badges (PAID, PARTIAL, UNPAID, OVERDUE).

#### `InvoiceDetailScreen.jsx` ([InvoiceDetailScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/InvoiceDetailScreen.jsx))
- **Purpose**: Detailed bill breakdown, itemized delivery list, customer balance impact, and PDF Download trigger via native blob storage.
- **API Call**: `api.downloadInvoicePDF(token, invoiceId, customerName)`

#### `UnbilledDeliveriesScreen.jsx` ([UnbilledDeliveriesScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/UnbilledDeliveriesScreen.jsx))
- **Purpose**: Pre-billing summary highlighting completed deliveries that have not yet been converted into customer tax invoices.

---

### 5.11 Staff & Settings Screens

#### `StaffManagementScreen.jsx` & `AddStaffScreen.jsx`
- **Purpose**: Manage delivery drivers and field staff accounts, assign phone access, and link staff to specific delivery routes.

#### `SettingsScreen.jsx` & `ProfileScreen.jsx`
- **Purpose**: Vendor profile management, business logo update, tax/GST settings, language selection (English/Hindi), and app info.

---

## 6. Reusable Components & Modals

### 1. `CurvedHeader.jsx` ([CurvedHeader.jsx](file:///c:/Camper/Frontend/src/components/CurvedHeader.jsx))
- **Description**: Signature header banner with SVG curved bottom background (`#0B409C` gradient look). Supports left action icon (Drawer toggle / Back button), center title/logo widget, and right action icon/avatar.

### 2. `DeliveryStatusSlider.jsx` ([DeliveryStatusSlider.jsx](file:///c:/Camper/Frontend/src/components/DeliveryStatusSlider.jsx))
- **Description**: Custom interactive status slider for marking delivery state (Delivered, Pending, Missed, Cancelled) with smooth gesture response.

### 3. Modals (`src/components/modals/`)
- **`AddCustomerModal.jsx`**: Light-weight modal overlay for quick customer addition directly from delivery or home screens.
- **`AddProductModal.jsx`**: Quick product entry modal.
- **`AddRouteModal.jsx`**: Quick route setup modal.

---

## 7. API Service Layer (`src/services/api.js`)

All backend interactions pass through `src/services/api.js`. The module defines standard REST wrappers (`getRequest`, `postRequest`, `patchRequest`, `postMultipartRequest`, `patchMultipartRequest`, `deleteRequest`) with automated request logging, token injection, rate limit (`429`) detection, and PDF file filesystem saving via `react-native-blob-util`.

### Summary of Endpoint Modules
| Category | Primary API Methods | Base Endpoint |
|---|---|---|
| **Auth** | `signupRequestOtp`, `signupVerifyOtp`, `completeRegistration`, `loginRequestOtp`, `loginVerifyOtp`, `resendOtp` | `/api/auth/*` |
| **Vendor** | `getVendorProfile`, `updateVendorProfile`, `getCategories` | `/api/vendor/profile`, `/api/public/categories` |
| **Staff** | `listStaff`, `addStaff`, `updateStaff`, `deleteStaff` | `/api/vendor/staff` |
| **Products** | `listProducts`, `getProduct`, `createProduct`, `updateProduct`, `deleteProduct` | `/api/vendor/products` |
| **Routes** | `listRoutes`, `getRoute`, `createRoute`, `updateRoute`, `deleteRoute`, `assignStaff`, `endStaffAssignment` | `/api/vendor/routes` |
| **Customers**| `listCustomers`, `getCustomer`, `createCustomer`, `updateCustomer`, `deleteCustomer`, `updateCustomerSequence`, `getCustomerDeliveries`, `getCustomerJarCollections` | `/api/vendor/customers` |
| **Subscriptions**| `listSubscriptions`, `getSubscription`, `createSubscription`, `updateSubscription`, `deleteSubscription`, `listPauses`, `addPause`, `deletePause`, `listOverrides`, `addOverride`, `deleteOverride` | `/api/vendor/subscriptions` |
| **Deliveries**| `generateDeliveries`, `listDeliveries`, `trackDeliveries`, `updateDeliveryStatus` | `/api/vendor/deliveries` |
| **One-Time Orders**| `listOneTimeOrders`, `createOneTimeOrder`, `updateOneTimeOrderStatus`, `fulfillOneTimeOrder` | `/api/vendor/one-time-orders` |
| **Invoices** | `getUninvoicedPreSummary`, `generateInvoices`, `listInvoices`, `getInvoiceById`, `downloadInvoicePDF` | `/api/vendor/invoices` |
| **Ledger & Deposits**| `recordPayment`, `getAccountStatement`, `collectDeposit`, `settleDepositToBill`, `refundDeposit`, `getDepositLedger` | `/api/vendor/ledgers`, `/api/vendor/deposits` |

---

## 8. Design Tokens & i18n Localization

### Color Tokens (`src/constants/colors.js`)
- `primary`: `#0B409C` (Deep Royal Blue)
- `primaryLight`: `#EBF3FF`
- `secondary`: `#10B981` (Emerald Green)
- `accent`: `#F59E0B` (Amber / Warning)
- `danger`: `#EF4444` (Coral Red)
- `background`: `#F8FAFC` (Light Gray Background)
- `surface`: `#FFFFFF`
- `textPrimary`: `#1E293B`
- `textSecondary`: `#64748B`
- `textPlaceholder`: `#94A3B8`

### Translation Dictionary (`src/i18n/index.js`)
Provides full language toggling for English (`en`) and Hindi (`hi`), covering auth prompts, tab titles, status messages, invoice terms, and navigation labels.

---

## 9. Automated Code-Change Workflow & Maintenance Guidelines

To maintain documentation accuracy as the Camper Frontend repository evolves, **developers and AI assistants MUST strictly adhere to the following workflow when modifying code**:

### Rule 1: New Screen / Page Addition
Whenever a new screen file is added under `src/Screens/`:
1. Register the route in `src/navigation/RootNavigator.jsx` (or `AuthStack.jsx` / `MainDrawer.jsx` / `MainTabs.jsx` as appropriate).
2. Update **Section 2 (Project Structure)** and **Section 5 (Page & Screen Components Analysis)** in this `workflow.md` file.

### Rule 2: API Endpoint Modifications
Whenever a new function or endpoint is modified in `src/services/api.js`:
1. Document the new API method in **Section 7 (API Service Layer)** of this `workflow.md`.
2. Cross-reference which screens consume the new endpoint.

### Rule 3: Component & Modal Updates
Whenever a reusable component or modal is created under `src/components/`:
1. Document the component's purpose and props in **Section 6 (Reusable Components & Modals)**.

### Rule 4: Context / State Changes
Whenever `AuthContext` or `AlertContext` schema or helper functions are updated:
1. Update **Section 4 (Global State & Context Systems)** of this `workflow.md`.

---

## 10. Date & Day-Wise Task Activity Log

This section chronologically tracks every feature implementation, architectural analysis, refactoring, and bug fix performed in this codebase by date and day.

### Thursday, August 13, 2026

- **Comprehensive Frontend Architecture & Analysis**:
  - Conducted an exhaustive deep-dive analysis of all 35+ screen components, navigation stacks (`RootNavigator`, `MainDrawer`, `MainTabs`), state management (`AuthContext`, `AlertContext`), and REST API service endpoints (`api.js`).
  - Created [workflow.md](file:///c:/Camper/Frontend/workflow.md) mapping project file structure, data flows, and component specs.

- **Delivery Status & Skipped Count Calculation Fix**:
  - Identified and fixed delivery stats calculation bug where `pendingDeliveries` was derived using `totalDeliveries - completedDeliveries`, miscounting `skipped` deliveries as `pending`.
  - Updated [HomeScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/HomeScreen.jsx) and [OrdersScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/OrdersScreen.jsx) to perform explicit status filtering for `pending`, `skipped`, and `delivered`.
  - Added `Skipped` status filter option in [OrdersScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/OrdersScreen.jsx).
  - Added Skipped count badge in Linear Progress Card on [OrdersScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/OrdersScreen.jsx).

- **HomeScreen Typography & Status Summary Refinement**:
  - Streamlined `progressInfo` section in [HomeScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/HomeScreen.jsx): removed bulky separate card containers.
  - Added combined summary text (`X Pending • Y Skipped`).
  - Enhanced SVG progress gauge in [HomeScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/HomeScreen.jsx): thickened ring stroke (`strokeWidth = 10`), added dual-color SVG ring arcs (Blue `#0B409C` for completed, Red `#EF4444` for skipped), and integrated a micro solid red pill badge (`1 skipped`) inside the circular gauge.
  - Updated **Daily Delivery Button** on [HomeScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/HomeScreen.jsx) to **View More →** / **और देखें →** with right chevron icon, paired with top section header quick link.
  - Added `viewMore` localization key for English (`View More`) and Hindi (`और देखें`) in [index.js](file:///c:/Camper/Frontend/src/i18n/index.js).

- **Snapklik Tax Invoice Template & Delivery Details Enhancement**:
  - Removed image logos and rendered a clean solid Navy Blue `TAX INVOICE` badge (`#1E3A8A`) on the top-left, paired with business details on the top-right in both React Native card view and PDF HTML generator.
  - Fixed JSX header container structure issues in [InvoiceDetailScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/InvoiceDetailScreen.jsx).
  - Enhanced `BILLED TO:` and `INVOICE DETAILS:` metadata grid: removed phone/address icons (`📞`/`📍`), applied clean, left-aligned key-value columns with consistent starting points for `Invoice #:`, `Date:`, and `Period:`.
  - Expanded delivery items table to display full detailed descriptions (`[NOT DELIVERED (SKIPPED)] Jar 30 rs on 12-08-2026`, `[DELIVERED] 1 unit(s)...`, `[NOT DELIVERED (PENDING)]...`) without any line truncations.
  - Added **Opening Balance / Previous Dues** as the very top row in the itemized table whenever `previousDues > 0` for both React Native preview card and PDF HTML generator.
  - Fully synchronized **Print/PDF HTML generator layout** with the **React Native mobile card preview**, removing vertical cell lines in HTML table and joining Notes & Totals into a single continuous 2-column container with `#cbd5e1` outer border for 100% layout fidelity.
  - Integrated **Download PDF** handler (`handleDownloadPDF`) and updated `handlePrint` to fetch the backend PDF via `api.downloadInvoicePDF` and print the exact downloaded `.pdf` file via `RNPrint.print({ filePath })` with local HTML fallback in [InvoiceDetailScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/InvoiceDetailScreen.jsx).
  - Separated loading state flags (`isSharingPdf`, `isDownloadingPdf`, `isPrintingPdf`) to prevent state cross-triggering between the WhatsApp PDF, Download PDF, and Print Invoice action buttons.
  - Updated `handleWhatsAppShare` and `handleSharePDFWhatsApp` in [InvoiceDetailScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/InvoiceDetailScreen.jsx) to target the customer's mobile phone number directly (`whatsapp://send?phone=91...` & `whatsAppNumber: cleanPhone`), opening their individual chat directly with auto-fallback to contact picker when phone is missing.
  - Fixed `ReferenceError: Property 't' doesn't exist` in [PastDeliveriesScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/PastDeliveriesScreen.jsx) by adding `const { t } = useTranslation();` hook declaration inside `PastDeliveriesScreen`.
  - Enabled delivery status and quantity editing for past dates in [PastDeliveriesScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/PastDeliveriesScreen.jsx) by setting `isViewOnly={String(item.id).startsWith('preview-')}` and enabling route & status filters across all dates.
  - Handled locked order responses in [PastDeliveriesScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/PastDeliveriesScreen.jsx) and [OrdersScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/OrdersScreen.jsx): displays a friendly Info Notice (`This order is locked because an invoice has already been generated for it.`) instead of an error alert.
  - Enabled delivery editing across **all delivery statuses** (`DELIVERED`, `SKIPPED`, `PENDING`) in [PastDeliveriesScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/PastDeliveriesScreen.jsx) and [OrdersScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/OrdersScreen.jsx): added Quick Edit (`Edit2`) button for all statuses and inline status selector pills (`DELIVERED`, `SKIPPED`, `PENDING`) for editing quantities and statuses using the same API.
  - Fixed progress bar percentage calculation and rendering guards in [OrdersScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/OrdersScreen.jsx): ensures percentage computes correctly (`0%` on empty list, accurate `%` on active deliveries) and renders cleanly.
  - Removed percentage text (`%`) from the progress bar header card in [OrdersScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/OrdersScreen.jsx) and [PastDeliveriesScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/PastDeliveriesScreen.jsx).
  - Fixed delivery progress count display in [OrdersScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/OrdersScreen.jsx) and [PastDeliveriesScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/PastDeliveriesScreen.jsx): displays `{completedDeliveries} / {totalDeliveries} Delivered` (e.g. `8 / 10 Delivered`) so skipped orders never cause total count to falsely report `100% / All Completed`.
  - Synchronized circular progress card inner text on [HomeScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/HomeScreen.jsx) to display `{completedDeliveries}/{totalDeliveries}` (e.g. `8/10`), matching Orders and Past Deliveries screens.
  - Added skipped deliveries count and pill indicator (`skippedDeliveries > 0`) to the progress bar card in [PastDeliveriesScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/PastDeliveriesScreen.jsx), making status counts fully synchronized across all screens.
  - Maintained structured Itemized Table with solid Navy Blue headers (`#1E3A8A`), color-coded status badges, and 2-column Summary & Notes block with solid Navy Blue total row displaying total balance due.

- **One-Time Orders Nested Deliveries & Additional Jars Integration**:
  - Integrated updated `GET /api/vendor/one-time-orders` endpoint response containing nested `Deliveries` array (`One-to-Many` relationship) in [OneTimeOrderListScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/OneTimeOrderListScreen.jsx).
  - Added expanded **Delivery Logs** section displaying date-wise delivery logs with color-coded status badges (`DELIVERED`, `SKIPPED`, `PENDING`), full units delivered, and empty units collected.
  - Added dynamic **Additional Jars** calculation (`deliveredUnits - orderedQty`) and displayed green `+ X Additional Jars` badges in card header and delivery logs when delivered units exceed ordered quantity.
  - Added `X Remaining Jars` indicator for pending orders.
  - Updated total order price calculation to reflect `Product Price × Quantity` (`displayUnitPrice * activeQty`).
  - Rendered inline calculation formula in order card footer (`₹Price × Qty = ₹Total`).

- **Invoice PDF & WhatsApp Sharing Enhancements**:
  - Fixed WhatsApp PDF attachment issue by adding explicit MIME type (`type: 'application/pdf'`) and FileProvider URI handling in [InvoiceDetailScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/InvoiceDetailScreen.jsx).
  - Updated `handleSharePDFWhatsApp` to perform file pre-checks (`exists` and `size > 0`) using `ReactNativeBlobUtil.fs`.
  - Added automatic fallback to standard WhatsApp text sharing (`handleWhatsAppShare()`) whenever PDF file download or file check fails, preventing broken states.
  - Switched PDF share flow to launch native Share options chooser (`RNShare.open`) directly, allowing users to select WhatsApp or any preferred app smoothly.

- **Advance Credit & Negative Previous Dues Handling**:
  - Fixed `previousDues` condition from `previousDues > 0` to `previousDues !== 0` in [InvoiceDetailScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/InvoiceDetailScreen.jsx).
  - Negative `previousDues` (e.g. `-11000`) now properly renders as **Advance Credit (-₹11,000.00)** with green credit badge in item table, totals summary box, and exported HTML PDF templates.

- **Line Item Description Cleanup & Status Color Standardisation**:
  - Cleaned up raw bracket tags (`[DELIVERED]`, `[NOT DELIVERED (SKIPPED)]`, `[NOT DELIVERED (PENDING)]`) from line item description strings in [InvoiceDetailScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/InvoiceDetailScreen.jsx).
  - Fixed status detection logic order in `getItemDetails` to prioritize `skipped` and `pending` over `delivered` (preventing `"not delivered"` from falsely matching `"delivered"`).
  - Standardized status color badges across screens:
    - **Delivered**: Green (Text `#15803D` / `#16A34A`, Background `#ECFDF5`).
    - **Skipped**: Red (Text `#B91C1C` / `#EF4444`, Background `#FEF2F2`).
    - **Pending**: Amber (Text `#B45309` / `#F59E0B`, Background `#FFFBEB`).

- **One-Time Orders Delivery Filtering**:
  - Excluded one-time order deliveries from Today's & All Deliveries views in [OrdersScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/OrdersScreen.jsx) and [HomeScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/HomeScreen.jsx) via `rawList.filter(item => !item.oneTimeOrderId && !item.one_time_order_item_id)`.
  - Ensured subscription/recurring deliveries are managed in Today's Deliveries screen, while one-time orders remain managed exclusively in the One-Time Orders screen.

- **LineItem Quantity Parsing & Zero Quantity Fix**:
  - Fixed quantity reporting bug in [InvoiceDetailScreen.jsx](file:///c:/Camper/Frontend/src/Screens/Main/InvoiceDetailScreen.jsx) where lineItems with `undefined` `quantity` and `fullUnitsDelivered` properties defaulted to `1`.
  - Created `getItemQuantity` helper to parse quantity from `description` text strings (e.g. `10 can(s)` $\rightarrow$ `10`, `4 can(s)` $\rightarrow$ `4`).
  - Preserved `0` quantity for skipped or pending zero-unit deliveries (`quantity: 0` / `fullUnitsDelivered: 0`), preventing them from defaulting to `1`.
  - Updated unit rate calculation (`amount / parsedQty`) so quantity, unit price, and line item total calculate and display accurately in both React Native card preview and exported HTML PDFs.

- **Backend PDF Handlebars Template**:
  - Provided a fully formatted Handlebars template to be used by the backend PDF generator.
  - Mirrored the exact styles and layout from `InvoiceDetailScreen.jsx` React Native UI (Navy Blue TAX INVOICE badge, structural spacing, summary boxes).
  - Used Handlebars condition statements (`{{#if}}`, `{{#each}}`) to handle `previousDues`, `advanceCredit`, and `amountPaid` logic dynamically.
  - Used the same status color badges (`#15803d` for delivered, `#b91c1c` for skipped, `#b45309` for pending) for line items.

---
*End of Camper Frontend Workflow Document*
-   * * i 1 8 n   T r a n s l a t i o n   F i x   i n   N a v i g a t i o n   D r a w e r * * : 
     -   R e p l a c e d   h a r d c o d e d   s t r i n g s   f o r   \ U n b i l l e d   D e l i v e r i e s \   a n d   \ C u s t o m e r   S e q u e n c e \   i n   \ C u s t o m D r a w e r C o n t e n t . j s x \   w i t h   t r a n s l a t i o n   k e y s   \ 	 ( ' d e l i v e r i e s . u n b i l l e d D e l i v e r i e s ' ) \   a n d   \ 	 ( ' r o u t e s . c u s t o m e r S e q u e n c e ' ) \ . 
     -   A d d e d   H i n d i   t r a n s l a t i o n   \ ,	?	(	>	  ,	?	2	  	@	  !	?	2	@	5	0	@	\   a n d   E n g l i s h   f a l l b a c k   f o r   \ u n b i l l e d D e l i v e r i e s \   i n   \ s r c / i 1 8 n / i n d e x . j s \ .  
 -   * * D e l i v e r i e s   S c r e e n   i 1 8 n   F i x e s * * : 
     -   I d e n t i f i e d   a n d   r e p l a c e d   h a r d c o d e d   t e x t   s t r i n g s   i n   \ O r d e r s S c r e e n . j s x \   w i t h   \ 	 ( ) \   t r a n s l a t i o n   k e y s . 
     -   A d d e d   n e w   t r a n s l a t i o n   k e y s   \ g e n e r a t e F o r T o d a y \ ,   \  e f r e s h \ ,   \ c o m p l e t e d \ ,   a n d   \  l l \   t o   \ s r c / i 1 8 n / i n d e x . j s \   i n   b o t h   E n g l i s h   a n d   H i n d i . 
     -   B o u n d   t h e   n e w   t r a n s l a t i o n s   t o   t h e   ' R e f r e s h   /   G e n e r a t e '   b u t t o n s   a n d   t h e   ' P e n d i n g / C o m p l e t e d / S k i p p e d / A l l '   s t a t u s   f i l t e r   d r o p d o w n s   i n   t h e   U I ,   e n s u r i n g   c o m p l e t e   H i n d i   l o c a l i z a t i o n .  
 -   * * P a y m e n t s   S c r e e n   i 1 8 n   F i x e s * * : 
     -   R e p l a c e d   h a r d c o d e d   t e x t   i n   \ P a y m e n t s S c r e e n . j s x \   w i t h   t r a n s l a t i o n   k e y s . 
     -   A d d e d   n e w   t r a n s l a t i o n   k e y s   f o r   p a y m e n t   m e t h o d s   ( \ C a s h \ ,   \ U P I \ ,   \ B a n k   T r a n s f e r \ ,   \ C h e q u e \ )   a n d   U I   s t r i n g s   ( \ A m o u n t \ ,   \ P a y m e n t   M o d e \ ,   \ S t a t e m e n t \ ,   \ T o t a l   A m o u n t   D u e \ ,   e t c )   i n   b o t h   E n g l i s h   a n d   H i n d i . 
     -   R e f a c t o r e d   \ P A Y M E N T _ M O D E S \   c o n s t a n t   t o   \ g e t P a y m e n t M o d e s ( t ) \   f u n c t i o n   t o   a l l o w   d y n a m i c   t r a n s l a t i o n   i n s i d e   t h e   R e a c t   N a t i v e   r e n d e r   c y c l e .  
 -   * * C r e a t e   R o u t e   S c r e e n   i 1 8 n   F i x e s * * : 
     -   I m p o r t e d   \ u s e T r a n s l a t i o n \   h o o k   i n   \ A d d R o u t e S c r e e n . j s x \   a n d   r e p l a c e d   h a r d c o d e d   t e x t s   ( C r e a t e   R o u t e ,   E d i t   R o u t e ,   R o u t e   N a m e   * ,   p l a c e h o l d e r s ,   S a v e   C h a n g e s )   w i t h   i 1 8 n   \ 	 ( ) \   t r a n s l a t i o n   k e y s . 
     -   A d d e d   n e w   t r a n s l a t i o n   k e y s   f o r   \ c r e a t e R o u t e \ ,   \ e d i t R o u t e \ ,   \ 
 a m e P l a c e h o l d e r \ ,   a n d   \  r e a C o d e P l a c e h o l d e r \   i n   \ s r c / i 1 8 n / i n d e x . j s \   f o r   f u l l   H i n d i   l a n g u a g e   s u p p o r t .  
 -   * * S u b s c r i p t i o n   L i s t   S c r e e n   i 1 8 n   F i x e s * * : 
     -   R e p l a c e d   h a r d c o d e d   t e x t   i n   \ S u b s c r i p t i o n L i s t S c r e e n . j s x \   w i t h   t r a n s l a t i o n   k e y s . 
     -   A d d e d   n e w   t r a n s l a t i o n   k e y s   f o r   t a b s   ( \ A l l \ ,   \ A c t i v e \ ,   \ P a u s e d \ ,   \ E n d e d \ ) ,   r e c u r r e n c e s   ( \ D a i l y \ ,   \ A l t e r n a t e   D a y s \ ,   \ W e e k l y \ ,   \ M o n t h l y \ ) ,   a n d   U I   s t r i n g s   ( \ Q t y \ ,   s e a r c h   p l a c e h o l d e r )   i n   b o t h   E n g l i s h   a n d   H i n d i . 
     -   F o r m a t t e d   s t a t u s   b a d g e   t e x t s   a n d   r e c u r r e n c e   p a t t e r n s   t o   p u l l   f r o m   t h e   i 1 8 n   \ 	 ( ) \   f u n c t i o n   d y n a m i c a l l y .  
 -   * * O n e   T i m e   O r d e r s   i 1 8 n   F i x e s * * : 
     -   A d d e d   H i n d i   t r a n s l a t i o n   k e y s   f o r   o n e - t i m e   o r d e r   s p e c i f i c   s t r i n g s   s u c h   a s   \ U n k n o w n   C u s t o m e r \ ,   \ P r o d u c t s \ ,   \ A d d i t i o n a l   J a r s \ ,   \ R e m a i n i n g   J a r s \ ,   \ D e l i v e r y   L o g s \ ,   a n d   s e a r c h   p l a c e h o l d e r s   i n   \ s r c / i 1 8 n / i n d e x . j s \ . 
     -   R e p l a c e d   h a r d c o d e d   s t r i n g s   i n   \ O n e T i m e O r d e r L i s t S c r e e n . j s x \   w i t h   \ 	 ( ) \   k e y s   t o   t r a n s l a t e   o r d e r   c a r d s ,   s t a t u s   b a d g e s ,   a n d   e m p t y   l i s t   s t a t e s . 
     -   R e p l a c e d   h a r d c o d e d   t e x t   i n   \ A d d O n e T i m e O r d e r S c r e e n . j s x \   ( e . g .   \  
 C u s t o m e r  
 * \ ,   \ S t a r t  
 D a t e \ ,   \ N o t e s \ ,   \ S e l e c t  
 P r o d u c t \ )   w i t h   i 1 8 n   k e y s   t o   e n s u r e   f u l l   l o c a l i z a t i o n   w h e n   a d d i n g   n e w   o r d e r s .  
 -   * * S e t t i n g s   S c r e e n   i 1 8 n   F i x e s * * : 
     -   A d d e d   H i n d i   t r a n s l a t i o n   k e y s   f o r   \ A p p   S e t t i n g s \ ,   \ Y o u r   P r o f i l e \ ,   \ V e n d o r   A c c o u n t \ ,   a n d   \ N o t   S e t \   i n   \ s r c / i 1 8 n / i n d e x . j s \ . 
     -   R e p l a c e d   h a r d c o d e d   s t r i n g s   i n   \ S e t t i n g s S c r e e n . j s x \   w i t h   \ 	 ( ) \   k e y s   t o   t r a n s l a t e   t h e   p r o f i l e   c a r d ,   S a v e   C h a n g e s   b u t t o n ,   A p p   S e t t i n g s   t i t l e ,   P r i v a c y   P o l i c y ,   a n d   D e l e t e   A c c o u n t   l i n k s .  
 -   * * I n - A p p   U p d a t e s   I n t e g r a t e d * * : 
     -   I n s t a l l e d   \ s p - r e a c t - n a t i v e - i n - a p p - u p d a t e s \   t o   h a n d l e   P l a y   S t o r e   u p d a t e   p r o m p t s   d y n a m i c a l l y . 
     -   A d d e d   a n   \ u s e E f f e c t \   h o o k   i n   \ A p p . j s x \   t h a t   i n s t a n t i a t e s   \ S p I n A p p U p d a t e s \   o n   s t a r t u p . 
     -   C o n f i g u r e d   A n d r o i d   u p d a t e s   t o   u s e   \ I A U U p d a t e K i n d . I M M E D I A T E \ ,   w h i c h   w i l l   t r i g g e r   t h e   f u l l - s c r e e n   P l a y   S t o r e   u p d a t e   b l o c k   i f   a   n e w   v e r s i o n   i s   a v a i l a b l e   o n   t h e   P l a y   S t o r e   t r a c k .  
 