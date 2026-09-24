# Camper Application Workflow & Task Activity Log

## Section 10: Date & Day-Wise Task Activity Log

### Date: 2026-09-22 (Tuesday)
- **Component / File**: `client.js`, `api.js`, `SubscriptionDashboardScreen.jsx`
- **User Request**: Implement Step 4 of the JWT Entitlement Migration — read `newToken` inline from plan upgrade and cancel API responses instead of calling `/api/auth/refresh` separately.
- **Root Cause / Task**: After the backend started embedding fresh JWTs inside plan-change and cancellation responses (`response.data.newToken`), the frontend still called `refreshEntitlements()` (which triggers `/auth/refresh-token`) for upgrades and did nothing for cancellations. This caused an unnecessary extra network round-trip for upgrades and left entitlements stale after cancellations.
- **Changes Made**:
  1. Added `applyNewToken(token)` to `client.js` — stores the token to `AsyncStorage` and fires `onTokenRefreshedCallback` so `AuthContext`/`EntitlementContext` update reactively without any network call.
  2. Exported `applyNewToken` from the `api.js` barrel.
  3. In `SubscriptionDashboardScreen.jsx` — plan upgrade (payment verification success path): checks `currentStatusResponse.newToken` / `paidSubscriptionResponse.newToken`; applies it via `applyNewToken` if present, falls back to `refreshEntitlements()` (network) for old-backend compatibility.
  4. In `SubscriptionDashboardScreen.jsx` — plan cancellation (`performSubscriptionCancellation`): captures the cancel API response, checks for `cancelResponse.newToken` / `cancelResponse.data.newToken`, and applies it silently before calling `fetchData()`. Previously this path did zero entitlement refresh.

### Date: 2026-09-21 (Monday)
- **Component / File**: `billing.js`, `billingTranslations.js`, `src/shared/i18n/index.js`, `InvoiceDetailScreen.jsx`, `InvoiceListScreen.jsx`, `GenerateInvoiceScreen.jsx`, `UnbilledDeliveriesScreen.jsx`, `PaymentsScreen.jsx`, `CustomerListScreen.jsx`, `__tests__/billing.test.js`, `__tests__/apiSurface.test.js`
- **User Request**: Integrate the revised invoice, payment, and account statement API contract end to end, using translated status and statement labels.
- **Root Cause / Task**: Invoice views could present previous dues as a fresh charge, the main generation form treated every API error as a duplicate, the unbilled shortcut allowed future dates, payment feedback omitted allocation details, and statement balance/adjustment direction labels were incomplete.
- **Changes Made**:
  1. Added a shared invoice amount reader that prioritizes `breakdown`, keeps `previousDues` informational, and never adds it to this invoice's total or balance due. Confirmed the mapping against an authenticated invoice response with an advance credit.
  2. Updated invoice detail, list, local print HTML, and text sharing to display the current invoice total separately from previous dues or advance credit. Refetched invoice detail on focus after payment or adjustment and rendered a translated status badge from the status code.
  3. Added local-date validation and picker limits to both invoice generation paths. Preserved actual API error messages and handled successful zero-created/duplicate responses as notices.
  4. Showed the payment API's allocation message, refreshed the account statement after recording, and rendered signed balance states and adjustment direction from the backend's debit/credit fields.
  5. Added billing labels for all eight supported languages, aligned customer list balance states, and added focused amount, date, statement, and locale tests. Updated the API surface test for existing invoice-settings methods.
  6. Restored the previous dues or advance credit row at the top of the invoice item table in both the app and printed invoice. The earlier removal addressed a misleading quantity and unit price that made the account balance look like a new charge; the restored row shows dashes for those columns and keeps invoice totals unchanged. Shortened the informational label to “Info” in all eight languages.
  7. Fixed invoice-to-payment customer selection in `InvoiceDetailScreen.jsx` and `PaymentsScreen.jsx`. The invoice previously passed only a customer ID, so selection depended on an asynchronous customer-list match; navigation now passes the invoice customer details for immediate selection, refreshes the name from the customer list when available, and opens the Record Payment tab with the invoice due prefilled.
  8. Added `__tests__/invoicePaymentSelection.test.js` to verify that the Payments screen displays the invoice customer and prefilled amount even when the customer list has no matching record yet. Rechecked read-only live invoice and statement data, including separate previous dues and advance credit amounts.
  9. Added a shared API debug-log gate in `client.js` and applied it to `invoicesApi.js`, `InvoiceDetailScreen.jsx`, `InvoiceListScreen.jsx`, `GenerateInvoiceScreen.jsx`, `HomeScreen.jsx`, and `SubscriptionDashboardScreen.jsx`. API and related billing/subscription diagnostic logs now run only in development against an HTTP backend; disabled logs skip full response serialization. Request behavior and user-facing errors remain unchanged. The static Play Store review found target SDK 36, but the app still points to a private HTTP API address while Android release builds disable cleartext traffic. No bundle was generated, as requested.

### Date: 2026-08-21 (Friday)
- **Component / File**: `LoginScreen.jsx`
- **User Request**: Use `login.png` from assets as the background of the login screen and embed the form on it to match the provided premium reference image.
- **Root Cause / Task**: The authentication screen required a UI/UX modernization to look more premium and match the new design system utilizing full-screen visual assets and floating cards.
- **Changes Made**:
  1. Replaced the generic `SafeAreaView` layout in `LoginScreen.jsx`, `RegisterScreen.jsx`, and `OtpVerificationScreen.jsx` with a full-screen `ImageBackground` utilizing `login.png` (`resizeMode: stretch`).
  2. Refactored the authentication forms into a "bottom sheet" style layout that fills the entire bottom width and curves beautifully only at the top (`borderTopLeftRadius` and `borderTopRightRadius: 32`).
  3. Increased the overall height and sizing of the form (padding, `height: 60` for inputs/buttons) so it naturally takes up more vertical space and breathes better on the screen.
  4. Ensured the white background of the forms extends fully to the bottom edge of the screen by removing `SafeAreaView` bottom edge constraints and injecting dynamic internal `useSafeAreaInsets()` bottom padding.
  5. Moved the "Don't have an account / Already have account" links directly inside the white form containers.
  6. Redesigned the phone number inputs and OTP input grids to use premium borders, larger text, and deep brand blue active states (`#0A429B`).
  7. Restyled the submit buttons to a deep brand blue (`#0A429B`), `height: 60`, and added the `ArrowRight` icon from `lucide-react-native` to match the design reference exactly.
  8. **Bug Fix**: Fixed a keyboard overlapping issue in all three auth screens where the forms would hide behind the Android keyboard by converting the empty `spacer` to use `flex: 1`.
  9. **Dynamic Layout**: Implemented dynamic top `SafeAreaView` background and `StatusBar` text color logic using the `NavigationContainer` ref in `App.jsx`. Auth screens now receive a seamlessly matched `#95CFFE` top bar (extracted pixel-perfectly from the `login.png` image) with dark text, while all main inner app screens retain the default primary `#0B409C` background with light text automatically!
  10. **UI Update**: Substantially upgraded the `CurvedHeader.jsx` component. Extracted the exact hex color from the top pixel of the image (`#063A8F`) and set it as the default `startColor`. To perfectly eliminate any render/color-profile seams between the top notch and the image, `App.jsx` was modified to disable the `SafeAreaView` top padding on main screens. Instead, `CurvedHeader.jsx` now calculates its own `insets.top`, allowing the raw image itself to bleed completely underneath the status bar to the absolute top of the phone, ensuring a 100% flawless exact match. Implemented a dynamic routing check (`useRoute()`) to render `header_bg1.png` only on the Home screen, and default to `header_bg4.png` for all other inner dashboard screens while keeping the stretched formatting exactly the same!
  11. **UI Update / Splash Screen Overhaul**: Completely redesigned `SplashScreen.jsx`. Removed the SVG liquid fill logo and implemented a sleek, modern typographic animation. The main brand text "CAMPER" is dynamically split, and each individual letter staggers into view one-by-one (fading and sliding up). Once the brand name is completely written, the solid white subtitle pill ("DAILY WATER SUPPLY") seamlessly slides up from below to complete the cinematic intro before fading out to reveal the Login screen.
  12. **Bug Fix**: Built-in safeguards (`{ finished }` checking and decoupled dependencies) ensure the new splash screen scene cannot be prematurely interrupted by background network calls loading in `AuthContext`.
  13. **UI Update**: Restructured the "Daily Delivery Progress" card on `HomeScreen.jsx` to perfectly match the provided high-fidelity design screenshot. Moved the Rickshaw image out of the background watermark and placed it inline on the far right. Formatted the "X Pending • Y Skipped" text seamlessly with orange and red styling. Restored the "Stay on track..." motivational subtext. Placed the "X skipped" badge as a red pill directly overlapping the bottom of the SVG progress circle. Converted the entire card into a `TouchableOpacity` so users can tap it to instantly navigate directly to the Deliveries screen.
  14. **UI Update**: Redesigned the 2x2 Stats Grid on the `HomeScreen.jsx`. Simplified the cards to a highly compact "layman based" layout by removing the verbose subtext. To elevate the visual appeal, injected large decorative circular watermarks (at 8% opacity matching the card's theme color) anchoring the bottom-right corner, and nested the navigation chevron arrow seamlessly over the watermark. Furthermore, completely removed the redundant "Next Delivery" card that was placed between the Stats Grid and Quick Actions to declutter the user interface.
  15. **UI Update**: Overhauled the Deliveries Screen (`OrdersScreen.jsx`) to match the new clean UI mockup. Implemented exclusive accordion logic (only one delivery card can be expanded at a time). Cleaned up the collapsed card header to hide jar counts while keeping the quick checkmark and edit buttons. Added a dynamic 3-line layout to display Customer Name, Product, and Address compactly in the collapsed view. Scaled down the numbering index circle to free up extra space. Injected a static blue left border on each card to match the visual design guidelines. Updated the expanded grid to feature blue `Package` and `Droplet` icons for the Jars and Delivered quantities respectively, perfectly matching the design. Scaled down the top Delivery Progress (Stats Box) significantly to reduce vertical footprint.
  15. **UI Update**: Overhauled the Quick Actions grid on the `HomeScreen.jsx`. Converted the static multi-row layout into a sleek, natively scrollable horizontal slider (`ScrollView`). To make the horizontal swiping intuitive, engineered a custom animated scrollbar below the slider featuring a blue thumb track dynamically tied to the `Animated.event` scroll position.
  16. **UI Update**: Redesigned the "Today's Deliveries" list. Broke the list out of the single monolithic white box and converted every row into its own independent, free-floating card with a subtle shadow and rounded corners. Expanded the rows to a 3-line format including Name, Jars + Route, and an address pinned with a map icon. Scaled up the user avatar circle with a very light background. Injected a dynamic, vibrant left border (`borderLeftWidth: 3`) onto every individual row that maps flawlessly to the delivery status (Yellow = Pending, Red = Skipped, Green = Delivered). Kept the "View More" button securely below the list.
  17. **Global Font Update**: Fetched and integrated the new Google Font **`Rubik`** globally across the entire React Native codebase. Initially bumped all font weights up globally, but after review, dialed the typography weights back down on the Home Screen (reverting `Rubik-Bold` to `Rubik-Medium` and `Rubik-SemiBold` to `Rubik-Regular`) to fix a bulky appearance and create a cleaner, lighter aesthetic.
  18. **UI Update**: Polished the "Record Payment" tab on the Payments Screen (`PaymentsScreen.jsx`). Added intuitive `lucide-react-native` icons (Smartphone, Banknote, Landmark, FileText) to the payment method chips (UPI, Cash, Bank, Cheque). Optimized the chip dimensions, text size, and flex layouts to ensure all four payment methods fit perfectly on a single horizontal row without wrapping, and stacked the "Bank Transfer" text. Also upgraded the Customer Selector input field by embedding a solid blue filled User icon inside a clean, light blue circular background for a more premium avatar look.
  19. **UI Update**: Updated the Home Screen global header (`MainTabs.jsx`). Inverted the colors of the Hamburger Menu icon, Droplet logo, "Camper" text, and avatar ring from pure white (`#FFF`) to the premium dark blue (`#0B409C`). This ensures the foreground elements remain crisp, highly visible, and perfectly contrasted against the new bright water background graphic.
  20. **UI Consistency Update**: Scanned the entire application and uniformly updated the header titles and navigation icons (like the back buttons and hamburger menus) inside the `CurvedHeader` on all 26 screens. Shifted them from a dull dark gray (`#0F172A`) to the premium primary blue (`#0B409C`) to ensure total brand consistency with the Home Screen.
  21. **UI Consistency Update**: Swapped the solid dark blue background of the Custom Drawer side-menu banner out for an `ImageBackground` rendering `header_bg9.png`. Inverted the user's business name, owner name, and role text inside the drawer banner to dark blue/slate shades so they sit beautifully against the new light water texture, keeping it completely visually unified with the CurvedHeaders.
  22. **Header Title Consistency Fix**: Found that 16+ screens were passing custom `<Text>` components into the `CurvedHeader`'s `title` prop, which was overriding the default styling and causing inconsistent positioning (centered instead of left-aligned) and inconsistent font sizes. Wrote a script to strip out all the `<Text>` wrappers globally so they now pass raw strings/translation expressions. This completely forces all headers to use the default `CurvedHeader` string renderer, which perfectly guarantees: left alignment next to the icon, `fontSize: 22`, exactly 1 line limit with ellipsis wrapping, and brand blue coloring across the entire app.
  23. **UI Update**: Redesigned the Statement List UI on the `PaymentsScreen.jsx`. Upgraded each statement item from a flat, plain box to a premium card with soft drop shadows, a color-coded left border (Blue for invoices/charges, Green for payments), and embedded context-aware icons (a blue `FileText` invoice icon for charges and a green `Banknote` icon for payments received).
  24. **Navigation Update**: Added the `InvoiceList` screen to the Custom Drawer navigation menu so users can easily access their Invoices directly from the sidebar.
  25. **UI Update**: Redesigned the Customer List cards (`CustomerListScreen.jsx`). Migrated from the old split-divider layout to a modern unified row design matching the new mockup. Replaced generic avatars with premium soft-blue circular icons, added a secondary info row showing a "Droplet" icon for the Jar Plan, and added right-aligned dynamic status badges (Green 'Paid', Red 'Due') alongside a dedicated soft-blue quick-call button.
  26. **Functionality & Layout Polish**: Enabled the quick-call phone buttons on the Customer List screen by linking them natively to the device's dialer (`Linking.openURL`). Enhanced the Customer List cards with a subtle SVG background pattern (soft gray circles) for a highly premium, textured aesthetic. Optimized horizontal space by removing bulky status text pills, reducing the avatar icon size slightly, and slightly scaling down tertiary text so that long customer names can display fully without truncation. The Active/Paused status is now communicated cleanly and solely via a vibrant Green/Red status dot anchored directly to the user avatar.
  27. **Aesthetics Upgrade**: Wrapped the internal Customer List cards in an ultra-premium `LinearGradient` from pure white to a pale ice-blue (`#F8FAFC`). Additionally, added a bold, data-focused dynamic left border to every card (Blue for active customers, Red for paused customers) that matches the style established in the Payments screen statement list.
  28. **UI Consistency Update**: Redesigned the `AddCustomerScreen.jsx` to enforce layout consistency. Stripped out the rudimentary manual header and replaced it with the global `CurvedHeader` component. Explicitly configured the new header's height and padding parameters to perfectly align with the exact dimensions used on the `CustomerListScreen`, eliminating any vertical layout jumps between screens.
  29. **Form Polish**: Upgraded all text input fields on the `AddCustomerScreen` to look exceptionally modern. The inputs now feature a crisp pure white background, larger padding, elevated drop shadows, and refined semi-bold labels. Completely removed redundant helper text (like "Enter details to create a new customer") to streamline the UI. Adjusted the input text color to a premium, highly legible dark slate (`#1E293B`) using the modern `Rubik-Medium` font weight.
  30. **Emotional & Premium Redesign (`CustomerDetailScreen.jsx`)**: Completely overhauled the Profile Hero section on the Customer Detail screen. Transformed it from a generic stacked layout into a stunning horizontal card mimicking the new mockup: it now features a large, deeply-colored avatar container with a native status dot on its rim, accompanied by beautifully stacked, soft-tinted status and plan pills (like the light-blue Droplet plan badge and light-green Active badge). Upgraded all underlying details cards with thicker padding, rounded borders (`borderRadius: 20`), pure white backgrounds, and a delicate drop shadow to create a warm, tactile, and highly professional aesthetic.
  31. **UI Polish**: Fixed an issue where the top-right header action buttons (Edit/Delete) were blending into the CurvedHeader's new light background graphic. They now use solid, contrasting colors (Deep Blue for edit, Red for delete) with soft, tinted background boxes. Additionally, synchronized the sizes of the floating action buttons (`fabPrimary` and `fabSecondary`) at the bottom of the screen so they are identical, perfectly round `60x60` action circles with matching icon sizes.
  32. **Emotional & Premium Redesign (`SubscriptionDetailScreen.jsx`)**: Brought the Subscription Detail screen's UI in line with the new Customer Detail layout. The Profile Hero section is now a highly premium horizontal card with a deeply-colored avatar container, native status dot on the rim, and elegantly styled status pills next to the bold product name. Upgraded the underlying details cards (Subscription Details, Exceptions Log) with pure white backgrounds, softer, rounded borders (`borderRadius: 20`), and delicate drop shadows. Fixed the CurvedHeader Edit/Delete action buttons to have identical high-contrast styling as the Customer Detail screen.
  33. **Functional Logic (`SubscriptionDetailScreen.jsx`)**: Updated the "Pause" action pill button at the bottom of the screen to dynamically disable itself (becoming semi-transparent and unclickable) if the subscription is already inactive or paused.
  34. **UI Polish (`SubscriptionDetailScreen.jsx`)**: Replaced the uniform blue detail row icons with a vibrant, distinct multi-color palette (Indigo for User, Green for Phone, Amber for Quantity, Rose for Frequency). Each icon is now housed in its own correspondingly tinted soft background box, significantly improving visual scanning and adding a lively, modern aesthetic. Additionally, fixed a layout bug where the "Last Modified" metadata section at the bottom was being obscured by the floating action buttons; increased the `ScrollView`'s bottom padding to ensure all content is fully accessible.
  35. **UI Polish (`CustomerDetailScreen.jsx`)**: Applied the same vibrant multi-color icon system to the Customer Details layout. Phone (Green), Address (Indigo), Assigned Route (Amber), Opening Balance (Rose), and Customer Since (Cyan) now each feature custom-colored icons inside delicately tinted background squares. This dramatically elevates the visual hierarchy and emotional feel of the data.
  36. **UI Polish (`AddCustomerScreen.jsx`)**: Upgraded all text input fields across the "Add Customer" form (including the Security Deposit and Subscription sub-sections) to use the new multi-colored icon aesthetic. The plain placeholder icons have been replaced with vibrant, colored icons encapsulated in perfectly rounded, soft-tinted background boxes (e.g., Indigo for Name, Green for Phone, Rose for Balances, Purple for Products, Cyan for Quantities, Sky Blue for Dates). This makes the data entry experience incredibly premium and visually consistent with the rest of the app.
  37. **UI Polish (`AddCustomerScreen.jsx`)**: Fixed a vertical alignment bug in the multiline "Address" text area where the text/placeholder was not properly centered relative to the new boxed icon. Replaced hardcoded heights with a flexible layout (`minHeight`) and precise top-padding to ensure pixel-perfect text alignment on both iOS and Android.
  38. **Emotional & Premium Redesign (`RouteListScreen.jsx`)**: Redesigned the "All Routes" list cards to match the stunning aesthetic of the Customer List. The empty, flat white cards have been replaced with a deep, filled aesthetic featuring a soft `LinearGradient` overlay, vibrant Amber thematic elements (thick left border and matching icon box), and large, overlapping decorative SVG circles (`react-native-svg`) in the background. Following up, the cards were made smaller and more compact (reduced padding to `12`, margin to `12`, icon sizes to `38`), and the SVG was upgraded to include abstract "route nodes" (small interconnected circles) to strongly reflect the theme of the page!
  39. **UI Polish (`RouteDetailScreen.jsx`)**: Overhauled the Route Details screen to match the premium, professional, and connecting aesthetic of the other detail screens. Initially explored a Home Screen "Stat Card" design, but finalized on a stunning **Premium Gradient Card** (`LinearGradient` from deep amber to orange) featuring sleek frosted-glass icon boxes, high-contrast white text, and a massive, slightly tilted translucent `MapPin` icon in the background to serve as a gorgeous watermark. Also transformed the Staff Assignment lists by enclosing the `User` and `History` icons in vibrant tinted boxes (Indigo and Slate respectively) and upgrading the staff cards with soft drop shadows and refined borders.
  40. **Bug Fix & Polish (`RouteDetailScreen.jsx`)**: Fixed an issue where the Edit and Delete header buttons were practically invisible against the new curved header. Updated the buttons to strictly mirror the exact styles (`gap: 12`, slightly darker background tints like `#E0E7FF`, and deeply saturated icon colors) used on the `CustomerDetailScreen` for absolute visual consistency across the app.
  41. **Universal UI Consistency**: Ran a codebase-wide standardization to strictly replace all instances of the thin `<ChevronLeft>` back button with the bolder, premium `<ArrowLeft size={24} color="#0B409C" />` to ensure 100% consistency across all 20+ screens in the app.
  42. **Bug Fix (Universal Imports & Syntax Error)**: Fixed a crash caused by missing `ArrowLeft` imports after the codebase-wide back button standardization. Successfully injected the missing import statements across all affected screens using an automated script, and subsequently fixed a minor syntax error (`Unexpected token ,`) that had been introduced into 7 files during the import injection.
  43. **UI Polish (`AddRouteScreen.jsx`)**: Upgraded the "Add/Edit Route" form fields to use the premium "multi-colored icon box" design (matching `AddCustomerScreen`). Replaced the plain input icons with perfectly rounded, colored background boxes (Indigo for Route Name, Amber for Area Code) to make the data entry experience significantly more professional and attractive.
  44. **UI Polish (`UnbilledDeliveriesScreen.jsx`)**: Overhauled the "Pending to be Invoiced" screen cards for a highly professional and attractive look. The flat cards now feature a beautiful, clearly visible Sky-Blue `LinearGradient` (`#FFFFFF` to `#F0F9FF`). Added extensive iconography (`User`, `Phone`, `IndianRupee`, `Package`, `Calendar`) across the card. Fixed a date overflow bug by stacking the Deliveries count and Date range into vertical rows with their own soft-tinted icon boxes, rather than squishing them side-by-side. 
  45. **Global Encoding Fix**: Executed a codebase-wide automated script to find and instantly fix all corrupted text characters (e.g. `â‚¹` which was supposed to be the Rupee symbol, and `Ã—` which was supposed to be a multiplication sign). These arose from encoding issues and have all been universally sanitized and safely replaced with their exact native unicode characters (`₹`, `×`). 
  46. **UI Polish (`InvoiceListScreen.jsx`)**: Completely overhauled the Invoice List cards to feature **Dynamic Status Gradients**. Paid invoices now use a subtle Green gradient, Pending invoices use an Amber gradient, Partially Paid use Blue, and Defaults use Slate. The entire card responds to the invoice state! Furthermore, the flat pricing strings were upgraded to use the actual `IndianRupee` Lucide Icon natively beside the amounts, ensuring a flawless and highly premium typography layout.
  47. **UI Polish (`RouteBuilderScreen.jsx`)**: Dramatically improved the Customer Sequencing UI. Unselected customers now feature a clean, dashed "Add" circle, while Selected customers visually transform into a premium Blue `LinearGradient` card with glowing text and active iconography matching the primary brand color. Added a dedicated avatar icon box for each customer, and completely redesigned the Sequence Number Input into a sleek, pill-shaped control with soft shadows, replacing the legacy underlined text input.
  48. **UI Polish (`SubscriptionListScreen.jsx`)**: Completely overhauled the Subscription List cards to feature **Dynamic Status Gradients** matching the Invoice design language. Active subscriptions now use a subtle Green gradient, Paused subscriptions use an Amber gradient, and Ended subscriptions use Slate. The entire card responds to the subscription state! Additionally, fixed a corrupted bullet character (`â€¢` -> `•`) in the quantity summary line caused by encoding issues.
  49. **Bug Fix (`SubscriptionDetailScreen.jsx`)**: Fixed encoding issues causing corrupted characters (`â€”`) to display when a customer was missing their name, phone, or date. Updated these fallbacks to display a clean `N/A` instead.
  50. **UI Polish (`AddSubscriptionScreen.jsx`)**: Removed the subtitle text to keep the form clean and directly to the point. Completely upgraded the form inputs to use the premium multicolored icon box design (e.g. Indigo for Customer, Amber for Product, Red for Frequency) matching the `AddCustomerScreen` and `AddRouteScreen` aesthetic for absolute consistency.
  51. **UI Polish (`OneTimeOrderListScreen.jsx`)**: Added a thick left border (`borderLeftWidth: 4`) to all One Time Order cards using the exact Blue (`#3B82F6`) color to perfectly match the cards on the main Deliveries (Orders) Screen. Also fixed a corrupted arrow character (`â†’` -> `→`) in the date range display.
  52. **UI Polish (`AddOneTimeOrderScreen.jsx`)**: Upgraded the new order form to use the premium multicolored icon box design (Indigo for Customer, Green/Primary for Date) to perfectly match the `AddSubscriptionScreen` aesthetic.
  53. **UI Polish (`ProductCatalogScreen.jsx`)**: Completely overhauled the Product Catalog cards to match the beautiful `CustomerListScreen` aesthetic! The cards now feature a clean white background with soft shadows, dynamic thick left borders (Green for Active, Red for Inactive), the decorative SVG background circles, and the floating premium icon box.
  54. **UI Polish (`AddProductScreen.jsx`)**: Upgraded the add product form to use the premium multicolored icon boxes (Indigo for Package Name, Red for Prices and Deposits) to maintain absolute consistency across all data entry forms in the app.
  55. Kept all existing `i18n` translations, dynamic routing, and API request logic completely untouched.

### Date: 2026-08-20 (Thursday)
- **Component / File**: `ReportsScreen.jsx`, `FinancialReport.jsx`, `OutstandingReport.jsx`, `OperationsReport.jsx`, `InventoryReport.jsx`, `api.js`, `RootNavigator.jsx`, `CustomDrawerContent.jsx`
- **User Request**: Implement the Vendor Reporting Dashboard as per the frontend report guide. Must look professional.
- **Root Cause / Task**: The vendor needed a unified analytics hub for Financials, Debts, Operations, and Inventory with global filters and professional visualizations.
- **Changes Made**:
  1. Updated `api.js` to include 4 new reporting endpoints (`getFinancialReports`, `getOutstandingReports`, `getOperationsReports`, `getInventoryReports`).
  2. Created a central `ReportsScreen` hub with a global filter bar and horizontal scrollable tabs.
  3. Built `FinancialReport` using `react-native-gifted-charts` for a beautiful Donut Pie Chart and Collection Efficiency progress bar.
  4. Built `OutstandingReport` to track pending receivable debt with visual badges.
  5. Built `OperationsReport` with a half-circle Success Rate Gauge chart and leaderboards for routes and staff.
  6. Built `InventoryReport` to track outstanding jars and net jar flows with high-risk alerts.
  7. Added the Reports hub to `RootNavigator.jsx` and added an owner-only navigation link in the Side Drawer.

### Date: 2026-08-18 (Tuesday)
- **Component / File**: `SplashScreen.jsx`, `RootNavigator.jsx`
- **User Request**: Implement a premium, dynamic animated splash screen for the Camper application.
- **Root Cause / Task**: The app required a professional entry experience on launch before showing the main navigation stack. Several iterations were tested (Hotstar-style, Minimalist, Cinematic Zoom, Liquid Fill) to find the best fit for the brand.
- **Changes Made**:
  1. Built a high-quality "Liquid Fill" SVG clip-path animation for the CAMPER logo.
  2. The splash screen uses the app's primary brand blue (`#2553A8`) with a pure white (`#FFFFFF`) liquid fill effect.
  3. Included a subtitle "DAILY WATER SUPPLY" in a sleek semi-transparent pill badge.
  4. Resolved multiple React Native rendering and Native Driver animation issues to guarantee 100% stable center layout positioning across all devices.
  5. Integrated `SplashScreen.jsx` into `RootNavigator.jsx` with a smooth fade-out transition.

- **Component / File**: `RootNavigator.jsx`
- **User Request**: Fix Metro Bundler import error for `native-stack`.
- **Root Cause / Task**: Typo in the `createNativeStackNavigator` import package name.
- **Changes Made**:
  1. Corrected the package import path for `@react-navigation/native-stack` in `RootNavigator.jsx`.

### Date: 2026-08-19 (Wednesday)
- **Component / File**: pi.js, AuthContext.js, CustomDrawerContent.jsx, HomeScreen.jsx, OrdersScreen.jsx, AddSubscriptionScreen.jsx, AddOneTimeOrderScreen.jsx, PastDeliveriesScreen.jsx, CustomerDetailScreen.jsx, SubscriptionDetailScreen.jsx, RouteDetailScreen.jsx, InvoiceDetailScreen.jsx
- **User Request**: Implement Staff APIs and RBAC (Role-Based Access Control) restrictions.
- **Root Cause / Task**: Provide restricted access for staff accounts. Staff should only perform assigned duties and shouldn't modify historical records, past dates, or owner-level settings.
- **Changes Made**:
  1. Updated pi.js to implement dynamic API prefixes and catch 403 Forbidden responses to standardize error handling.
  2. Updated AuthContext.js to initialize and set user roles.
  3. Filtered Owner-only routes in CustomDrawerContent.jsx.
  4. Disabled dashboard stats for staff in HomeScreen.jsx.
  5. Restricted past deliveries and delivery modifications for staff in OrdersScreen.jsx and PastDeliveriesScreen.jsx.
  6. Prevented staff from selecting past dates in AddSubscriptionScreen.jsx and AddOneTimeOrderScreen.jsx.
  7. Displayed updatedBy metadata with a User icon across detail screens (CustomerDetailScreen, SubscriptionDetailScreen, RouteDetailScreen, InvoiceDetailScreen).

- **Component / File**: AddCustomerScreen.jsx, AddOneTimeOrderScreen.jsx, AddSubscriptionScreen.jsx
- **User Request**: Restrict Staff from adding products and fix UI quirks regarding phone numbers and opening balances.
- **Root Cause / Task**: Ensure strict adherence to staff RBAC rules in frontend forms.
- **Changes Made**:
  1. Made phone number editable for staff during customer edits.
  2. Prevented opening balance from being modified by omitting it from payload during edits.
  3. Fixed warning message location and implemented openingBalanceCantChange key in i18n.
  4. Hid + Add New Product shortcut buttons from all Staff forms.

- **Component / File**: CustomerDetailScreen.jsx, RouteDetailScreen.jsx, SubscriptionDetailScreen.jsx, OneTimeOrderListScreen.jsx
- **User Request**: Disable all primary edit and delete actions on detail screens for Staff.
- **Root Cause / Task**: Owner controls required. Staff should not modify or delete core entities (Customers, Routes, Subscriptions, One-Time Orders).
- **Changes Made**:
  1. Hid header Edit and Trash2 buttons on CustomerDetailScreen if user is staff.
  2. Hid header Edit and Trash2 buttons on RouteDetailScreen if user is staff.
  3. Hid header Edit and Trash2 buttons on SubscriptionDetailScreen if user is staff.
  4. Removed cancel (Trash2) capability from OneTimeOrderListScreen items if user is staff.

- **Component / File**: ProductCatalogScreen.jsx
- **User Request**: Staff cannot add product fix (floating action button was still visible).
- **Root Cause / Task**: Missed the floating action button and empty-state action button on the main Product Catalog screen.
- **Changes Made**:
  1. Hid the Floating Action Button (FAB) for adding new products if user is staff.
  2. Hid the inline empty-state + Add New button if user is staff.

- **Component / File**: ProductDetailScreen.jsx
- **User Request**: product can edit in staff side
- **Root Cause / Task**: Missed removing Edit and Delete buttons on the ProductDetailScreen.
- **Changes Made**:
  1. Hid the header Edit and Trash2 buttons if the user is staff.

- **Component / File**: RouteListScreen.jsx, AddRouteScreen.jsx, OrdersScreen.jsx, InvoiceListScreen.jsx, UnbilledDeliveriesScreen.jsx, PaymentsScreen.jsx, InvoiceDetailScreen.jsx, SubscriptionDetailScreen.jsx
- **User Request**: lock down staff capabilities and redesign route screens
- **Root Cause / Task**: Enforce the staff APIs guide (hide bulk invoice/delivery gen, hide payment functionality, stop backdating, hide override/pause deletes) and redesign the Routes UI.
- **Changes Made**:
  1. Redesigned Route List cards and Add Route inputs to look modern with shadows and rounded corners (kept CurvedHeader).
  2. Hid all Generate Invoices and Generate Deliveries buttons if the user is staff.
  3. Locked PaymentsScreen to the statement tab only and hid Record Payment on invoice details for staff.
  4. Added minimumDate on the DatePickers and hid the Trash2 icon for pauses/overrides in SubscriptionDetailScreen if the user is staff.

- **Component / File**: RouteListScreen.jsx
- **User Request**: fix counting and all based on route API data
- **Root Cause / Task**: The API returns StaffRoutes instead of Customers, so customerCount was always 0.
- **Changes Made**:
  1. Updated the route card to count StaffRoutes?.length instead of Customers?.length.
  2. Changed the badge text from Customer(s) to Staff Member(s).

- **Component / File**: RouteDetailScreen.jsx
- **User Request**: fix API error for staff fetching staff lists
- **Root Cause / Task**: etchAllStaff was blindly fetching on screen focus. The staff API endpoint /api/staff/staff doesn't exist or isn't accessible to staff.
- **Changes Made**:
  1. Skipped calling etchAllStaff if user?.role === 'staff'.

- **Component / File**: RouteDetailScreen.jsx
- **User Request**: remove assign staff button for staff
- **Root Cause / Task**: The Assign Staff button was still visible for staff.
- **Changes Made**:
  1. Hid the Assign Staff button if user?.role === 'staff'.

- **Component / File**: RouteDetailScreen.jsx
- **User Request**: remove staff functionality from staff side route detail
- **Root Cause / Task**: The Active Staff Assignments and Assignment History lists were still visible to staff, and they contained action buttons to end assignments.
- **Changes Made**:
  1. Completely hid the Currently Active Staff and Assignment History sections if user?.role === 'staff'.

- **Component / File**: HomeScreen.jsx
- **User Request**: add language change option directly in staff side home dashboard
- **Root Cause / Task**: Staff members needed a quick way to toggle language on the dashboard.
- **Changes Made**:
  1. Added a language toggle button (English/हिंदी) to the Overview section header on HomeScreen.
  2. The button only renders for staff users (user?.role === 'staff').
  3. Linked it to i18n.changeLanguage and AsyncStorage.

- **Component / File**: HomeScreen.jsx
- **User Request**: show beautiful modal if staff has no assigned routes in english/hindi
- **Root Cause / Task**: Staff members who weren't assigned routes were just seeing empty dashboards without clear feedback.
- **Changes Made**:
  1. Updated HomeScreen to fetch the staff profile on mount and check the ssignedRoutes array.
  2. If the array is empty, it pops up a clean, styled Modal using a red MapPin icon, title, and a descriptive message.
  3. Added bilingual support (English/Hindi) based on i18n.language to tell them to contact their owner/admin.

- **Component / File**: `SplashScreen.jsx`
- **User Request**: fix splash screen floating text filling animation
- **Root Cause / Task**: In `react-native-svg`, animating SVG attributes like `y` using `Animated.createAnimatedComponent` can fail natively without proper bindings.
- **Changes Made**:
  1. Replaced `AnimatedRect` with `AnimatedG`.
  2. Wrapped the `<Rect>` in the `<AnimatedG>` and applied a `translateY` transform instead, which is perfectly supported by the React Native animated engine natively.

- **Component / File**: `RouteBuilderScreen.jsx`
- **User Request**: provide edit sequence button with drag and go functionality where dropping recalculates the +1 sequence automatically, along with a search bar.
- **Root Cause / Task**: The customer sequence was managed by simple tapping, which was tedious. Needed a true drag-and-drop builder.
- **Changes Made**:
  1. Installed `react-native-draggable-flatlist` (with legacy-peer-deps).
  2. Refactored `RouteBuilderScreen` to have `isEditing` state.
  3. In View Mode: Added a Search input bar and regular FlatList.
  4. In Edit Mode: Added `DraggableFlatList` with `GripVertical` drag handles. Dropping an item instantly updates the sequence array.
  5. Pressing Save sends the newly ordered array to the backend, which already derives sequence via `index + 1`, automatically shifting all sequences perfectly!

- **Component / File**: `OrdersScreen.jsx`
- **User Request**: Keep the Generate Delivery / Refresh button on the staff side so they can manually generate deliveries.
- **Root Cause / Task**: The button was previously hidden from the 'staff' role as part of the RBAC restrictions.
- **Changes Made**: Removed the `user?.role !== 'staff'` condition wrapping the Generate/Refresh button on the OrdersScreen.
- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: ProductDetailScreen.jsx
- **User Request**: check detail model of the customer and as per that remodify for the product detail also also make edit delete visible as done for other in header
- **Root Cause / Task**: The Product Detail Screen had an outdated layout and missing edit/delete buttons in the header compared to Customer Detail Screen.
- **Changes Made**:
  1. Updated CurvedHeader to 120 height with proper padding and background colors for Edit/Delete buttons.
  2. Replaced the Product Profile Hero with the ProfileHeroCard layout, moving the icon/image inside a shadow-bordered card.
  3. Synced button and card styling with CustomerDetailScreen design system.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: StaffManagementScreen.jsx
- **User Request**: modify the staff management make some gradient or like that but i want that not very drak gradient keep minimal that connectes with staff
- **Root Cause / Task**: Implement a clean, minimal gradient aesthetic for the staff cards to look premium and denote  staff (professional blue).
- **Changes Made**:
  1. Replaced the generic flat avatar with a crisp blue-to-indigo LinearGradient for active staff.
  2. Wrapped the entire Staff Card in a very subtle white-to-slate LinearGradient background.
  3. Made the card footer transparent so the gradient flows beautifully underneath the action buttons.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: AddStaffScreen.jsx
- **User Request**: modify edit staff details and add new staff multi icons like that
- **Root Cause / Task**: The Add/Edit Staff Screen needed the same premium multi-icon layout as the Customer and Product forms.
- **Changes Made**:
  1. Updated the CurvedHeader to be compact (120 height) and cleanly handle Edit/Add string.
  2. Wrapped each input in a styled `iconBox`.
  3. Color-coded the icons: Indigo/Blue for Name, Green for Phone, Amber for Email.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: Reports Overview (Outstanding, Operations, Inventory, Financials)
- **User Request**: modify the reports section to look beutify catchy and as a report overview dont keep plane keep bar like pie like and all in detailed form so provide and make it done
- **Root Cause / Task**: The reports section was predominantly plain FlatLists. It needed a premium dashboard feel with charts.
- **Changes Made**:
  1. Integrated react-native-gifted-charts across reports.
  2. Added Top Debtors BarChart to OutstandingReport.
  3. Added Top Movers Delivered/Returned BarChart to InventoryReport.
  4. Added Route and Staff Success Rate BarCharts to OperationsReport.
  5. Enhanced FinancialReport PieChart with gradients, focus, and shadows.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: Reports Overview (Outstanding, Operations, Inventory)
- **User Request**: it is not expected also names are not fully visible in bars and all keep proefsional bars like square and all where inside them name there like that so amke more prosfesional use proefsional colors what we see in reports
- **Root Cause / Task**: The vertical BarCharts from gifted-charts truncated long names and didn't fit the desired professional square aesthetic.
- **Changes Made**:
  1. Replaced gifted-charts BarCharts with custom View-based horizontal progress bars.
  2. For Outstanding, added a red-themed bar with the debtor's name fully visible inside the bar overlay.
  3. For Inventory, added a dual-metric horizontal stacked ratio bar showing Delivered (Red) vs Returned (Green) seamlessly.
  4. For Operations, added horizontal bars with dynamic colors (Green/Amber/Red) based on the route/staff success rate, keeping the label cleanly inside.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: Reports Overview (Color Palette)
- **User Request**: can coor combination be more good for reppsrts section if yes so do this
- **Root Cause / Task**: The user wanted a more sophisticated, premium color combination instead of standard Tailwind red/green/blues.
- **Changes Made**:
  1. OutstandingReport: Upgraded debt bars and cards to a premium Rose/Crimson palette (#E11D48, #BE123C, #FFF1F2).
  2. InventoryReport: Swapped generic colors for thematic Sky Blue (#0284C7) for Delivered and Emerald (#059669) for Returned.
  3. OperationsReport: Applied the same Rose/Amber/Emerald scheme for Success Rate gauge and custom horizontal bars.
  4. FinancialReport: Updated KPI cards to use Brand Blue (#0B409C) for Billed Revenue and Emerald (#059669) for Collected, syncing PieChart colors accordingly.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: Reports Overview (Outstanding, Inventory)
- **User Request**: provide search also in it so that if we wnt something
- **Root Cause / Task**: The detailed customer lists in Outstanding and Inventory reports can get very long, making it hard to find a specific customer.
- **Changes Made**:
  1. Added a real-time TextInput search bar above the detailed lists in both OutstandingReport.jsx and InventoryReport.jsx.
  2. The search actively filters the FlatList based on the customer name.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: Navigation / CustomDrawerContent.jsx
- **User Request**: do one thing for custom tabs i want dont use image at top use some connecting colors there dont use image
- **Root Cause / Task**: The sidebar drawer was using an image background which the user wanted replaced with a clean color block.
- **Changes Made**:
  1. Removed `ImageBackground` from `CustomDrawerContent.jsx`.
  2. Replaced it with a clean `View` using the brand's primary connecting color (`#0B409C`).
  3. Adjusted text colors (business name, owner name) to white/light gray so they pop beautifully against the dark background.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: Navigation / CustomDrawerContent.jsx
- **User Request**: use sky like color there dont use blue
- **Root Cause / Task**: The dark primary blue was too heavy. The user requested a lighter, sky-like color for the drawer header.
- **Changes Made**:
  1. Updated the CustomDrawerContent header background to a vibrant Sky Blue (`#0EA5E9`).


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: Navigation / CustomDrawerContent.jsx
- **User Request**: for custom drawer i want that use same status bar geadient bg jhere
- **Root Cause / Task**: The user wanted the Sky Blue header to have a gradient effect, matching the premium visual style of the app's standard status bar/headers.
- **Changes Made**:
  1. Replaced the standard `View` with a `LinearGradient` from `
eact-native-linear-gradient`.
  2. Applied a Sky Blue gradient (from bright #38BDF8 to deep #0284C7) to give it a polished, premium look.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: navigation/CustomDrawerContent.jsx
- **User Request**: use for custom drawer exactract the gradeint from this and use in the top of custom drawer keep this
- **Root Cause / Task**: The user wanted to replace the temporary ImageBackground header with the beautiful SVG LinearGradient background from App.jsx to maintain the theme without crashing (since expo-linear-gradient is missing).
- **Changes Made**:
  1. Extracted the react-native-svg `LinearGradient` from `App.jsx`.
  2. Applied it as an absolute-fill background layer to the drawer header in `CustomDrawerContent.jsx`.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: SettingsScreen.jsx
- **User Request**: now beutify the setings screen to be good 
- **Root Cause / Task**: The Settings Screen was using basic TextInput components and a plain layout.
- **Changes Made**:
  1. Replaced the generic SafeAreaView header with the premium `CurvedHeader` component.
  2. Styled the profile hero section as a floating card that elegantly overlaps the curved header.
  3. Upgraded all text inputs with left-aligned Lucide icons (User, Briefcase, Mail, MapPin, Hash, Globe, Grid) and applied soft shadow styles matching the rest of the premium UI.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: SettingsScreen.jsx
- **User Request**: keep back button there and heaing of setting also
- **Root Cause / Task**: The user wanted a standard header (with a back button and a title) rather than relying on the drawer menu header, keeping the flat UI style.
- **Changes Made**:
  1. Added a flat top header to the Settings screen containing an `ArrowLeft` back button and a bold 

Settings title.
  2. The header matches the background cleanly and handles the SafeArea top inset perfectly.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: SettingsScreen.jsx
- **User Request**: business information written two times also make more beutiful form view for settings
- **Root Cause / Task**: Duplicate section title rendering inside the new card container; form inputs felt slightly rigid with full borders.
- **Changes Made**:
  1. Removed the duplicated 'Business Information' title.
  2. Overhauled the form fields: changed input labels to small, uppercase, widely spaced styling for a premium feel.
  3. Removed the borders from the inputs entirely, replacing them with a soft, borderless pill-shape design that fits perfectly inside the white card container.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: OrdersScreen.jsx, CurvedHeader.jsx, i18n/index.js
- **User Request**: now lets fix for i8n one by one screen by screen refresh button in the orderscreen today deliveries name at cureved ehadr fix this for order screen provide hindi english proeply transaltion there also for all screens header fix keep hindi english both there
- **Root Cause / Task**: The Orders Screen had hardcoded strings, missing translation keys, and the app lacked a global language toggle in the Curved Header.
- **Changes Made**:
  1. Updated `OrdersScreen.jsx` to use `	('home.todaysDeliveries')` and `	('common.refresh')` instead of hardcoded strings.
  2. Added missing `deliveries` and `
efresh` namespaces in both English and Hindi inside `i18n/index.js`.
  3. Placed a global 'HI/EN' language toggle button directly inside `CurvedHeader.jsx` so that *every* screen using this header has built-in translation switching capabilities.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: OrdersScreen.jsx
- **User Request**: lets change for the headera nd hindi english i8n issues but do not break any functionlity any where lets start with order screen make hindi english for refresh button lso for the today deliveries title at top cureved header make fix for this screen
- **Root Cause / Task**: Some UI text elements on the Orders screen (like the top curved header title and the Refresh button) were hardcoded in English, ignoring the active i18n language preference.
- **Changes Made**:
  1. Updated the `CurvedHeader` title to use `	('home.todaysDeliveries')` so it successfully toggles between Hindi and English.
  2. Wrapped the 'Refresh' text in the button with `	('common.refresh')` to support live language switching.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: HomeScreen.jsx
- **User Request**: in home screen in daily delivery progress it is coming today delivery make hindi english fix
- **Root Cause / Task**: The Daily Delivery Progress card on the Home Screen had hardcoded English text ('Pending', 'Skipped', 'Today's Deliveries', and 'Stay on track, you've got this!').
- **Changes Made**:
  1. Updated the 'Today's Deliveries' button text to use the `	('home.todaysDeliveries')` translation.
  2. Applied translations to the 'Pending' and 'Skipped' legend labels using the `deliveries.pending` and `deliveries.skipped` i18n keys.
  3. Linked the motivational subtext to `	('home.stayOnTrack')` so it fully translates alongside the rest of the dashboard.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: CustomDrawerContent.jsx
- **User Request**: in custom drawer reports and anytics in not maged by i8n fix
- **Root Cause / Task**: 'Reports & Analytics' menu item in the custom drawer navigation was hardcoded as a literal string.
- **Changes Made**:
  1. Added a new `	abs.reports` translation key for both English ('Reports & Analytics') and Hindi ('0	?	*	K	0	M		M	8	 	0	 	(	>	2	?		?		M	8	') in `i18n/index.js`.
  2. Updated `CustomDrawerContent.jsx` to use `	('tabs.reports')` instead of the hardcoded literal.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: StaffManagementScreen.jsx
- **User Request**: edit delete fix in staff managemnt list fix
- **Root Cause / Task**: The 'Edit' and 'Delete' button labels on individual staff member cards were hardcoded literal strings.
- **Changes Made**:
  1. Updated the 'Edit' button text to use `	('common.edit')`.
  2. Updated the 'Delete' button text to use `	('common.delete')`.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: ReportsScreen.jsx, i18n/index.js
- **User Request**: now for report screen as there is no i8n implkemntation so make it done
- **Root Cause / Task**: The Reports screen was completely missing i18n implementation; all tabs, dropdowns, and text were hardcoded strings in English.
- **Changes Made**:
  1. Created a comprehensive `
eports` translation namespace in `i18n/index.js` for both English and Hindi.
  2. Moved the `PRESETS` and `TABS` arrays inside the `ReportsScreen` component so they could access the `	()` hook dynamically.
  3. Replaced all hardcoded alerts, modal headers, filter pills ('Fr:', 'To:'), and the main screen header with translation hooks.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: components/reports/*.jsx, i18n/index.js
- **User Request**: no like detailed list and all no hindi translate found fix this also also check fully where else missigng for the hindi in report screen
- **Root Cause / Task**: The four sub-components rendered inside ReportsScreen (FinancialReport, InventoryReport, OperationsReport, OutstandingReport) still contained hardcoded English text for charts, tables, and lists.
- **Changes Made**:
  1. Added an extensive set of translation keys to the `
eports` namespace in `i18n/index.js` covering all internal labels (e.g. 'Detailed List', 'Billed Revenue', 'Success Rate', etc.).
  2. Injected `useTranslation` into `FinancialReport.jsx`, `InventoryReport.jsx`, `OperationsReport.jsx`, and `OutstandingReport.jsx`.
  3. Replaced all hardcoded strings inside these components with dynamic `	()` calls.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: src/Screens/Main/PastDeliveriesScreen.jsx, src/Screens/Main/OrdersScreen.jsx
- **User Request**: for daily delivery screen make ui ux like order screen to look good and attrcative same like left side border and all also do for hindi english also now i want that all deliveries text should be also for hindi 
- **Root Cause / Task**: 'All Deliveries' (PastDeliveriesScreen) lacked the dynamic left status border present in other views, and 'All Deliveries' title lacked i18n support. Delivery cards in OrdersScreen were also hardcoded to a blue left border.
- **Changes Made**:
  1. Updated `DeliveryCard` in both `PastDeliveriesScreen.jsx` and `OrdersScreen.jsx` to apply `orderLeftColor: getStatusColor(delivery.status)` for a dynamic left border.
  2. Applied `	('deliveries.allDeliveries')` to the header title in `PastDeliveriesScreen.jsx` and added the translation to `src/i18n/index.js`.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: src/Screens/Main/PastDeliveriesScreen.jsx
- **User Request**: the back button is difrrent fix use arrowleft as we used [previous al;so color fix
- **Root Cause / Task**: The back button on the All Deliveries screen was set to ChevronLeft and was using an incorrect color.
- **Changes Made**:
  1. Updated `CurvedHeader` to use `ArrowLeft` and set its color to `#FFF` for visibility against the blue gradient.
  2. Imported `ArrowLeft` from `lucide-react-native`.


- **Date**: 2026-08-22
- **Day**: Saturday
- **Component / File**: src/i18n/index.js
- **User Request**: do one thing fix payments.TotalAmountDue fix for the i8n language fix so please make it done on pymnet screen
- **Root Cause / Task**: The translations for 'Total Amount Due' and 'Available Balance' were missing from the payments namespace in the i18n configuration, causing translation fallbacks on the Payments screen.
- **Changes Made**:
  1. Added `	otalAmountDue` and `vailableBalance` to both English and Hindi configurations under the `payments` namespace in `src/i18n/index.js`.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/Screens/Main/OrdersScreen.jsx, src/Screens/Main/PastDeliveriesScreen.jsx
- **User Request**: fix order screen left border not visible no color visible, use some blue like border left in order screen
- **Root Cause / Task**: The left border width/color was colliding with the base borderColor and isExpanded styles in React Native, rendering it invisible in some views. Furthermore, the user wanted a strict blue border on the main OrdersScreen instead of dynamic status colors.
- **Changes Made**:
  1. Updated `OrdersScreen.jsx` DeliveryCard to use a static Blue left border (`#3B82F6`).
  2. Moved the inline border styles to the very end of the array in both `OrdersScreen.jsx` and `PastDeliveriesScreen.jsx` to ensure they correctly override the generic `orderColor` from `isExpanded`.
  3. Added `orderStyle: 'solid'` to guarantee rendering across different device OS versions.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/Screens/Main/OrdersScreen.jsx, src/Screens/Main/PastDeliveriesScreen.jsx
- **User Request**: do one thing make yellow border color for pending like in order screen and delievry screen both
- **Root Cause / Task**: The pending status was previously mapped to a blue color for the left border, which caused confusion and didn't look right.
- **Changes Made**:
  1. Updated `getStatusColor` in both `OrdersScreen.jsx` and `PastDeliveriesScreen.jsx` to map the `pending` status to Yellow (`#EAB308`).
  2. Fixed a bug in the inline styling where the object structure returned by `OrdersScreen`'s `getStatusColor` was not being properly extracted for the border color by using `(getStatusColor(delivery.status)?.dot || getStatusColor(delivery.status))`.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: App.jsx
- **User Request**: now modify the app.jsx if the route is onboardign then keep status bar color to blue that we have previously is this possible if yes so say yes and procced
- **Root Cause / Task**: The user wanted the Onboarding (CompleteRegistration) screen to retain the classic solid blue status bar instead of the new light-blue gradient applied globally across the App.
- **Changes Made**:
  1. Added `isOnboardingScreen` state to `App.jsx` tracking the `CompleteRegistration` route.
  2. Dynamically updated the `StatusBar` `ackgroundColor` to `#0B409C` and `arStyle` to `light-content` when on the onboarding screen.
  3. Dynamically set the top `SafeAreaView` background color to match the status bar to ensure a seamless color fill at the top notch.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: App.jsx
- **User Request**: no its not done i want that onboarding screen jsx 1 and 2 both should have status bar blue like
- **Root Cause / Task**: The dynamic status bar check only included `CompleteRegistration`, not the `Onboarding1` and `Onboarding2` routes from `AuthStack`.
- **Changes Made**:
  1. Updated the `isOnboardingScreen` state in `App.jsx` to explicitly check for `['Onboarding1', 'Onboarding2', 'CompleteRegistration'].includes(route.name)`.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: App.jsx
- **User Request**: no its not done 
- **Root Cause / Task**: The dynamic `<StatusBar>` component was failing to update its background color natively on Android devices when transitioning to the onboarding screens.
- **Changes Made**:
  1. Injected an imperative native OS command (`StatusBar.setBackgroundColor`) directly into the `useEffect` hook in `App.jsx` to force Android to physically redraw the status bar background color to `#0B409C` exactly when the route changes.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: App.jsx
- **User Request**: not done again is this possible or not
- **Root Cause / Task**: The `NavigationContainer`'s `onStateChange` and `onRouteReady` props occasionally fail to fire reliably on the initial mounting of the AuthStack due to a known React Navigation lifecycle race condition, meaning `isOnboardingScreen` was staying `alse` on initial load.
- **Changes Made**:
  1. Bound a manual `
avigationRef.addListener('state', updateRoute)` listener inside a `useEffect` block to perfectly intercept all nested stack transitions.
  2. Implemented a 100ms `setTimeout` check to ensure the initial route state is captured even if the UI renders faster than the navigation stack resolves.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: App.jsx
- **User Request**: now modify the app.jsx if the route is onboardign then keep status bar color to blue that we have previously
- **Root Cause / Task**: The newly added LinearGradient background in App.jsx was indiscriminately overriding all screens, disrupting the carefully crafted top-notch color matching for the onboarding/auth screens.
- **Changes Made**:
  1. Updated `updateRoute` logic to explicitly include `'Splash'` in the `isAuthScreen` check.
  2. Wrapped the new `LinearGradient` inside a conditional block (`{!isAuthScreen && ...}`) so it ONLY renders on the main inner app screens.
  3. Restored the dynamic `SafeAreaView` styling (`ackgroundColor: isAuthScreen ? '#95CFFE' : 'transparent'`) and top edges logic to ensure the onboarding screens perfectly retain their previous blue status bar matching.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/navigation/MainTabs.jsx
- **User Request**: now on curved header i want that remove the camper text and droplet such that use logo1.png image make it such that it looks perfectly there
- **Root Cause / Task**: The user wanted to replace the text-based Camper logo and Droplet icon with a custom provided image (logo1.png) on the Home Screen header.
- **Changes Made**:
  1. Removed the `CustomDropletIcon` and `<Text>Camper</Text>` from the `	itle` prop of the `CurvedHeader` in `MainTabs.jsx`.
  2. Inserted a responsive `<Image>` component pointing to `../../assets/logo1.png` with `
esizeMode=` ontain`` and optimal dimensions to ensure it looks perfect inside the curved header layout.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/Screens/SplashScreen.jsx
- **User Request**: use splash.png as image on the splash screen so replace splash screen with this
- **Root Cause / Task**: The user wanted to replace the complex typographic animation splash screen with the newly provided static image (`splash.png`).
- **Changes Made**:
  1. Completely rewrote `SplashScreen.jsx` to render an `ImageBackground` using `splash.png`.
  2. Maintained the smooth 500ms fade-out transition by wrapping the image in an `Animated.View`.
  3. Set a strict 2.5-second display timer before automatically calling the `onFinish` prop to seamlessly transition the user into the main app / Auth stack.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: App.jsx
- **User Request**: here is some fix as after image dissper in splash screen sky blue background is persisting fix that
- **Root Cause / Task**: An old global sky-blue `LinearGradient` was left inside `App.jsx` behind the `RootNavigator`. Because the new `SplashScreen` fades out its opacity to 0, it was exposing this sky-blue gradient before the navigator fully unmounted the splash screen.
- **Changes Made**:
  1. Removed the legacy absolute `LinearGradient` `<Svg>` layer from `App.jsx` so the app falls back to standard background colors without any blue flashing.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/Screens/SplashScreen.jsx
- **User Request**: here is some fix as after image dissper in splash screen sky blue background is persisting fix that d npt change status bar or color anything jsut fix that why after image dissaper color comes
- **Root Cause / Task**: The splash screen was fading its opacity to 0 over 500ms before calling `onFinish`. This caused the splash screen to become transparent while the main app navigation stack had not yet mounted, exposing the underlying `App.jsx` blue background gradient to the user.
- **Changes Made**:
  1. Removed the `Animated.timing` fade-out logic from `SplashScreen.jsx`.
  2. Changed it to simply hold the image for 3 seconds and then immediately call `onFinish()`, allowing a seamless snap to the Login or Dashboard screen without exposing the app's root background.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/Screens/onboardings/OnboardingScreen1.jsx, src/Screens/onboardings/OnboardingScreen2.jsx
- **User Request**: now on onbording screens 1 and 2 change logo with the new logo we have logo1.png
- **Root Cause / Task**: The onboarding screens were previously using separate english and hindi logo assets dynamically. The user requested to universally use the new `logo1.png`.
- **Changes Made**:
  1. Updated the `<Image>` source prop in the header of both `OnboardingScreen1.jsx` and `OnboardingScreen2.jsx` to strictly point to `../../../assets/logo1.png`.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/Screens/Main/CustomerDetailScreen.jsx, src/Screens/Main/CustomerDeliveryHistoryScreen.jsx
- **User Request**: now modify the view history pages with new ui and more good ui look left side borders and all make it some gradient as per sttus and all and modify and make for view history change in customer detail
- **Root Cause / Task**: The user wanted to upgrade the View History experience in Customer Details to a premium layout, featuring beautiful gradient cards and thick status-based left borders.
- **Changes Made**:
  1. Updated the `View History` button in `CustomerDetailScreen.jsx` to navigate to the advanced `CustomerDeliveryHistoryScreen` instead of the older basic history page.
  2. Overhauled `CustomerDeliveryHistoryScreen.jsx` to use `LinearGradient` from `
eact-native-linear-gradient` for the activity cards. 
  3. Added dynamic left-border styling with a thick `orderLeftWidth: 6` and solid dark status colors, alongside a beautifully soft gradient fade to white (`#FFFFFF`) for the card backgrounds depending on the activity type (Delivery, Subscription, Invoice, etc).


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/Screens/Main/CustomerHistoryScreen.jsx
- **User Request**: this is datat and api i want that modify the ui such that modify the customer history make it beutify more clear and more good attractoive
- **Root Cause / Task**: The customer history screen used basic white cards and simple list items which did not align with the new premium design system.
- **Changes Made**:
  1. Replaced the flat summary box with a deep blue `LinearGradient` card, featuring clearly spaced grids and glowing `lucide-react-native` icons (`Droplets`, `IndianRupee`).
  2. Redesigned history item cards to utilize thick solid left borders mapped to the delivery status (Blue for delivered, Yellow for pending).
  3. Added custom badges and redesigned the layout grid for tracking Full Jars Delivered vs Empty Jars Retrieved.
  4. Redesigned the Tab Selector into a sleek, overlapping iOS-style segmented control.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/Screens/Main/CustomerHistoryScreen.jsx
- **User Request**: from top bring some down as going inside the curved header fix that in hostory and just ans in empty jars tab what we show and why no deliveries found comng
- **Root Cause / Task**: The user noticed the tab selector overlapping with the curved header text and wanted to know why the Empty Jars tab was displaying 'No deliveries found'. The overlap was caused by a negative margin, and the text was an incorrect reused translation key.
- **Changes Made**:
  1. Removed `marginTop: -20` and replaced it with `marginTop: 16` to perfectly space the Tabs container below the header.
  2. Changed the hardcoded Empty Component text in the Jars tab from `	('deliveries.noDeliveriesFound')` to `No jar history found`.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/Screens/Main/CustomerHistoryScreen.jsx
- **User Request**: ' [API Response] 200 from http://192.168.1.5:3007/api/vendor/customers/3a656edf-cd9b-4739-876e-baa1fcb768b6/jar-collections ... here is data now as per that fix
- **Root Cause / Task**: The frontend was expecting an array called `collections` and a field called `date` and `
unningJarsOut`, but the API responds with an array called `history` and fields `deliveryDate`, `fullUnitsDelivered`, `emptyUnitsCollected`.
- **Changes Made**:
  1. Updated the JSON mapping in `fetchHistoryData` from `
es.data.collections` to `
es.data.history`.
  2. Overhauled `
enderJarItem` to use `deliveryDate` for formatting.
  3. Replaced the missing `
unningJarsOut` field with a dynamic calculation showing the 'Net Change' in jars for that specific event (e.g., '+1 Jars Out', 'Balanced (0)').


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/Screens/Main/CustomerHistoryScreen.jsx
- **User Request**: now do one thing add a console and print the tocken
- **Root Cause / Task**: The user wanted to debug and inspect the `userToken` in their local terminal console.
- **Changes Made**: Added a `console.log('--- USER TOKEN ---', userToken)` to the `fetchHistoryData` function.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/Screens/Main/GenerateInvoiceScreen.jsx
- **User Request**: modify the card in the generate invoice nmake it like what we have in paymnet statemnt card alkso fix for i8n language there as coming deliveries.pendingtoInvoice fix hindi english of this dont change anything else
- **Root Cause / Task**: The 'Pending to be Invoiced' summary card was a basic flat box, and the translation key was referencing `deliveries.pendingToInvoice` which didn't exist in the i18n file (it was under `invoice.pendingToInvoice`).
- **Changes Made**:
  1. Updated `GenerateInvoiceScreen.jsx` to use the `
eact-native-svg` `LinearGradient` to exactly match the premium Payment Statement card design.
  2. Fixed the translation key by changing it to `	('invoice.pendingToInvoice')` which instantly resolved the English/Hindi missing translation issue.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/Screens/Main/GenerateInvoiceScreen.jsx
- **User Request**: again language fix is not done as coming in invoice.pendingto invpoice
- **Root Cause / Task**: The translation key was incorrectly typed as `invoice.pendingToInvoice`, but the parent object in the `i18n/index.js` file is actually named `invoices`.
- **Changes Made**: Updated the key to `invoices.pendingToInvoice` which immediately resolved the issue.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/navigation/MainTabs.jsx
- **User Request**: for home screen the logo should start on the point rest are there it is right side i want like on other screen we have same space consitnecy come
- **Root Cause / Task**: The logo image inside the Home header had excess positive margins, making it sit too far to the right compared to standard text titles.
- **Changes Made**: Applied a `marginLeft: -8` to the logo container to pull it flush to the left, matching the exact spacing of the text titles on all other screens.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/Screens/Main/UnbilledDeliveriesScreen.jsx
- **User Request**: modify the unbilled deliveries to look good and more attrcative add left side border and all just make it premium look and attartive
- **Root Cause / Task**: The user wanted the `

Pending o e

Invoiced` cards to follow the premium design style (white background, deep shadows, thick left border).
- **Changes Made**: Rewrote the `styles.card` to use a flat white background, enhanced shadow elevation, and a thick `COLORS.primary` left border. Softened the internal stats card background (`#F8FAFC`), made the customer avatar fully circular, and modernized the `Estimated

Total` badge for a premium, clean layout.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/components/reports/InventoryReport.jsx, src/components/reports/OutstandingReport.jsx
- **User Request**: for inventory in routes for list do the same also for outstabding amount so make it look good
- **Root Cause / Task**: The list cards inside the Inventory and Outstanding Debt reports needed to match the new premium design consistency.
- **Changes Made**: Updated the `card` and `customerCard` styles in both components to feature a flat white background, deeper shadow elevation, and the signature thick `COLORS.primary` left border.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/components/reports/InventoryReport.jsx, src/components/reports/OutstandingReport.jsx
- **User Request**: for outsabding add pink or red like left border also in invetry make clear in list like route and staff unasigned so that if assigned as currently no head is there
- **Root Cause / Task**: The outstanding report left border was blue (default primary) which didn't fit the negative debt context, and the inventory report showed blank spots when route or staff were unassigned.
- **Changes Made**: Changed the left border on OutstandingReport cards to a deep rose/red (`#E11D48`). Updated InventoryReport to explicitly render `

Unassigned

Route

" 

Unassigned

Staff` if data is missing, rather than leaving empty gaps.


- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/components/reports/InventoryReport.jsx
- **User Request**: no make like staff then its status and route then what status like this i want so keep like that and modify the inventory detailed list again
- **Root Cause / Task**: The user wanted route and staff assignments in the Inventory Report to be explicitly labeled rather than a single string, so it's clearer when someone is unassigned.
- **Changes Made**: Split the route and staff text into two stacked label badges (e.g. `

Route:

Route

A`, `Staff:

Staff

B`). Styled the staff badge with a subtle slate color to distinguish it from the primary route badge.



- **Date**: 2026-08-24
- **Day**: Monday
- **Component / File**: src/services/api.js, src/context/AuthContext.js, src/Screens/Auth/OtpVerificationScreen.jsx, src/Screens/Auth/CompleteRegistrationScreen.jsx
- **User Request**: Implement persistent login using refresh tokens via local async storage.
- **Root Cause / Task**: The backend migrated to short-lived access tokens (1 hour) and refresh tokens (30 days) for improved security. The app needed a robust, queued fetch interceptor to handle token refresh without disrupting the user experience.
- **Changes Made**:
  1. Built a custom fetchWithAuth interceptor wrapper inside api.js to automatically catch 401s, queue parallel requests, refresh the token, and replay the original requests seamlessly.
  2. Modified AuthContext.js to securely manage refresh_token in AsyncStorage alongside jwt_token.
  3. Updated the authentication screens (OTP and Registration) to capture and pass the new refreshToken to the global state.
  4. Exposed a setLogoutCallback from api.js that AuthContext.js subscribes to, guaranteeing the app logs out and clears state if the refresh token expires or is revoked.

### Date: 2026-08-25 (Tuesday)
- **Component / File**: `CurvedHeader.jsx`, `MainTabs.jsx`, `HomeScreen.jsx`, `CustomDrawerContent.jsx`, `SettingsScreen.jsx`, `SubscriptionDetailScreen.jsx`, `ProductCatalogScreen.jsx`, `CustomerDetailScreen.jsx`, `PaymentsScreen.jsx`, `OrdersScreen.jsx`, `AlertContext.jsx`, `i18n/index.js`, and the affected modal/detail/form screens.
- **User Request**: Consolidate the latest header, profile imagery, card spacing, global alerts, quick actions, Hindi localization, payment labels, and staff delivery-route filter improvements without changing existing business functionality.
- **Root Cause / Task**: Several screens still had inconsistent header artwork and spacing, native generic alerts, hardcoded English strings, missing profile artwork, and a staff route filter that opened on All Routes instead of the most useful assigned route.
- **Changes Made**:
  1. Updated `CurvedHeader.jsx` so Home retains the `header_bg9.png` artwork while inner screens use the same light blue gradient language as the Custom Drawer; capped inner-screen header height at `55` while preserving each screen's existing header actions and navigation behavior.
  2. Preserved the Home header layout with the Camper logo on the left and added `heroSetting.jpeg` as the right-side Settings shortcut image; tapping it continues to navigate to Settings.
  3. Added `heroSetting.jpeg` beside the business information in the Custom Drawer as a visual-only enhancement, without changing drawer navigation behavior.
  4. Replaced the Settings screen's flat header with the shared curved header, retained the Edit/Cancel action, replaced the old profile image with `heroSetting.jpeg`, and corrected top spacing so the profile card no longer sits inside the header.
  5. Applied the same content-spacing correction to `SubscriptionDetailScreen.jsx` so its first card begins below the compact curved header.
  6. Fixed the `FastImage` runtime error in `ProductCatalogScreen.jsx` by importing the component before preloading product images; also used `FastImage` in the touched image-heavy header/profile areas.
  7. Standardized touched confirmation dialogs on the shared white custom alert/modal from `AlertContext.jsx`, including delete/remove actions and Custom Drawer/Settings logout confirmation; destructive actions now require confirmation before execution.
  8. Added localized default alert labels and expanded English/Hindi translations for modal titles, confirmation messages, cancel/delete/remove buttons, validation notices, date labels, route assignment actions, invoice actions, and related fallback text.
  9. Added **Unbilled Deliveries** as the final Home Quick Action while retaining the existing navigation and quick-action slider behavior.
  10. Localized Customer Detail's **View History** and **Not Provided** text and converted subscription recurrence/delete text to translation keys.
  11. Localized the bottom-navigation **Payments** label, the **Bank Transfer** payment chip, payment-mode badges, and missing-phone fallback text on the Payments screen.
  12. Improved the staff Today Deliveries route filter: after the initial unfiltered delivery load, the app automatically selects the assigned route with the most deliveries matching the current status (Pending by default). If none match, it selects the route with the most overall delivery data, then falls back to the first assigned route when no delivery data exists.
  13. Added a one-time initialization guard so staff can manually switch to another assigned route or All Routes and their choice is not overwritten afterward.
  14. Redesigned the Home screen's empty **Today's Deliveries** state as a polished rounded white card with subtle neutral elevation, a layered delivery icon, and improved title/message typography. Removed colored borders and decorative highlighting after review; loading, populated-list, navigation, and API behavior remain unchanged.
  15. Corrected the top spacing in `UnbilledDeliveriesScreen.jsx` so the first **Pending to be Invoiced** card begins below the compact curved header instead of visually entering the header area; delivery and invoice behavior remain unchanged.
  16. Added a shared pulsing image skeleton to both onboarding screens. The placeholder occupies the illustration area until each onboarding image loads, then the image fades in smoothly; Skip, Back, Next, Get Started, and navigation behavior remain unchanged.
  17. Replaced the static splash artwork with the selected **Animated Water Drop** concept. The splash reuses the exact inner-header gradient palette while a water droplet falls into the exact horizontal and vertical screen center, squashes on impact, produces two expanding ripple waves, and dissolves into the Camper logo with a soft spring/fade. To ensure consistent device positioning, the impact stage now uses its own full-screen flex-centering layer instead of percentage-based absolute coordinates; the tagline uses a separate centered layer offset below it. The localized tagline, white curved exit sweep, existing three-second completion callback, and authentication/navigation flow remain unchanged.
- **Status**: Implemented; focused lint and diff validation completed for the latest delivery, Home empty-state, header-spacing, onboarding image-loading, and animated splash changes.

### Date: 2026-09-03 (Wednesday)
- **Component / File**: `LoginScreen.jsx`, `RegisterScreen.jsx`
- **User Request**: Add a language change tab (EN/HI) on the Login and Register screens, aligned to the right of the form header title text.
- **Root Cause / Task**: Vendors needed the ability to switch languages before logging in, without navigating to a settings screen first.
- **Changes Made**:
  1. Added `AsyncStorage` import and `i18n` destructuring to both `LoginScreen.jsx` and `RegisterScreen.jsx`.
  2. Created a `changeLanguage()` helper that calls `i18n.changeLanguage(lng)` and persists the selection to `AsyncStorage` (same pattern as `SettingsScreen.jsx`).
  3. Wrapped the existing `headerTitleContainer` and a new `langSwitcher` view inside a `headerRow` (flexDirection: 'row', justifyContent: 'space-between') so the title sits on the left and the language tabs sit cleanly on the right.
  4. The language switcher is a compact pill with EN and HI tabs. The active tab uses the deep brand blue (`#043994`) background with white text; inactive tabs use slate gray text on a light gray background (`#F1F5F9`).
  5. No existing functionality, images, or form behavior was changed.
- **Status**: Implemented.

### Date: 2026-09-05 (Saturday)
- **Component / File**: `SubscriptionDashboardScreen.jsx`
- **User Request**: Make UPI and Netbanking available in the native Razorpay subscription checkout.
- **Root Cause / Task**: Checkout did not provide a payment-method display configuration, leaving the presentation order entirely to Razorpay's account-level recurring-payment configuration.
- **Changes Made**:
  1. Added a Razorpay Checkout display block requesting UPI, Netbanking, and card methods for subscription authorization.
  2. Kept Razorpay's default blocks enabled so any other account-supported recurring methods remain available.
  3. Added a safe diagnostic listing the requested method names without logging payment credentials.
- **External Requirement**: Razorpay only displays recurring methods enabled for the same account and mode as the supplied key. UPI Autopay and eMandate/Netbanking must be enabled under Razorpay Subscriptions settings or by Razorpay Support for the test-key account.
- **Status**: App-side checkout configuration implemented.

### Date: 2026-09-05 (Saturday)
- **Component / File**: `api.js`, `ReportsScreen.jsx`, `AlertContext.jsx`
- **User Request**: Stop the financial-report API from calling continuously when a plan-limit error occurs, show the subscription modal for the backend's feature-lock response, and enlarge the modal.
- **Root Cause / Task**: The reports screen recreated its filters object during global alert state updates, retriggering the report effect and forming an API/modal render loop. The global plan-limit interceptor also recognized only HTTP 409 even though feature entitlement locks are returned as HTTP 403.
- **Changes Made**:
  1. Memoized report filters so report APIs run only when a filter value actually changes.
  2. Added narrowly scoped HTTP 403 feature-lock detection while preserving HTTP 409 plan-limit handling; ordinary permission-related 403 responses remain normal errors.
  3. Preserved the backend plan-limit message and attached the response status to the generated plan-limit error.
  4. Increased the global popup width, minimum height, spacing, typography, corner radius, and button height for better readability.
- **Status**: Implemented and verified with focused lint checks.

### Date: 2026-09-05 (Saturday)
- **Component / File**: `SubscriptionDashboardScreen.jsx`
- **User Request**: Make the subscription screen back button consistent with other curved-header screens.
- **Root Cause / Task**: The subscription header used the `ChevronLeft` icon while the shared screen pattern uses `ArrowLeft`.
- **Changes Made**: Replaced the subscription header's chevron with the standard white 24px `ArrowLeft` icon while preserving the existing `navigation.goBack()` behavior.
- **Status**: Implemented.

- **Component / File**: `api.js`, `SubscriptionDashboardScreen.jsx`
- **User Request**: Add console logging throughout all subscription API operations.
- **Root Cause / Task**: Generic API logs did not clearly group subscription operations or identify which subscription action produced each response during integration debugging.
- **Changes Made**:
  1. Added a centralized subscription request wrapper that logs the operation name and safe request metadata without logging the bearer token.
  2. Added response and error logs for active plans, subscription status, checkout, plan changes, cancellation, payment history, and usage tracking.
  3. Retained the dedicated active-plan response log on the Subscription Dashboard.
  4. Preserved all existing endpoints, return values, errors, UI behavior, and authentication handling.
- **Status**: Implemented.

- **Component / File**: `api.js`, `SubscriptionDashboardScreen.jsx`
- **User Request**: Align the subscription integration with the supplied backend guide and runtime responses while keeping subscription-limit errors on HTTP 409 only.
- **Root Cause / Task**: Checkout had been corrected, but status polling still expected only a wrapped response, plan changes used PATCH instead of PUT, and cancellation could not send the required `cancelAtPeriodEnd` body.
- **Changes Made**:
  1. Kept global subscription-limit interception restricted to HTTP 409 as explicitly requested; improved its backend-message diagnostics without enabling HTTP 403 interception.
  2. Normalized initial subscription status and payment polling to support both direct and `{ data: ... }` response shapes.
  3. Added terminal polling handling for `past_due`, `cancelled`, and `canceled` statuses.
  4. Added PUT request support and updated plan changes to use the documented PUT endpoint contract.
  5. Added optional DELETE request bodies and made cancellation send `{ cancelAtPeriodEnd: true }` by default.
  6. Added logged API helpers for single-plan details and feature-entitlement checks.
- **Status**: Implemented; subscription-limit handling remains 409-only.

- **Component / File**: `SubscriptionDashboardScreen.jsx`
- **User Request**: Fix the “Failed to initialize checkout” toast after a successful subscription checkout.
- **Root Cause / Task**: The backend returned HTTP 201 with the Razorpay URL nested at `rzpSubscription.short_url`, while the screen only checked top-level and `data.short_url` fields.
- **Changes Made**: Updated checkout URL extraction to support `rzpSubscription.short_url` and `data.rzpSubscription.short_url`, while retaining the existing top-level response fallbacks. Checkout, polling, navigation, and 409-only subscription-limit behavior remain unchanged.
- **Status**: Implemented.

- **Component / File**: `SubscriptionDashboardScreen.jsx`, `AndroidManifest.xml`
- **User Request**: Show the purchased plan name correctly and return/update the app after completing payment in the browser.
- **Root Cause / Task**: Subscription status returns `planVersion.planId` without a `planName`, causing the UI fallback to show Free Trial. External-browser polling may pause while the app is backgrounded, and no Android payment-return deep link was registered.
- **Changes Made**:
  1. Matched the subscription's plan/version IDs against the available-plans response and enriched the active subscription with the correct plan name.
  2. Corrected Current Plan detection to compare `planVersionId` with the displayed version ID.
  3. Automatically resumed pending-payment polling on screen load and ran an immediate status check when the app returns to the foreground.
  4. Added handling for `camper://subscription/payment-complete` deep-link events and registered the `camper://subscription` scheme in AndroidManifest.xml.
  5. Preserved the known plan name when polling returns an active subscription without its parent plan name.
- **Status**: Implemented. Automatic browser-to-app launch requires the backend/Razorpay success flow to redirect to `camper://subscription/payment-complete`; manual return now refreshes immediately.

- **Component / File**: `SubscriptionDashboardScreen.jsx`
- **User Request**: Prevent subscription-status polling from running before the user starts a payment.
- **Root Cause / Task**: Loading an existing `pending_payment` subscription automatically set the local waiting state, which started the 3-second polling loop even when no checkout was initiated in the current app session.
- **Changes Made**: Removed status-driven polling activation during the initial dashboard fetch. The screen still performs its normal one-time status request, but repeated polling now begins only after checkout succeeds and a Razorpay URL is received. Foreground and deep-link status checks remain active for that checkout session.
- **Status**: Implemented.

- **Component / File**: `SubscriptionDashboardScreen.jsx`, `package.json`, `package-lock.json`
- **User Request**: Keep Razorpay checkout inside the app so users do not depend on an external browser returning to Camper.
- **Root Cause / Task**: The backend provides only a hosted Razorpay `short_url` and no callback URL or native-checkout verification contract, so an external browser cannot reliably return automatically.
- **Changes Made**:
  1. Added `react-native-webview` and replaced the normal external-browser checkout launch with a full-screen in-app secure checkout modal.
  2. Kept subscription-status polling restricted to successful checkout initiation and automatically closes the modal when the backend reports `active`, `past_due`, or cancelled status.
  3. Added external-app handling for non-web payment schemes such as UPI and retained an Open in Browser fallback if WebView loading fails.
  4. Added a clear close action that stops the current checkout polling session without changing subscription data.
- **Status**: Implemented and verified with a successful Android debug build. The rebuilt APK was reinstalled on the connected emulator with app data preserved, and the app launched without the `RNCWebViewModule` crash.

- **Component / File**: `SubscriptionDashboardScreen.jsx`, `package.json`, `package-lock.json`
- **User Request**: Revert subscription checkout from the in-app WebView back to browser-only checkout.
- **Changes Made**: Restored `Linking.openURL` for the Razorpay hosted payment URL, removed the checkout WebView modal and related UI/state handling, and retained checkout-triggered polling, active-plan mapping, corrected response handling, and browser-open error feedback.
- **Status**: Implemented; the WebView dependency was removed from the project.

- **Component / File**: `SubscriptionDashboardScreen.jsx`, `AndroidManifest.xml`, `package.json`, `package-lock.json`
- **User Request**: Replace browser-based subscription payment with the Razorpay SDK and add diagnostics throughout the native checkout flow.
- **Root Cause / Task**: The hosted `short_url` leaves the app and cannot reliably return without backend redirect support. The updated backend guide recommends in-app checkout using the created Razorpay subscription ID.
- **Changes Made**:
  1. Installed the official `react-native-razorpay` SDK and replaced `Linking.openURL(short_url)` with `RazorpayCheckout.open()`.
  2. Configured native subscription checkout using `subscription_id`, business/customer prefill details, plan currency, and app theme without passing a client-controlled amount.
  3. Added structured console diagnostics for checkout creation, configuration extraction, native SDK opening, authorization success/failure, and subscription activation polling. Secrets and full key values are never logged.
  4. Changed polling to start only after the native SDK reports successful payment authorization.
  5. Removed the browser-return Android deep-link intent filter because native checkout returns directly to the app.
  6. Added guarded support for `razorpayKeyId`, `keyId`, or `key_id` in the checkout response and a precise configuration error when no public key ID is supplied.
- **Backend Modification Required**: Include the public Razorpay key ID in the checkout response as `razorpayKeyId`. Keep the Razorpay key secret exclusively on the backend and ensure webhooks update the subscription from `pending_payment` to `active`.
- **Status**: Frontend native SDK integration implemented and verified with a successful Android debug build. The rebuilt APK was installed on the emulator and launched with `RazorpayPackage` registered; backend public-key response support is still required before checkout can open.

- **Component / File**: `SubscriptionDashboardScreen.jsx`
- **User Request**: Configure the supplied Razorpay test key ID for native checkout.
- **Changes Made**: Added `rzp_test_SbMjn5LrmOZKI7` as the hardcoded public test-key fallback. A key returned by the backend still takes precedence, full key values remain excluded from console logs, and no Razorpay secret is stored in the app.
- **Status**: Implemented for Razorpay test mode; replace the test key with the live public key before production release.

## Section 11: Excel Generation Tracking

This section tracks the dates for which daily Excel reports have been generated and exported. 

### Completed Excel Exports
- **2026-09-03** (Today) - *Completed*

### Carry-Forward / Pending Excel Exports
- *(Add any skipped dates here to track them for the future)*
- *(Add any upcoming dates here if they need to be generated ahead of time)*

### Date: 2026-09-05 (Saturday)
- **Component / File**: api.js, AlertContext.jsx, RootNavigator.jsx, MainDrawer.jsx, SubscriptionDashboardScreen.jsx
- **User Request**: Implement the Subscription Limits (409) flow and Razorpay Integration
- **Root Cause / Task**: Needed a secure subscription system.
- **Changes Made**:
  1. Updated api.js to intercept 409 responses and trigger a global onPlanLimitCallback.
  2. Filtered 'PLAN_LIMIT_REACHED' in AlertContext so it doesn't show standard duplicate toasts.
  3. Added a global Alert listener in RootNavigator that shows a beautiful blocking modal to restrict access when limits hit.
  4. Created SubscriptionDashboardScreen.jsx with a premium UI to handle viewing the active plan and purchasing upgrades.
  5. Implemented Razorpay using Linking.openURL(short_url) to securely open the payment gateway in the system browser without WebView 3D-Secure issues.
  6. Implemented a 3-second background polling mechanism that automatically updates the UI once payment is successful.

- **Component / File**: CustomDrawerContent.jsx, api.js, SubscriptionDashboardScreen.jsx
- **User Request**: Fetch active plans dynamically from the backend and ensure the dedicated tab is visible in the Hamburger menu.
- **Root Cause / Task**: The "Subscription & Billing" drawer tab was missing from the static navigation list, and plans were hardcoded.
- **Changes Made**:
  1. Added { title: 'Subscription & Billing', screen: 'SubscriptionDashboard', ownerOnly: true } to the allMenuItems array in CustomDrawerContent.jsx.
  2. Added getActivePlans endpoint to api.js pointing to /api/subscription_module/admin/plans.
  3. Replaced HARDCODED_PLANS in SubscriptionDashboardScreen.jsx with dynamic data fetched from getActivePlans.
  4. Mapped the backend plan payload (including activePlanVersionId, pricing, and JSON parsed features) seamlessly into the UI card schema.

- **Component / File**: api.js
- **User Request**: Gracefully handle 404 No subscription found errors without logging scary red console errors.
- **Root Cause / Task**: The API returns `{"error": "No subscription found..."}` for new users without a plan, but our fetch client was defaulting to "Something went wrong" and logging it as a hard failure.
- **Changes Made**:
  1. Updated all request methods (GET, POST, PATCH, etc.) in `api.js` to correctly extract `data.error` if `data.message` is undefined.
  2. Updated the `logError` function to intercept the "No subscription found for this customer" error and log it as a quiet `ℹ️ [API Info]` rather than a red `❌ [API Error]`. This prevents the developer console from flooding while safely continuing the frontend flow.

- **Component / File**: SubscriptionDashboardScreen.jsx
- **User Request**: Map the actual API payload structure for available plans into the frontend cards.
- **Root Cause / Task**: The backend returns plans with nested `versions` arrays containing `monthlyPrice` and `features` JSON objects, which didn't match the initial flat mapping structure.
- **Changes Made**:
  1. Updated `fetchData` to correctly parse the backend array response.
  2. Extracted the latest plan version from the `versions` array using `reduce` to find the highest `versionNumber`.
  3. Mapped `monthlyPrice` to the UI price string.
  4. Parsed the `features` JSON object and dynamically mapped limits (`customer.limit`, `staff.limit`, `product.limit`, etc.) into beautiful, human-readable feature list arrays.
  5. Correctly bound the checkout `planVersionId` to the latest version's ID.

- **Component / File**: `SubscriptionDashboardScreen.jsx`
- **User Request**: Fix the subscription checkout validation error stating that `planVersionId` is required.
- **Root Cause / Task**: The selected version UUID was incorrectly sent as `planId`, and the request included a client-calculated `amount` instead of the backend-required `billingCycle`.
- **Changes Made**:
  1. Updated the checkout payload to send `customerId`, `planVersionId`, and `billingCycle: 'monthly'` according to the subscription API contract.
  2. Removed `planId` and `amount` from the checkout request so pricing remains controlled by the selected backend plan version.
  3. Made checkout URL handling compatible with both direct and data-wrapped `short_url` responses without changing the existing browser-based Razorpay flow.
- **Status**: Implemented; the edited checkout block passes parsing, while pre-existing screen-wide hook dependency lint errors remain outside this fix.

- **Component / File**: `SubscriptionDashboardScreen.jsx`
- **User Request**: Add a console log for the active subscription plan.
- **Root Cause / Task**: The active-plan API response needed to be visible during local debugging and backend integration verification.
- **Changes Made**: Added a focused `[Subscription] Active plan response:` console log immediately after the subscription status request completes. No UI, checkout, polling, or navigation behavior was changed.
- **Status**: Implemented.

### Date: 2026-09-05 (Saturday)
- **Component / File**: `SubscriptionDashboardScreen.jsx`
- **User Request**: Synchronize the subscription UI with the current API payload and ensure polling runs only after a successful Razorpay payment.
- **Root Cause / Task**: A `pending_payment` subscription was incorrectly labelled as active, plan actions did not reflect pending/current states, and verification polling had no maximum duration once started.
- **Changes Made**:
  1. Added backend-status-driven subscription presentation for active, trial, pending/activating, past-due, and other states with matching labels and colors.
  2. Corrected plan feature mapping for `reports.analytics`, route limits, one-time orders, and WhatsApp reminders; also synchronized plan descriptions and the rupee symbol.
  3. Updated plan actions to show Current Plan, Retry Payment, Choose Free Plan, or Buy Now as appropriate and prevent repurchasing an already active plan.
  4. Replaced generic waiting state with a payment-success verification object that is created only after Razorpay returns valid payment and subscription IDs.
  5. Added guarded 3-second verification checks capped at 12 attempts, with cleanup on activation, terminal failure, timeout, navigation/unmount, or checkout failure.
  6. Updated the verification banner to describe in-app plan activation instead of the obsolete browser flow.
  7. Matched verification responses against the Razorpay subscription ID returned by the successful checkout so an older active subscription cannot produce a false success state.
- **Status**: Implemented and statically verified.

### Date: 2026-09-05 (Saturday)
- **Component / File**: `SubscriptionDashboardScreen.jsx`
- **User Request**: Fix UPI and Netbanking not appearing in Razorpay Subscription Checkout even though payment methods are enabled.
- **Root Cause / Task**: The app supplied a custom Checkout display block containing normal UPI/Netbanking instruments. Subscription authorisation uses the `subscription_id` to resolve eligible recurring instruments such as UPI Autopay and eMandate, so client-side display filtering can prevent Razorpay from presenting the correct account-enabled methods.
- **Changes Made**:
  1. Removed the custom payment-method display block from native Checkout.
  2. Kept the official Subscription Checkout inputs (`key` and `subscription_id`) so Razorpay can automatically render every eligible recurring method configured for the account.
  3. Updated diagnostics to show that checkout is in subscription mode and payment methods are controlled by Razorpay account defaults.
- **External Note**: Standard Payment Gateway method enablement and Subscription recurring-method enablement are separate. If a method remains absent, UPI Autopay/eMandate access must be enabled for this exact test-mode account by Razorpay.
- **Status**: Client-side filtering removed and statically verified.

### Date: 2026-09-07 (Monday)
- **Component / File**: `SubscriptionDashboardScreen.jsx`
- **User Request**: After Razorpay payment succeeds and closes, show an attractive animated activation modal while subscription polling runs, then return to the updated plan screen.
- **Root Cause / Task**: Payment activation was represented by a small card inside the plan list, which did not clearly separate successful payment authorization from backend plan activation.
- **Changes Made**:
  1. Replaced the in-page verification banner with a centered blocking modal that appears only after Razorpay returns valid payment and subscription IDs.
  2. Added a pulsing activation core, rotating status orbit, branded secure-payment label, and the message “Sit back & relax” while polling continues.
  3. Added a dedicated animated success state with “You're all set!” once the expected subscription becomes active.
  4. Automatically closes the success modal after 1.8 seconds, revealing the refreshed active-plan screen.
  5. Kept existing bounded polling behavior and closes the modal correctly on terminal failure, timeout, checkout error, or component unmount.
- **Status**: Initial animated-modal implementation was superseded by the Fabric crash-safety fix below.

### Date: 2026-09-07 (Monday)
- **Component / File**: `SubscriptionDashboardScreen.jsx`
- **User Request**: Fix the app closing when the post-payment activation modal opens.
- **Root Cause / Task**: Android's stored crash report showed a React Native Fabric `SurfaceMountingManager.overridePropsReadableMap` assertion while custom native-driven animated props were updating in a newly opened native `Modal` immediately after the Razorpay Activity closed.
- **Changes Made**:
  1. Replaced the separate native `Modal` surface with a full-screen, high-elevation overlay rendered safely inside the subscription screen.
  2. Removed custom continuously updated `Animated.View` transform/opacity props from the payment-return transition.
  3. Preserved an attractive animated experience with the platform-native loading indicator, decorative secure-payment card, activation copy, and success state.
  4. Preserved payment-success-only polling, bounded retries, failure handling, automatic success dismissal, and refreshed plan data.
- **Status**: Crash path removed and the updated screen passes ESLint.

### Date: 2026-09-07 (Monday)
- **Component / File**: `SubscriptionDashboardScreen.jsx`
- **User Request**: Fix post-checkout activation polling so the newly purchased plan replaces the previously active plan after Razorpay closes.
- **Root Cause / Task**: Checkout returned the new local subscription UUID, but the screen discarded it and polled only the customer-level status endpoint. That endpoint can continue returning the previous active subscription while the replacement is pending, leaving the UI on stale plan data.
- **Changes Made**:
  1. Preserved the checkout-created local subscription UUID and plan-version ID in the payment-verification state.
  2. Made each post-payment check query both the customer status and the exact purchased subscription's payment/details endpoint.
  3. Added strict local/Razorpay subscription-ID matching so an older active plan is never accepted as the completed purchase.
  4. Immediately shows the newly purchased plan as payment pending after Razorpay succeeds, then replaces it with the exact backend record when activation completes.
  5. Replaced overlapping interval polling with serial timeout-based checks, retaining the existing bounded retry, success, failure, and cleanup behavior.
- **Status**: Implemented and verified with ESLint.
### Date: 2026-09-08 (Tuesday)
- **Component / File**: `Screens/Main/SubscriptionDashboardScreen.jsx`, `i18n/index.js`
- **User Request**: Replace the raw Razorpay payment-error toast with an attractive, interactive modal that offers support contact details and a direct retry action.
- **Root Cause**: Checkout failures were passed directly to the global error toast, exposing technical Razorpay error metadata to users and providing no recovery action.
- **Changes Made**:
  1. Replaced checkout-failure toasts with a dedicated payment-help modal and kept technical error details only in console logs.
  2. Added a direct Retry Again action that reopens checkout for the selected plan.
  3. Added the Compunic support number (`+91 90097 90111`) with a tap-to-call action.
  4. Added complete English and Hindi translations for all new modal content.
- **Status**: Implemented.

### Date: 2026-09-07 (Monday)
- **Component / File**: `android/app/src/main/AndroidManifest.xml`, `android/app/src/main/res/values/styles.xml`
- **User Request**: Remove the visible bottom gap when the native Razorpay checkout opens.
- **Root Cause / Task**: Razorpay's translucent checkout activity did not provide an opaque navigation-bar surface, allowing a gap to remain visible below the checkout on Android.
- **Changes Made**: Added a Razorpay-checkout-only Android theme that paints the bottom system navigation area white, uses matching dark navigation icons, and disables the translucent/contrast scrim for that area; assigned it only to `CheckoutActivity`.
- **Status**: Implemented without changing checkout logic or any other screen; Android debug manifest and resource processing passed.

### Date: 2026-09-07 (Monday)
- **Component / File**: `RootNavigator.jsx`, `SubscriptionDashboardScreen.jsx`
- **User Request**: Reload the correct current-plan data after an expired-plan alert sends the user to View Plans.
- **Root Cause / Task**: The subscription dashboard fetched its APIs only on first mount, so navigating back to an already-mounted billing route could retain stale plan information.
- **Changes Made**: The global View Plans action now sends a refresh signal, and the subscription dashboard reloads both subscription status and available plans whenever it receives focus or a new refresh signal.
- **Status**: Implemented without changing checkout or subscription business logic; both edited source files pass ESLint with no errors.

### Date: 2026-09-07 (Monday)
- **Component / File**: `android/app/src/main/res/values/styles.xml`
- **User Request**: Fully remove the bottom strip still visible beneath the rounded Razorpay checkout.
- **Root Cause / Task**: Razorpay's checkout activity remained a translucent window, so the underlying app was visible outside the SDK's rounded checkout surface even after styling the navigation bar.
- **Changes Made**: Made only the Razorpay checkout activity theme non-floating and opaque with a white full-window background, while retaining its matching navigation-bar treatment.
- **Status**: Implemented without changing Razorpay checkout behavior or any React Native screen; Android debug resource processing passed.

### Date: 2026-09-07 (Monday)
- **Component / File**: `EntitlementContext.jsx`, `subscriptionEntitlements.js`, `api.js`, `RootNavigator.jsx`, `CustomDrawerContent.jsx`, `MainTabs.jsx`, `HomeScreen.jsx`, customer/product/route/subscription/staff/invoice/one-time-order list screens, `SubscriptionDashboardScreen.jsx`
- **User Request**: Add proactive subscription entitlement checks with visible locks, and add relevant icons to every hamburger drawer tab.
- **Root Cause / Task**: Feature access was checked only after protected APIs failed, entitlement results were not cached or reflected in navigation UI, and drawer rows had text without identifying icons.
- **Changes Made**:
  1. Added a centralized entitlement-key catalog and provider with five-minute caching, in-flight request deduplication, login/app-resume refresh, manual invalidation, and fail-open handling for ordinary network failures.
  2. Preloads supported feature entitlements without opening background popups; an explicit denied result now shows the existing localized upgrade modal only when the user presses the locked feature.
  3. Connected entitlement guards and amber lock indicators to protected drawer destinations, bottom tabs, Home quick actions/stat cards, and primary Add/Generate actions in the relevant list screens.
  4. Refreshes cached entitlements after plan activation/cancellation and invalidates them when the backend reports a plan limit or expired subscription.
  5. Added a relevant Lucide icon and styled icon container to every hamburger-menu entry, including Home, deliveries, routes, customers, invoices, subscriptions, products, staff, reports, billing, settings, and logout.
- **Status**: Implemented; allowed actions keep their existing navigation/functionality, denied actions stop before the protected flow, and all edited files pass the targeted ESLint validation with no new errors.

### Date: 2026-09-07 (Monday)
- **Component / File**: `api.js`, `EntitlementContext.jsx`, `RootNavigator.jsx`, `CustomDrawerContent.jsx`
- **User Request**: Fix missing entitlement lock indicators when the backend rejects protected access with HTTP 409.
- **Root Cause / Task**: The global 409 handler invalidated and removed entitlement state, and entity drawer rows observed only management keys rather than their related numeric-limit keys.
- **Changes Made**:
  1. Added 409 metadata to the global subscription-limit notification.
  2. A feature-specific 409 now records that exact entitlement as denied instead of clearing it.
  3. An expired subscription/trial or keyless subscription 409 marks all protected entitlements as denied so locks appear immediately.
  4. Customer, product, staff, and route drawer rows now display a lock when either their management entitlement or corresponding plan-limit entitlement is denied.
- **Status**: Implemented while keeping list access available when only an Add limit has been reached; the 409/lock-state integration passes targeted ESLint validation.

### Date: 2026-09-07 (Monday)
- **Component / File**: `RootNavigator.jsx`
- **User Request**: Remove Cancel from the subscription-limit modal and keep only View Plans.
- **Changes Made**: Removed only the Cancel action from the global subscription warning dialog; View Plans remains the sole action and all other alert variants are unchanged.
- **Status**: Implemented.

### Date: 2026-09-07 (Monday)
- **Component / File**: `i18n/index.js`
- **User Request**: Change the subscription modal button text from View Plans to Update Plan.
- **Changes Made**: Updated the existing localized action label to “Update Plan” in English and “प्लान अपडेट करें” in Hindi; navigation behavior remains unchanged.
- **Status**: Implemented.

### Date: 2026-09-07 (Monday)
- **Component / File**: `SubscriptionDashboardScreen.jsx`, `i18n/index.js`
- **User Request**: Add subscription cancellation, payment history/summary, monthly/annual billing selection, and a View Summary action on the active subscription card.
- **Root Cause / Task**: The billing screen supported plan checkout and activation only; management helpers existed but cancellation and payment history had no user-facing controls, and checkout was fixed to monthly billing.
- **Changes Made**:
  1. Added a Monthly/Annual segmented selector that updates displayed plan pricing and sends the selected `billingCycle` to checkout.
  2. Added a right-aligned View Summary action to the active subscription card.
  3. Added a localized payment summary overlay with total paid, successful-payment count, payment status/date/ID rows, loading, empty, retry, close, and Android back-button handling.
  4. Added a cancel-subscription action with confirmation, loading protection, `cancelAtPeriodEnd: true`, success/failure feedback, data refresh, and a cancellation-scheduled indicator.
  5. Added matching English and Hindi strings for all new billing, payment-history, and cancellation UI.
- **Status**: Implemented and verified with ESLint; all subscription dashboard translation keys exist in both English and Hindi.

### Date: 2026-09-07 (Monday)
- **Component / File**: `SubscriptionDashboardScreen.jsx`
- **User Request**: Keep the Current Plan card above all other cards on the Subscription & Billing screen.
- **Changes Made**: Reordered the rendered plan list so the matched current plan is always first while preserving backend order for all remaining plans; fallback current-plan behavior and checkout functionality remain unchanged.
- **Status**: Implemented and verified with ESLint.

### Date: 2026-09-07 (Monday)
- **Component / File**: `SubscriptionDashboardScreen.jsx`
- **User Request**: Increase the active-plan polling modal duration to 21 attempts.
- **Changes Made**: Increased post-payment activation polling from 12 to 21 attempts while retaining the existing 3-second interval, success handling, timeout handling, and cleanup behavior. The maximum polling window is now approximately 63 seconds.
- **Status**: Implemented and verified with ESLint.

### Date: 2026-09-07 (Monday)
- **Component / File**: `SubscriptionDashboardScreen.jsx`, `RootNavigator.jsx`, `CustomDrawerContent.jsx`, `MainDrawer.jsx`, `i18n/index.js`
- **User Request**: Add complete Hindi i18n support for the subscription activation modal and related subscription/billing UI.
- **Root Cause / Task**: Subscription billing, payment verification, plan-limit alerts, plan actions, feature labels, and navigation entries used hardcoded English strings and did not react consistently to the selected app language.
- **Changes Made**:
  1. Added matching English and Hindi `subscriptionBilling` translation resources for subscription statuses, actions, feature limits, payment messages, activation states, and plan-limit prompts.
  2. Connected the subscription dashboard header, cards, status details, action buttons, localized dates, checkout messages, and activation overlay to `react-i18next`.
  3. Localized built-in Free, Free Trial, Basic, and fallback plan names while preserving custom backend-defined plan names.
  4. Localized the global subscription-limit popup, including Hindi-friendly feature-lock/limit messages and translated actions.
  5. Localized the subscription/billing entry in both the custom drawer and drawer navigator configuration.
- **Status**: Implemented and verified with ESLint (no errors; existing unrelated warnings remain).

### Date: 2026-09-07 (Monday)
- **Component / File**: `RootNavigator.jsx`, `AlertContext.jsx`, `i18n/index.js`
- **User Request**: Make subscription-limit errors readable across every screen and redesign the global subscription popup as an attractive warning modal.
- **Root Cause / Task**: The global alert displayed raw backend entitlement keys such as `route.management` and used the same plain white dialog as ordinary confirmations, including verbose backend trial text.
- **Changes Made**:
  1. Added centralized mappings for all supported subscription feature and limit keys, converting technical API keys into readable English and Hindi feature names.
  2. Rebuilt limit/locked messages from i18n templates so raw keys and malformed backend trial-expiry text are no longer shown to users.
  3. Added a subscription-only warning variant to the global popup with an amber warning accent, icon, access-required badge, explanatory upgrade panel, larger rounded layout, and prominent View Plans action.
  4. Kept the styling and behavior of all non-subscription confirmation dialogs unchanged.
- **Status**: Implemented and verified with ESLint (no errors; one pre-existing RootNavigator inline-style warning remains).

### Date: 2026-09-07 (Monday)
- **Component / File**: `AlertContext.jsx`
- **User Request**: Prevent the subscription upgrade information text from overlapping the Cancel and View Plans buttons.
- **Root Cause / Task**: The subscription dialog content inherited a flexible layout from the generic popup, allowing longer localized information text to consume space reserved for the fixed-height action row.
- **Changes Made**: Made the subscription content section size to its actual text, added bottom separation, and gave the action row its own larger minimum height and vertical padding so English and Hindi copy remain fully above the buttons.
- **Status**: Implemented and verified with ESLint.

### Date: 2026-09-07 (Monday)
- **Component / File**: `SubscriptionDashboardScreen.jsx`
- **User Request**: Keep the activated plan and Current Plan action synchronized when the available-plans API fails or returns a different plan-version shape.
- **Root Cause / Task**: Current-plan detection compared only the subscription's top-level `planVersionId` with the displayed version ID. Nested version IDs, base plan IDs, configured active versions, and temporary plan-catalog failures were not handled, so the purchased plan could be active without its card showing Current Plan.
- **Changes Made**:
  1. Normalized plan-list responses and subscription plan/version IDs across supported direct and nested response shapes.
  2. Made catalog mapping prefer the backend's configured active plan version before falling back to the newest version.
  3. Matched Current Plan by either exact plan-version ID or base plan ID.
  4. Preserved existing plan cards if the catalog refresh fails and added a fallback current-plan card from subscription details when the active plan is missing from the catalog.
  5. Refreshes the plan catalog after successful activation without allowing a stale customer-status response to overwrite the newly activated subscription.
- **Status**: Implemented and verified with ESLint.

### Date: 2026-09-08 (Tuesday)
- **Component / File**: `i18n/index.js`, `i18n/locales/en.js`, `i18n/locales/hi.js`
- **User Request**: Separate the English and Hindi i18n content into individual files without changing application behavior.
- **Root Cause / Task**: Both language dictionaries and the i18next initialization were maintained in one large file, making translation updates difficult to navigate and review.
- **Changes Made**:
  1. Moved the complete English dictionary into `i18n/locales/en.js`.
  2. Moved the complete Hindi dictionary into `i18n/locales/hi.js`.
  3. Reduced `i18n/index.js` to language-module registration, saved-language loading, and i18next initialization.
  4. Preserved all translation keys, values, language persistence, fallback language, and interpolation behavior.
- **Status**: Implemented and verified with ESLint, matching 663 English/Hindi leaf keys, and UTF-8 Hindi validation.

### Date: 2026-09-08 (Tuesday)
- **Component / File**: `i18n/index.js`
- **User Request**: Fix locale imports failing to resolve after separating the language files.
- **Root Cause**: Metro retained a stale file-map snapshot after the new locale directory was created and continued reporting the Hindi module as missing. Extensionless paths made the stale resolution error less explicit.
- **Changes Made**: Added explicit `.js` extensions to both locale imports and updated both new locale files so Metro receives direct watcher events, without changing translations or i18n behavior.
- **Status**: Implemented and verified.

### Date: 2026-09-09 (Wednesday)
- **Component / File**: `AddSubscriptionScreen.jsx`
- **User Request**: Allow the product to be changed while editing a customer subscription.
- **Root Cause / Task**: The edit form already loaded products through the product-list API and submitted `productId` through the subscription PATCH API, but the product selector was explicitly disabled in edit mode.
- **Changes Made**:
  1. Enabled the product selector in both create and edit modes.
  2. Reused the existing searchable product-list modal and product API data.
  3. Preserved the fixed customer behavior and existing subscription update flow; the selected product ID is sent through `PATCH /subscriptions/{id}`.
- **Status**: Implemented; no unrelated functionality changed.

### Date: 2026-09-09 (Wednesday)
- **Component / File**: Complete `src` tree, `App.jsx`, navigation, Jest configuration, and import verification tooling
- **User Request**: Refactor the project into module-based folders, update every affected import, and test for import problems.
- **Root Cause / Task**: Screens and supporting code were grouped mainly by file type (`Screens/Main`, `components`, `context`, and one shared service folder), which mixed unrelated business domains and made ownership difficult to identify.
- **Changes Made**:
  1. Reorganized the source into `app`, `features`, and `shared` ownership areas without changing route names, API contracts, screen logic, or user-facing behavior.
  2. Created 14 feature modules: auth, dashboard, customers, deliveries, delivery subscriptions, invoices, one-time orders, payments, plan billing, products, reports, routes, settings, and staff.
  3. Moved navigation/providers/startup UI into `app`, and reusable components/constants/assets/i18n/services/utilities into `shared`.
  4. Moved feature-specific modals and report components into their owning feature modules.
  5. Added public `index.js` entry points for every feature and updated app navigation to import through those module boundaries.
  6. Rewrote all affected relative imports and the root i18n bootstrap path.
  7. Added `npm run check:imports` with `scripts/verifyRelativeImports.cjs` to detect unresolved local imports, exports, dynamic imports, and requires.
  8. Restored the React Native Jest smoke-test setup by installing the matching `@react-native/jest-preset`, supporting `.jsx`/ESM dependencies, and isolating native-only libraries with test mocks.
  9. Added `src/README.md` documenting module ownership and validation expectations.
- **Validation**:
  - Relative import verification passed across the reorganized source tree.
  - Android production Metro bundle completed successfully and copied all assets.
  - Jest application render smoke test passed.
  - Refactored source parsing passed; the repository still contains 39 pre-existing strict-lint findings unrelated to the folder migration.
- **Status**: Implemented with application functionality preserved.

### Date: 2026-09-09 (Wednesday)
- **Component / File**: Workspace cleanup, Android generated outputs, and `scripts/generateIndianLocales.cjs`
- **User Request**: Remove unwanted files and folders without removing application functionality.
- **Root Cause / Task**: The completed module migration left an obsolete one-time locale generator tied to the old `src/i18n` path, empty legacy directories, and several gigabytes of reproducible Android build/cache output.
- **Changes Made**:
  1. Removed the obsolete locale-generation script; completed locale dictionaries remain in `src/shared/i18n/locales`.
  2. Removed empty legacy/refactor directories and generated Android Gradle, Kotlin, CMake, debug-build, and intermediate output folders.
  3. Preserved all application source, runtime dependencies, configuration, documentation, root assets, and the completed release AAB.
- **Status**: Cleanup completed without changing application behavior.

### Date: 2026-09-09 (Wednesday)
- **Component / File**: `workflow.md`, `scripts/updateProjectStructure.cjs`, `package.json`, and `.agents/AGENTS.md`
- **User Request**: Add the complete latest Camper project structure with deep, Excel-ready detail and keep it synchronized automatically as the project changes.
- **Root Cause / Task**: The workflow contained chronological change history but did not provide a normalized current-state inventory suitable for generating architecture and tracking worksheets. Its automation rule also referenced the obsolete `C:\Camper\Frontend\src` path.
- **Changes Made**:
  1. Added generated Section 12 with project totals, Excel worksheet mapping, architecture boundaries, all 14 feature modules, directory ownership, navigation routes, central API operations, supported locales, dependency versions, and a row-by-row maintained-file inventory.
  2. Added `npm run docs:structure` to regenerate Section 12 directly from the current filesystem and source metadata.
  3. Updated `npm run check:imports` to refresh the project structure before validating relative imports.
  4. Updated repository maintenance rules to use the current `C:\Camper` path, require dated Section 10 entries, regenerate Section 12 after structural changes, and protect the generated marker block from manual edits.
  5. Excluded vendor dependencies and reproducible build/cache output from maintained-source reporting while documenting the release AAB separately as a deliverable.
- **Validation**: Generator syntax, repeatable generation, inventory counts, relative imports, Jest smoke tests, and Markdown diff formatting checked.
- **Status**: Implemented without changing application runtime behavior.

### Date: 2026-09-09 (Wednesday)
- **Component / File**: `SubscriptionDetailScreen.jsx`
- **User Request**: Show the subscription product price below the product name instead of inside brackets on the same line.
- **Changes Made**:
  1. Kept the product name as the primary hero-card line.
  2. Moved price and optional unit information to a separate secondary line with generic supporting-text styling.
  3. Preserved subscription data, status, navigation, and all existing actions.
- **Status**: Implemented as a presentation-only update.

### Date: 2026-09-09 (Wednesday)
- **Component / File**: `SubscriptionDetailScreen.jsx`
- **User Request**: Reduce the product-name weight to 550 and make the price line lighter in the subscription details hero card.
- **Changes Made**: Changed the product name to `Rubik-Medium` with weight 550 and the price/unit line to `Rubik-Regular` with weight 400. Layout, values, and functionality remain unchanged.
- **Status**: Implemented as a typography-only update.

### Date: 2026-09-09 (Wednesday)
- **Component / File**: `SubscriptionDetailScreen.jsx`
- **User Request**: Make typography lighter throughout the complete Subscription Detail screen.
- **Changes Made**:
  1. Reduced heavy bold headings, status text, detail values, modal titles, and action labels to medium weights.
  2. Reduced supporting labels, history text, date values, pill text, metadata, loading, and error copy to regular weights.
  3. Retained a clear visual hierarchy with 550-weight primary headings and lighter 400/500-weight supporting text.
  4. Preserved all screen layout, data, navigation, modals, subscription actions, and API behavior.
- **Status**: Implemented as a screen-scoped typography update.

### Date: 2026-09-09 (Wednesday)
- **Component / File**: `AddSubscriptionScreen.jsx` subscription edit-success navigation
- **User Request**: After editing a subscription that the backend replaces with a new record, open the Subscription Detail screen using the new subscription ID.
- **Root Cause**: The update API can return a replacement subscription with a new ID, while the frontend previously called `goBack()` and caused the existing detail screen to refetch the old, replaced ID.
- **Changes Made**:
  1. Read the updated subscription and its ID from the successful update response.
  2. Used stack `popTo` to return to the existing `SubscriptionDetail` route while replacing its route parameters with the new ID and response data.
  3. Retained a safe fallback to the original ID if an update response does not contain a replacement ID.
  4. Preserved create-subscription navigation and all API payload behavior.
- **Status**: Implemented; the detail screen now refreshes against the new subscription record after edit.

### Date: 2026-09-09 (Wednesday)
- **Component / File**: `src/shared/services/api.js`, `src/shared/services/api/*`, API surface tests, source documentation, and project-structure generator
- **User Request**: Split the monolithic API service into professional domain modules without changing any API, endpoint, payload, response handling, screen import, or functionality.
- **Root Cause / Task**: Authentication/refresh behavior, shared HTTP helpers, and 83 public domain methods were maintained in one service file, making API ownership and safe maintenance difficult.
- **Changes Made**:
  1. Preserved `src/shared/services/api.js` as the compatibility facade, so all existing screen and provider imports remain unchanged.
  2. Extracted the base URL, vendor/staff role prefix, authenticated fetch, token-refresh queue, 403/409 entitlement handling, logging, and HTTP/multipart helpers into `api/client.js`.
  3. Split the unchanged public methods into auth, profile, staff, products, routes, customers, delivery subscriptions, deliveries, one-time orders, dashboard, invoices, accounting, reports, and plan-billing modules.
  4. Added `api/index.js` to compose the same 83 unique methods behind the original `api.someMethod()` interface.
  5. Kept all URL templates, HTTP methods, function parameters, camelCase payloads/query fields, response/error behavior, subscription logs, invoice PDF handling, and callback exports unchanged.
  6. Added an API-surface regression test covering every public method plus authentication/entitlement lifecycle exports.
  7. Updated the generated workflow inventory to discover domain API operations and their owning source files.
- **Validation**: Public method parity, relative imports, Jest tests, generator output, and Android Metro bundling checked.
- **Status**: Implemented as an internal organization refactor with no API contract or application behavior change.

### Date: 2026-09-09 (Wednesday)
- **Component / File**: `LanguageSelector.jsx`
- **User Request**: Show immediate loading feedback when a language option is pressed so users do not need to tap it repeatedly.
- **Root Cause**: The selector modal closed before the asynchronous i18next and AsyncStorage operations completed, leaving no visible confirmation that the first tap was being processed.
- **Changes Made**:
  1. Kept the selector visible during language activation and displayed a spinner on the pressed language option.
  2. Disabled every language option and modal dismissal while the switch is in progress, preventing duplicate taps and overlapping language changes.
  3. Closed the selector only after language activation and persistence finish.
  4. Added busy, disabled, and selected accessibility state without changing supported languages or persistence behavior.
- **Status**: Implemented in the shared selector used by both Login and Settings screens.

### Date: 2026-09-09 (Wednesday)
- **Component / File**: `LanguageSelector.jsx` pressed-language feedback
- **User Request**: Make the exact language card that was tapped visibly confirm the click and show that processing is underway.
- **Changes Made**:
  1. Replaced the tapped card's normal contents with a centered spinner and localized `common.loading` message during language activation.
  2. Added a stronger highlighted background and border to the processing card while keeping other options faded and disabled.
  3. Preserved the existing asynchronous language change, persistence, modal lifecycle, and duplicate-tap protection.
- **Status**: Implemented as clearer in-place interaction feedback on Login and Settings language selectors.

### Date: 2026-09-10 (Thursday)
- **Component / File**: `CompleteRegistrationScreen.jsx` registration-completion state
- **User Request**: Replace the completed registration form with a simple loader until login/navigation finishes, preventing another registration submission.
- **Root Cause**: The previous success flow scheduled login after one second but immediately cleared `loading` in `finally`, re-enabling the Complete Registration button while the form was still visible.
- **Changes Made**:
  1. Added an immediate ref-based submission lock to reject rapid duplicate taps before React state updates.
  2. Switched the entire form to a centered full-screen activity loader as soon as registration succeeds.
  3. Kept the loader and submission lock active through the existing login/navigation delay.
  4. Restored the form and unlocked submission only when registration fails; request fields, API payload, and successful login behavior remain unchanged.
- **Status**: Implemented without changing the registration API contract.

### Date: 2026-09-10 (Thursday)
- **Component / File**: `UnbilledDeliveriesScreen.jsx` pending-to-be-invoiced customer list
- **User Request**: Add search to the Pending to Be Invoiced page.
- **Root Cause / Task**: The screen listed every customer with uninvoiced deliveries but offered no quick way to locate a specific customer.
- **Changes Made**:
  1. Added a localized search field above the pending-invoice cards.
  2. Added immediate client-side filtering by customer name or phone number without changing the summary API request.
  3. Added a localized empty-search result while preserving initial loading, true empty-state, pull-to-refresh, date selection, and invoice generation behavior.
- **Status**: Implemented without changing invoice data or API behavior.

### Date: 2026-09-10 (Thursday)
- **Component / File**: `UnbilledDeliveriesScreen.jsx`, shared locale dictionaries
- **User Request**: Make the upper customer/total area open Customer Details and show a coming-soon alert when the lower information area is tapped.
- **Root Cause / Task**: Pending-invoice cards did not provide card-section navigation or feedback for the planned lower-section action.
- **Changes Made**:
  1. Made the card header independently tappable and routed it to `CustomerDetail` using the card's existing `customerId`.
  2. Made the lower delivery/date information panel show the global modal with a localized Functionality Coming Soon message.
  3. Preserved nested date-picker controls, invoice generation, search, and API behavior.
  4. Added Coming Soon dialog translations for English, Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati, and Punjabi.
- **Status**: Implemented with no API changes.

### Date: 2026-09-10 (Thursday)
- **Component / File**: `InvoiceDetailScreen.jsx`, `InvoiceListScreen.jsx`, `GenerateInvoiceScreen.jsx`
- **User Request**: Show the amount due in the invoice total area and correct the response-field mismatches identified in Invoice Details.
- **Root Cause / Task**: Invoice Details treated `totalAmount` as current charges, recalculated authoritative backend totals, displayed grand total when balance due was zero, and depended on older uppercase/nested response fields.
- **Changes Made**:
  1. Mapped Current Charges, Grand Total, Amount Paid, and Balance Due to their dedicated backend fields with backward-compatible numeric fallbacks in both invoice details and invoice-list summaries.
  2. Changed the highlighted final row in both the app preview and locally generated PDF to always display Balance Due, including zero for paid invoices.
  3. Added support for `invoiceId`, lowercase `deliveries`/`lineItems`, and lowercase `customerId` across loading, invoice navigation, document actions, and payment navigation.
  4. Made invoice-list and generated-invoice navigation accept either `id` or `invoiceId`, and made invoice-list customer rendering/search accept direct `customerName` responses.
  5. Derived the actual product name from descriptions when the API supplies a generic `Delivery` name and normalized duplicated quantity text such as `1 1 Ltr(s)`.
- **Status**: Implemented without modifying API endpoints or payloads.

### Date: 2026-09-10 (Thursday)
- **Component / File**: `InvoiceDetailScreen.jsx`, `InvoiceListScreen.jsx`
- **User Request**: Present advance balances using a clear positive credit amount instead of a negative currency value.
- **Root Cause / Task**: Advance credit is stored as a negative `previousDues` value for arithmetic, and the UI rendered that signed value directly as confusing negative currency.
- **Changes Made**:
  1. Preserved the signed backend value for invoice calculations while converting only the displayed advance amount to its absolute positive value.
  2. Kept the explicit `Advance Credit` label and green credit styling in the invoice preview and totals summary.
  3. Added the advance-credit row to the locally generated invoice PDF and applied the same positive display convention.
  4. Updated invoice-list cards to show both previous dues and advance credits explicitly, with advance credit displayed positively in green.
- **Status**: Implemented without changing financial calculations or API data.

### Date: 2026-09-10 (Thursday)
- **Component / File**: `InvoiceDetailScreen.jsx`, `InvoiceAdjustmentModal.jsx`, `invoicesApi.js`, invoice locale dictionaries, `apiSurface.test.js`
- **User Request**: Add top-level Add Discount and Add Extra Charge buttons first, with a working adjustment-entry modal, before deciding how adjustments will be displayed in Invoice Details.
- **Root Cause / Task**: The new backend adjustment endpoint had no frontend API helper or invoice-detail entry flow.
- **Changes Made**:
  1. Added two prominent actions at the top of Invoice Details for Add Discount and Add Extra Charge, hidden for paid invoices and staff users.
  2. Created a reusable adjustment modal with preselected type, positive decimal amount input, required description, 255-character limit, inline validation, keyboard handling, and submission loading protection.
  3. Added the token-aware `addInvoiceAdjustments` API operation using the documented adjustments-array payload.
  4. Added entitlement guarding, backend error mapping, success feedback, and a silent invoice-detail refresh after a successful addition.
  5. Localized the complete add-adjustment flow in English, Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati, and Punjabi.
  6. Extended the API-surface regression test for the new operation; adjustment-list rendering and deletion remain intentionally deferred.
- **Status**: Implemented and verified without changing existing invoice endpoints or payment functionality.

### Date: 2026-09-10 (Thursday)
- **Component / File**: `InvoiceAdjustmentModal.jsx`
- **User Request**: Replace the centered invoice-adjustment popup with the bottom-sheet presentation used by application dropdowns.
- **Root Cause / Task**: The initial modal was centered while existing selector interactions consistently rise from the bottom of the screen.
- **Changes Made**:
  1. Changed the modal transition to slide upward from the bottom.
  2. Converted the card into a full-width bottom sheet with rounded top corners, a drag handle, and bottom safe-area padding.
  3. Added backdrop dismissal while retaining dismissal protection during API submission.
  4. Preserved adjustment validation, localization, loading state, and API behavior.
- **Status**: Implemented as a presentation-only update.

### Date: 2026-09-10 (Thursday)
- **Component / File**: `InvoiceAdjustmentModal.jsx` input focus handling
- **User Request**: Stop the invoice-adjustment bottom sheet from flickering when an input receives focus.
- **Root Cause / Task**: The sheet container claimed the touch responder from its child inputs while Android's `KeyboardAvoidingView` height behavior simultaneously resized the sliding modal.
- **Changes Made**:
  1. Removed the parent responder override so amount and description inputs retain focus normally.
  2. Limited explicit keyboard-avoidance padding to iOS and restored Android's native keyboard/window resizing behavior.
  3. Preserved bottom-sheet animation, backdrop dismissal, validation, and submission behavior.
- **Status**: Fixed without changing adjustment functionality.

### Date: 2026-09-10 (Thursday)
- **Component / File**: `InvoiceDetailScreen.jsx`, `InvoiceAdjustmentActionsSheet.jsx`, invoice locale dictionaries
- **User Request**: Move the Add Discount and Add Extra Charge entry points from the invoice body into a compact lined action on the right side of the curved header.
- **Changes Made**:
  1. Removed the two inline adjustment buttons from the invoice preview body.
  2. Added a white sliders action to the curved header for unpaid invoices viewed by owner users.
  3. Added a localized bottom action sheet containing Add Discount and Add Extra Charge choices.
  4. Kept the existing entitlement check, preselected adjustment form, validation, and adjustment API submission unchanged.
- **Status**: Implemented as a UI-entry-point change only.

### Date: 2026-09-15 (Tuesday)
- **Component / File**: `CustomDrawerContent.jsx` Staff Management entitlement guard
- **User Request**: Keep Staff Management visibly locked and prevent the screen from opening when the staff-limit entitlement is exhausted (`value: 0`).
- **Root Cause / Task**: The drawer displayed a lock using `staff.limit`, but navigation checked only `staff.management`; therefore `staff.management: allowed` still opened the screen while `staff.limit` was locked.
- **Changes Made**:
  1. Added `staff.limit` as a required navigation entitlement specifically for the Staff Management drawer item.
  2. Kept `staff.management` as the primary screen entitlement and preserved the existing staff-limit lock indicator.
  3. Blocked navigation and reused the global subscription-limit modal when either required entitlement is denied.
  4. Left all other drawer items and their navigation rules unchanged.
- **Status**: Fixed without changing backend requests or Staff Management functionality.

### Date: 2026-09-17 (Thursday)
- **Component / File**: `android/app/build.gradle`, `android/app/proguard-rules.pro`, `package.json`, `package-lock.json`
- **User Request**: Enable release minification and resource shrinking, then audit unused native dependencies to reduce the Play Store app size.
- **Root Cause / Task**: Release R8 optimization was disabled, and the project retained unused direct dependencies including an autolinked native worklets-core module.
- **Changes Made**:
  1. Enabled R8 code minification and Android resource shrinking for release builds.
  2. Removed the confirmed-unused direct packages `@expo-google-fonts/geologica`, `@fontsource/geologica`, `@react-native/new-app-screen`, `hermes-parser`, `pngjs`, `react-native-draggable-flatlist`, and `react-native-worklets-core`.
  3. Retained `react-native-device-info` and `react-native-worklets` because the in-app update integration and Reanimated depend on them.
  4. Added a narrow R8 warning suppression for PDFBox's optional Gemalto JPEG 2000 decoder, which is not bundled or used by Camper invoice PDFs.
  5. Verified import resolution, native autolinking, the application smoke test, and a signed optimized release bundle.
- **Status**: Implemented and release-build verified without changing application functionality or API behavior.

<!-- PROJECT_STRUCTURE:START -->
## Section 12: Current Project Structure — Excel-Ready Source of Truth

> This section is generated from the live workspace by `npm run docs:structure`. Do not manually edit content between the project-structure markers. `npm run check:imports` regenerates it before validating imports.

### 12.1 Snapshot Summary

| Metric | Current Value | Meaning |
| --- | --- | --- |
| Application | com.camper.dailybudgetapp | React Native package/application identifier |
| Application version | 0.0.1 | JavaScript package version |
| React Native | 0.86.0 | Runtime framework version |
| React | 19.2.3 | React runtime version |
| Node engine | >= 22.11.0 | Required Node.js version |
| Feature modules | 14 | Business-owned modules under src/features |
| Maintained source files | 116 | Files under src excluding generated output |
| Screens | 37 | Application and feature screen components |
| Component files | 13 | Shared and feature-owned components/modals |
| Registered navigation routes | 43 | Stack, drawer, and tab registrations |
| API client operations | 91 | Methods exposed by the central api object |
| Supported locales | 8 | Per-language translation dictionaries |
| Runtime dependencies | 30 | Production npm packages |
| Development dependencies | 15 | Build and test npm packages |
| Maintained project files | 340 | All inventoried files excluding generated/vendor directories |

### 12.2 Excel Workbook Mapping

| Suggested Worksheet | Source Subsection | Primary Key | Purpose |
| --- | --- | --- | --- |
| Overview | 12.1 Snapshot Summary | Metric | Project totals and technology versions. |
| Modules | 12.4 Feature Module Ownership | Feature Module | Business ownership and public feature surface. |
| Directories | 12.5 Directory Inventory | Directory | Folder hierarchy, counts, and responsibilities. |
| Routes | 12.6 Navigation Route Inventory | Scope + Route Name | Navigation registration and component mapping. |
| API Operations | 12.7 API Client Operation Inventory | Operation + Occurrence | Central API method and HTTP endpoint mapping. |
| Localization | 12.8 Localization Inventory | Locale Code | Supported languages and dictionary locations. |
| Dependencies | 12.9 Dependency Inventory | Scope + Package | Runtime and development package versions. |
| Files | 12.10 Complete Maintained File Inventory | File ID | One normalized row per maintained project file. |
| Activity Log | Section 10 | Date + Component/File | Chronological implementation and bug-fix history. |

### 12.3 Architecture and Dependency Rules

| Layer | Path | Owns | Allowed Dependency Direction |
| --- | --- | --- | --- |
| Application shell | `src/app` | Startup, global providers, navigation composition | May import feature public barrels and shared modules. |
| Feature modules | `src/features/<module>` | Business screens and feature-only components | May import shared modules; cross-feature usage should go through feature index.js public exports. |
| Shared layer | `src/shared` | Reusable components, constants, i18n, API service, utilities, and shared assets | Must not depend on feature screens or app navigation. |
| Native Android | `android` | Gradle, manifest, Kotlin bootstrap, Android resources | Hosts the React Native Android runtime. |
| Native iOS | `ios` | Xcode, CocoaPods, Swift bootstrap, iOS resources/privacy metadata | Hosts the React Native iOS runtime. |
| Root assets | `assets` | Branding, general images, and linkable fonts | Consumed by JavaScript and native asset-linking configuration. |
| Tooling/tests | `scripts, __tests__` | Structure generation, import validation, and smoke tests | May inspect application files but does not ship as application functionality. |

### 12.4 Feature Module Ownership

| Feature Module | Business Responsibility | Screen Count | Screens | Feature Components | Public Exports |
| --- | --- | --- | --- | --- | --- |
| auth | Authentication, onboarding, OTP verification, and vendor registration. | 6 | CompleteRegistrationScreen, LoginScreen, OnboardingScreen1, OnboardingScreen2, OtpVerificationScreen, RegisterScreen | None | CompleteRegistrationScreen, LoginScreen, OnboardingScreen1, OnboardingScreen2, OtpVerificationScreen, RegisterScreen |
| customers | Customer onboarding, listing, profiles, history, and delivery history. | 5 | AddCustomerScreen, CustomerDeliveryHistoryScreen, CustomerDetailScreen, CustomerHistoryScreen, CustomerListScreen | AddCustomerModal | AddCustomerModal, AddCustomerScreen, CustomerDeliveryHistoryScreen, CustomerDetailScreen, CustomerHistoryScreen, CustomerListScreen |
| dashboard | Vendor home dashboard, summaries, quick actions, and today-delivery overview. | 1 | HomeScreen | None | HomeScreen |
| deliveries | Today, past, and unbilled delivery operations and status handling. | 3 | OrdersScreen, PastDeliveriesScreen, UnbilledDeliveriesScreen | None | OrdersScreen, PastDeliveriesScreen, UnbilledDeliveriesScreen |
| delivery-subscriptions | Customer recurring-delivery subscription creation, editing, and detail management. | 3 | AddSubscriptionScreen, SubscriptionDetailScreen, SubscriptionListScreen | None | AddSubscriptionScreen, SubscriptionDetailScreen, SubscriptionListScreen |
| invoices | Invoice generation, invoice listing, invoice detail, preview, and PDF workflows. | 3 | GenerateInvoiceScreen, InvoiceDetailScreen, InvoiceListScreen | InvoiceAdjustmentActionsSheet, InvoiceAdjustmentModal | GenerateInvoiceScreen, InvoiceDetailScreen, InvoiceListScreen |
| one-time-orders | One-time order creation, listing, and fulfilment workflows. | 2 | AddOneTimeOrderScreen, OneTimeOrderListScreen | None | AddOneTimeOrderScreen, OneTimeOrderListScreen |
| payments | Customer payment collection and ledger-facing payment UI. | 1 | PaymentsScreen | None | PaymentsScreen |
| plan-billing | Vendor SaaS plan selection, Razorpay checkout, activation polling, billing history, and cancellation. | 1 | SubscriptionDashboardScreen | None | SubscriptionDashboardScreen |
| products | Product catalog, product creation/editing, details, and product selection UI. | 3 | AddProductScreen, ProductCatalogScreen, ProductDetailScreen | AddProductModal | AddProductModal, AddProductScreen, ProductCatalogScreen, ProductDetailScreen |
| reports | Financial, inventory, operations, and outstanding analytics. | 1 | ReportsScreen | FinancialReport, InventoryReport, OperationsReport, OutstandingReport | FinancialReport, InventoryReport, OperationsReport, OutstandingReport, ReportsScreen |
| routes | Delivery route creation, details, staff assignment, and customer sequencing. | 4 | AddRouteScreen, RouteBuilderScreen, RouteDetailScreen, RouteListScreen | AddRouteModal | AddRouteModal, AddRouteScreen, RouteBuilderScreen, RouteDetailScreen, RouteListScreen |
| settings | Vendor profile, language, account settings, and logout/account actions. | 3 | InvoiceSettingsScreen, ProfileScreen, SettingsScreen | None | InvoiceSettingsScreen, ProfileScreen, SettingsScreen |
| staff | Staff creation, management, assignment visibility, and staff operations. | 2 | AddStaffScreen, StaffManagementScreen | None | AddStaffScreen, StaffManagementScreen |

### 12.5 Directory Inventory

| Directory | Direct Files | Total Descendant Files | Responsibility |
| --- | --- | --- | --- |
| `.agents` | 1 | 1 | Repository-specific agent maintenance instructions. |
| `.bundle` | 1 | 1 | Ruby Bundler configuration used by native iOS tooling. |
| `__tests__` | 7 | 7 | Automated application tests. |
| `android` | 6 | 77 | Android Gradle project and native application configuration. |
| `android/app` | 3 | 69 | Android application module. |
| `android/app/src` | 0 | 66 | src project resources. |
| `android/app/src/main` | 1 | 66 | Android production manifest, Kotlin bootstrap, assets, and resources. |
| `android/app/src/main/assets` | 0 | 34 | assets project resources. |
| `android/app/src/main/assets/custom` | 1 | 1 | custom project resources. |
| `android/app/src/main/assets/fonts` | 33 | 33 | fonts project resources. |
| `android/app/src/main/java` | 0 | 2 | java project resources. |
| `android/app/src/main/java/com` | 0 | 2 | com project resources. |
| `android/app/src/main/java/com/com.camper.dailybudgetapp` | 2 | 2 | com.camper.dailybudgetapp project resources. |
| `android/app/src/main/res` | 0 | 29 | res project resources. |
| `android/app/src/main/res/drawable` | 1 | 1 | drawable project resources. |
| `android/app/src/main/res/mipmap-anydpi-v26` | 1 | 1 | mipmap anydpi v26 project resources. |
| `android/app/src/main/res/mipmap-hdpi` | 5 | 5 | mipmap hdpi project resources. |
| `android/app/src/main/res/mipmap-mdpi` | 5 | 5 | mipmap mdpi project resources. |
| `android/app/src/main/res/mipmap-xhdpi` | 5 | 5 | mipmap xhdpi project resources. |
| `android/app/src/main/res/mipmap-xxhdpi` | 5 | 5 | mipmap xxhdpi project resources. |
| `android/app/src/main/res/mipmap-xxxhdpi` | 5 | 5 | mipmap xxxhdpi project resources. |
| `android/app/src/main/res/values` | 2 | 2 | values project resources. |
| `android/gradle` | 0 | 2 | gradle project resources. |
| `android/gradle/wrapper` | 2 | 2 | wrapper project resources. |
| `assets` | 41 | 75 | Root React Native images, branding files, and linked fonts. |
| `assets/fonts` | 34 | 34 | Source font files linked into native applications. |
| `ios` | 5 | 36 | iOS CocoaPods/Xcode project and native application configuration. |
| `ios/Compunic` | 4 | 27 | Compunic project resources. |
| `ios/Compunic.xcodeproj` | 1 | 2 | Compunic.xcodeproj project resources. |
| `ios/Compunic.xcodeproj/xcshareddata` | 0 | 1 | xcshareddata project resources. |
| `ios/Compunic.xcodeproj/xcshareddata/xcschemes` | 1 | 1 | xcschemes project resources. |
| `ios/Compunic.xcworkspace` | 1 | 2 | Compunic.xcworkspace project resources. |
| `ios/Compunic.xcworkspace/xcuserdata` | 0 | 1 | xcuserdata project resources. |
| `ios/Compunic.xcworkspace/xcuserdata/macbookpro.xcuserdatad` | 1 | 1 | macbookpro.xcuserdatad project resources. |
| `ios/Compunic/Images.xcassets` | 1 | 23 | Images.xcassets project resources. |
| `ios/Compunic/Images.xcassets/AppIcon.appiconset` | 22 | 22 | App Icon.appiconset project resources. |
| `scripts` | 2 | 2 | Repository validation and documentation automation. |
| `src` | 1 | 116 | All JavaScript application source organized by ownership. |
| `src/app` | 0 | 9 | Application composition layer; startup, navigation, and global providers. |
| `src/app/navigation` | 5 | 5 | Navigation containers, stacks, drawer, tabs, and drawer content. |
| `src/app/providers` | 3 | 3 | Global authentication, alert, and subscription-entitlement state. |
| `src/app/screens` | 1 | 1 | Screens owned by application startup rather than a business feature. |
| `src/features` | 0 | 61 | Business modules with feature-owned screens, components, and public barrels. |
| `src/features/auth` | 1 | 7 | Authentication, onboarding, OTP verification, and vendor registration. |
| `src/features/auth/screens` | 6 | 6 | screens owned by the auth feature. |
| `src/features/customers` | 1 | 7 | Customer onboarding, listing, profiles, history, and delivery history. |
| `src/features/customers/components` | 1 | 1 | components owned by the customers feature. |
| `src/features/customers/screens` | 5 | 5 | screens owned by the customers feature. |
| `src/features/dashboard` | 1 | 2 | Vendor home dashboard, summaries, quick actions, and today-delivery overview. |
| `src/features/dashboard/screens` | 1 | 1 | screens owned by the dashboard feature. |
| `src/features/deliveries` | 1 | 4 | Today, past, and unbilled delivery operations and status handling. |
| `src/features/deliveries/screens` | 3 | 3 | screens owned by the deliveries feature. |
| `src/features/delivery-subscriptions` | 1 | 4 | Customer recurring-delivery subscription creation, editing, and detail management. |
| `src/features/delivery-subscriptions/screens` | 3 | 3 | screens owned by the delivery-subscriptions feature. |
| `src/features/invoices` | 1 | 6 | Invoice generation, invoice listing, invoice detail, preview, and PDF workflows. |
| `src/features/invoices/components` | 2 | 2 | components owned by the invoices feature. |
| `src/features/invoices/screens` | 3 | 3 | screens owned by the invoices feature. |
| `src/features/one-time-orders` | 1 | 3 | One-time order creation, listing, and fulfilment workflows. |
| `src/features/one-time-orders/screens` | 2 | 2 | screens owned by the one-time-orders feature. |
| `src/features/payments` | 1 | 2 | Customer payment collection and ledger-facing payment UI. |
| `src/features/payments/screens` | 1 | 1 | screens owned by the payments feature. |
| `src/features/plan-billing` | 1 | 2 | Vendor SaaS plan selection, Razorpay checkout, activation polling, billing history, and cancellation. |
| `src/features/plan-billing/screens` | 1 | 1 | screens owned by the plan-billing feature. |
| `src/features/products` | 1 | 5 | Product catalog, product creation/editing, details, and product selection UI. |
| `src/features/products/components` | 1 | 1 | components owned by the products feature. |
| `src/features/products/screens` | 3 | 3 | screens owned by the products feature. |
| `src/features/reports` | 1 | 6 | Financial, inventory, operations, and outstanding analytics. |
| `src/features/reports/components` | 4 | 4 | components owned by the reports feature. |
| `src/features/reports/screens` | 1 | 1 | screens owned by the reports feature. |
| `src/features/routes` | 1 | 6 | Delivery route creation, details, staff assignment, and customer sequencing. |
| `src/features/routes/components` | 1 | 1 | components owned by the routes feature. |
| `src/features/routes/screens` | 4 | 4 | screens owned by the routes feature. |
| `src/features/settings` | 1 | 4 | Vendor profile, language, account settings, and logout/account actions. |
| `src/features/settings/screens` | 3 | 3 | screens owned by the settings feature. |
| `src/features/staff` | 1 | 3 | Staff creation, management, assignment visibility, and staff operations. |
| `src/features/staff/screens` | 2 | 2 | screens owned by the staff feature. |
| `src/services` | 1 | 1 | services project resources. |
| `src/shared` | 0 | 44 | Reusable code with no single-feature ownership. |
| `src/shared/assets` | 0 | 8 | Assets imported directly by source modules. |
| `src/shared/assets/3d` | 5 | 5 | 3d project resources. |
| `src/shared/assets/images` | 3 | 3 | images project resources. |
| `src/shared/components` | 4 | 4 | Reusable visual and interaction components. |
| `src/shared/constants` | 2 | 2 | Shared design tokens and subscription-entitlement keys. |
| `src/shared/i18n` | 2 | 10 | i18next initialization and language resources. |
| `src/shared/i18n/locales` | 8 | 8 | Per-language translation dictionaries. |
| `src/shared/services` | 1 | 17 | Central authenticated HTTP/API client. |
| `src/shared/services/api` | 16 | 16 | Domain API modules and shared authenticated request infrastructure. |
| `src/shared/utils` | 3 | 3 | Cross-feature utility and seed helpers. |

### 12.6 Navigation Route Inventory

| Navigator Scope | Route Name | Registered Component | Registration File |
| --- | --- | --- | --- |
| Authenticated bottom tabs | Customers | CustomerListScreen | `src/app/navigation/MainTabs.jsx` |
| Authenticated bottom tabs | Deliveries | OrdersScreen | `src/app/navigation/MainTabs.jsx` |
| Authenticated bottom tabs | Home | HomeScreen | `src/app/navigation/MainTabs.jsx` |
| Authenticated bottom tabs | Payments | PaymentsScreen | `src/app/navigation/MainTabs.jsx` |
| Authenticated drawer | InvoiceSettings | InvoiceSettingsScreen | `src/app/navigation/MainDrawer.jsx` |
| Authenticated drawer | MainTabs | MainTabs | `src/app/navigation/MainDrawer.jsx` |
| Authenticated drawer | Settings | SettingsScreen | `src/app/navigation/MainDrawer.jsx` |
| Authenticated drawer | SubscriptionDashboard | SubscriptionDashboardScreen | `src/app/navigation/MainDrawer.jsx` |
| Authenticated drawer | UnbilledDeliveries | UnbilledDeliveriesScreen | `src/app/navigation/MainDrawer.jsx` |
| Public authentication stack | Login | LoginScreen | `src/app/navigation/AuthStack.jsx` |
| Public authentication stack | Onboarding1 | OnboardingScreen1 | `src/app/navigation/AuthStack.jsx` |
| Public authentication stack | Onboarding2 | OnboardingScreen2 | `src/app/navigation/AuthStack.jsx` |
| Public authentication stack | OtpVerification | OtpVerificationScreen | `src/app/navigation/AuthStack.jsx` |
| Public authentication stack | Register | RegisterScreen | `src/app/navigation/AuthStack.jsx` |
| Root authenticated/auth-gated stack | AddCustomer | AddCustomerScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | AddOneTimeOrder | AddOneTimeOrderScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | AddProduct | AddProductScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | AddRoute | AddRouteScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | AddStaff | AddStaffScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | AddSubscription | AddSubscriptionScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | AuthStack | AuthStack | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | CompleteRegistration | CompleteRegistrationScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | CustomerDeliveryHistory | CustomerDeliveryHistoryScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | CustomerDetail | CustomerDetailScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | CustomerHistory | CustomerHistoryScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | CustomerList | CustomerListScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | EditProduct | AddProductScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | GenerateInvoice | GenerateInvoiceScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | InvoiceDetail | InvoiceDetailScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | InvoiceList | InvoiceListScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | MainDrawer | MainDrawer | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | OneTimeOrderList | OneTimeOrderListScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | PastDeliveries | PastDeliveriesScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | ProductCatalog | ProductCatalogScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | ProductDetail | ProductDetailScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | Reports | ReportsScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | RouteBuilder | RouteBuilderScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | RouteDetail | RouteDetailScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | RouteList | RouteListScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | StaffManagement | StaffManagementScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | SubscriptionDashboard | SubscriptionDashboardScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | SubscriptionDetail | SubscriptionDetailScreen | `src/app/navigation/RootNavigator.jsx` |
| Root authenticated/auth-gated stack | SubscriptionList | SubscriptionListScreen | `src/app/navigation/RootNavigator.jsx` |

### 12.7 API Client Operation Inventory

> Endpoints are extracted from the domain modules under `src/shared/services/api`. `Computed at runtime` indicates a custom request or dynamically assembled URL.

| API Operation | Occurrence | HTTP Transport | Endpoint Template | Domain Source |
| --- | --- | --- | --- | --- |
| addBankAccount | 1 | POST | `/api/vendor/bank-accounts` | `src/shared/services/api/invoicesApi.js` |
| addInvoiceAdjustments | 1 | POST | `${getApiPrefix()}/invoices/${encodeURIComponent(invoiceId)}/adjustments` | `src/shared/services/api/invoicesApi.js` |
| addOverride | 1 | POST | `${getApiPrefix()}/subscriptions/${subscriptionId}/overrides` | `src/shared/services/api/deliverySubscriptionsApi.js` |
| addPause | 1 | POST | `${getApiPrefix()}/subscriptions/${subscriptionId}/pauses` | `src/shared/services/api/deliverySubscriptionsApi.js` |
| addStaff | 1 | POST | `${getApiPrefix()}/staff` | `src/shared/services/api/staffApi.js` |
| assignStaff | 1 | POST | `${getApiPrefix()}/routes/${id}/assign-staff` | `src/shared/services/api/routesApi.js` |
| cancelSubscriptionPlan | 1 | DELETE | `/api/subscription_module/customer/subscription/${subscriptionId}` | `src/shared/services/api/planBillingApi.js` |
| changeSubscriptionPlan | 1 | PUT | `/api/subscription_module/customer/subscription/${subscriptionId}/plan` | `src/shared/services/api/planBillingApi.js` |
| checkoutSubscription | 1 | POST | `/api/subscription_module/customer/checkout` | `src/shared/services/api/planBillingApi.js` |
| collectDeposit | 1 | POST | `${getApiPrefix()}/deposits/collect` | `src/shared/services/api/accountingApi.js` |
| completeRegistration | 1 | POST | `/api/auth/complete-registration` | `src/shared/services/api/authApi.js` |
| createCustomer | 1 | POST | `${getApiPrefix()}/customers` | `src/shared/services/api/customersApi.js` |
| createOneTimeOrder | 1 | POST | `${getApiPrefix()}/one-time-orders` | `src/shared/services/api/oneTimeOrdersApi.js` |
| createProduct | 1 | POST multipart | `${getApiPrefix()}/products` | `src/shared/services/api/productsApi.js` |
| createRoute | 1 | POST | `${getApiPrefix()}/routes` | `src/shared/services/api/routesApi.js` |
| createSubscription | 1 | POST | `${getApiPrefix()}/subscriptions` | `src/shared/services/api/deliverySubscriptionsApi.js` |
| deleteAccount | 1 | DELETE | `/api/auth/delete-account` | `src/shared/services/api/authApi.js` |
| deleteBankAccount | 1 | DELETE | `/api/vendor/bank-accounts/${encodeURIComponent(id)}` | `src/shared/services/api/invoicesApi.js` |
| deleteCustomer | 1 | DELETE | `${getApiPrefix()}/customers/${id}` | `src/shared/services/api/customersApi.js` |
| deleteOverride | 1 | DELETE | `${getApiPrefix()}/subscriptions/${subscriptionId}/overrides/${overrideId}` | `src/shared/services/api/deliverySubscriptionsApi.js` |
| deletePause | 1 | DELETE | `${getApiPrefix()}/subscriptions/${subscriptionId}/pauses/${pauseId}` | `src/shared/services/api/deliverySubscriptionsApi.js` |
| deleteProduct | 1 | DELETE | `${getApiPrefix()}/products/${id}` | `src/shared/services/api/productsApi.js` |
| deleteRoute | 1 | DELETE | `${getApiPrefix()}/routes/${id}` | `src/shared/services/api/routesApi.js` |
| deleteStaff | 1 | DELETE | `${getApiPrefix()}/staff/${id}` | `src/shared/services/api/staffApi.js` |
| deleteSubscription | 1 | DELETE | `${getApiPrefix()}/subscriptions/${id}` | `src/shared/services/api/deliverySubscriptionsApi.js` |
| downloadInvoicePDF | 1 | GET | `Computed at runtime` | `src/shared/services/api/invoicesApi.js` |
| endStaffAssignment | 1 | DELETE | `${getApiPrefix()}/routes/${routeId}/assign-staff/${staffRouteId}` | `src/shared/services/api/routesApi.js` |
| fulfillOneTimeOrder | 1 | POST | `${getApiPrefix()}/one-time-orders/${id}/fulfill` | `src/shared/services/api/oneTimeOrdersApi.js` |
| generateDeliveries | 1 | POST | `${getApiPrefix()}/deliveries/generate` | `src/shared/services/api/deliveriesApi.js` |
| generateInvoices | 1 | POST | `${getApiPrefix()}/invoices/generate` | `src/shared/services/api/invoicesApi.js` |
| getAccountStatement | 1 | GET | `${getApiPrefix()}/ledgers/account/${customerId}` | `src/shared/services/api/accountingApi.js` |
| getActivePlans | 1 | GET | `/api/subscription_module/customer/plans` | `src/shared/services/api/planBillingApi.js` |
| getBankAccounts | 1 | GET | `/api/vendor/bank-accounts` | `src/shared/services/api/invoicesApi.js` |
| getCategories | 1 | GET | `/api/public/categories` | `src/shared/services/api/profileApi.js` |
| getCustomer | 1 | GET | `${getApiPrefix()}/customers/${id}` | `src/shared/services/api/customersApi.js` |
| getCustomerActivity | 1 | GET | `${getApiPrefix()}/customers/${customerId}/activity${queryString}` | `src/shared/services/api/customersApi.js` |
| getCustomerDeliveries | 1 | GET | `${getApiPrefix()}/customers/${customerId}/deliveries${queryString}` | `src/shared/services/api/customersApi.js` |
| getCustomerDeliveryHistory | 1 | GET | `${getApiPrefix()}/customers/${customerId}/deliveries${queryString}` | `src/shared/services/api/customersApi.js` |
| getCustomerJarCollections | 1 | GET | `${getApiPrefix()}/customers/${customerId}/jar-collections${queryString}` | `src/shared/services/api/customersApi.js` |
| getDashboardStats | 1 | GET | `${getApiPrefix()}/dashboard` | `src/shared/services/api/dashboardApi.js` |
| getDepositLedger | 1 | GET | `${getApiPrefix()}/deposits/${customerId}` | `src/shared/services/api/accountingApi.js` |
| getFinancialReports | 1 | GET | `${getApiPrefix()}/reports/financials${queryString}` | `src/shared/services/api/reportsApi.js` |
| getInventoryReports | 1 | GET | `${getApiPrefix()}/reports/inventory${queryString}` | `src/shared/services/api/reportsApi.js` |
| getInvoiceById | 1 | GET | `${getApiPrefix()}/invoices/${id}` | `src/shared/services/api/invoicesApi.js` |
| getInvoiceSettings | 1 | GET | `/api/vendor/invoice-settings` | `src/shared/services/api/invoicesApi.js` |
| getOperationsReports | 1 | GET | `${getApiPrefix()}/reports/operations${queryString}` | `src/shared/services/api/reportsApi.js` |
| getOutstandingReports | 1 | GET | `${getApiPrefix()}/reports/outstanding${queryString}` | `src/shared/services/api/reportsApi.js` |
| getProduct | 1 | GET | `${getApiPrefix()}/products/${id}` | `src/shared/services/api/productsApi.js` |
| getRoute | 1 | GET | `${getApiPrefix()}/routes/${id}` | `src/shared/services/api/routesApi.js` |
| getRoutes | 1 | GET | `${getApiPrefix()}/routes` | `src/shared/services/api/routesApi.js` |
| getSubscription | 1 | GET | `${getApiPrefix()}/subscriptions/${id}` | `src/shared/services/api/deliverySubscriptionsApi.js` |
| getSubscriptionPayments | 1 | GET | `/api/subscription_module/customer/subscription/${subscriptionId}/payments` | `src/shared/services/api/planBillingApi.js` |
| getSubscriptionPlan | 1 | GET | `/api/subscription_module/admin/plans/${planId}` | `src/shared/services/api/planBillingApi.js` |
| getSubscriptionStatus | 1 | GET | `/api/subscription_module/customer/subscription/${customerId}` | `src/shared/services/api/planBillingApi.js` |
| getSubscriptionUsage | 1 | GET | `/api/subscription_module/customer/subscription/${customerId}/usage${queryString}` | `src/shared/services/api/planBillingApi.js` |
| getUninvoicedPreSummary | 1 | GET | `${getApiPrefix()}/invoices/pre-summary${queryString}` | `src/shared/services/api/invoicesApi.js` |
| getUninvoicedSummary | 1 | GET | `${getApiPrefix()}/invoices/pre-summary${params}` | `src/shared/services/api/invoicesApi.js` |
| getVendorProfile | 1 | GET | `${getApiPrefix()}/profile` | `src/shared/services/api/profileApi.js` |
| listCustomers | 1 | GET | `${getApiPrefix()}/customers${queryString}` | `src/shared/services/api/customersApi.js` |
| listDeliveries | 1 | GET | `${getApiPrefix()}/deliveries${queryString}` | `src/shared/services/api/deliveriesApi.js` |
| listInvoices | 1 | GET | `${getApiPrefix()}/invoices${queryString}` | `src/shared/services/api/invoicesApi.js` |
| listOneTimeOrders | 1 | GET | `${getApiPrefix()}/one-time-orders` | `src/shared/services/api/oneTimeOrdersApi.js` |
| listOverrides | 1 | GET | `${getApiPrefix()}/subscriptions/${subscriptionId}/overrides` | `src/shared/services/api/deliverySubscriptionsApi.js` |
| listPauses | 1 | GET | `${getApiPrefix()}/subscriptions/${subscriptionId}/pauses` | `src/shared/services/api/deliverySubscriptionsApi.js` |
| listProducts | 1 | GET | `${getApiPrefix()}/products` | `src/shared/services/api/productsApi.js` |
| listRoutes | 1 | GET | `${getApiPrefix()}/routes` | `src/shared/services/api/routesApi.js` |
| listStaff | 1 | GET | `${getApiPrefix()}/staff` | `src/shared/services/api/staffApi.js` |
| listSubscriptions | 1 | GET | `${getApiPrefix()}/subscriptions${queryString}` | `src/shared/services/api/deliverySubscriptionsApi.js` |
| loginRequestOtp | 1 | POST | `/api/auth/request-otp` | `src/shared/services/api/authApi.js` |
| loginVerifyOtp | 1 | POST | `/api/auth/verify-otp` | `src/shared/services/api/authApi.js` |
| logout | 1 | POST | `/api/auth/logout` | `src/shared/services/api/authApi.js` |
| recordPayment | 1 | POST | `${getApiPrefix()}/ledgers/payment` | `src/shared/services/api/accountingApi.js` |
| refundDeposit | 1 | POST | `${getApiPrefix()}/deposits/refund` | `src/shared/services/api/accountingApi.js` |
| resendOtp | 1 | POST | `/api/auth/resend-otp` | `src/shared/services/api/authApi.js` |
| setActiveBankAccount | 1 | PATCH | `/api/vendor/invoice-settings` | `src/shared/services/api/invoicesApi.js` |
| settleDepositToBill | 1 | POST | `${getApiPrefix()}/deposits/settle-to-bill` | `src/shared/services/api/accountingApi.js` |
| signupRequestOtp | 1 | POST | `/api/auth/signup-request-otp` | `src/shared/services/api/authApi.js` |
| signupVerifyOtp | 1 | POST | `/api/auth/signup-verify-otp` | `src/shared/services/api/authApi.js` |
| trackDeliveries | 1 | GET | `${getApiPrefix()}/deliveries/track${queryString}` | `src/shared/services/api/deliveriesApi.js` |
| updateBankAccount | 1 | PATCH | `/api/vendor/bank-accounts/${encodeURIComponent(id)}` | `src/shared/services/api/invoicesApi.js` |
| updateCustomer | 1 | PATCH | `${getApiPrefix()}/customers/${id}` | `src/shared/services/api/customersApi.js` |
| updateCustomerSequence | 1 | PATCH | `${getApiPrefix()}/customers/sequence` | `src/shared/services/api/customersApi.js` |
| updateDeliveryStatus | 1 | PATCH | `${getApiPrefix()}/deliveries/${id}/status` | `src/shared/services/api/deliveriesApi.js` |
| updateInvoiceSettings | 1 | PATCH | `/api/vendor/invoice-settings` | `src/shared/services/api/invoicesApi.js` |
| updateOneTimeOrderStatus | 1 | PATCH | `${getApiPrefix()}/one-time-orders/${id}/status` | `src/shared/services/api/oneTimeOrdersApi.js` |
| updateProduct | 1 | PATCH multipart | `${getApiPrefix()}/products/${id}` | `src/shared/services/api/productsApi.js` |
| updateRoute | 1 | PATCH | `${getApiPrefix()}/routes/${id}` | `src/shared/services/api/routesApi.js` |
| updateStaff | 1 | PATCH | `${getApiPrefix()}/staff/${id}` | `src/shared/services/api/staffApi.js` |
| updateSubscription | 1 | PATCH | `${getApiPrefix()}/subscriptions/${id}` | `src/shared/services/api/deliverySubscriptionsApi.js` |
| updateVendorProfile | 1 | PATCH | `${getApiPrefix()}/profile` | `src/shared/services/api/profileApi.js` |
| uploadQrCode | 1 | Custom request | `Computed at runtime` | `src/shared/services/api/invoicesApi.js` |

### 12.8 Localization Inventory

| Locale Code | Language | Dictionary File | Registration |
| --- | --- | --- | --- |
| bn | Bengali | `src/shared/i18n/locales/bn.js` | Registered through src/shared/i18n/index.js |
| en | English | `src/shared/i18n/locales/en.js` | Registered through src/shared/i18n/index.js |
| gu | Gujarati | `src/shared/i18n/locales/gu.js` | Registered through src/shared/i18n/index.js |
| hi | Hindi | `src/shared/i18n/locales/hi.js` | Registered through src/shared/i18n/index.js |
| mr | Marathi | `src/shared/i18n/locales/mr.js` | Registered through src/shared/i18n/index.js |
| pa | Punjabi | `src/shared/i18n/locales/pa.js` | Registered through src/shared/i18n/index.js |
| ta | Tamil | `src/shared/i18n/locales/ta.js` | Registered through src/shared/i18n/index.js |
| te | Telugu | `src/shared/i18n/locales/te.js` | Registered through src/shared/i18n/index.js |

### 12.9 Dependency Inventory

| Dependency Scope | Package | Declared Version |
| --- | --- | --- |
| Development | @babel/core | ^7.25.2 |
| Development | @babel/preset-env | ^7.25.3 |
| Development | @babel/runtime | ^7.25.0 |
| Development | @react-native-community/cli | 20.1.0 |
| Development | @react-native-community/cli-platform-android | 20.1.0 |
| Development | @react-native-community/cli-platform-ios | 20.1.0 |
| Development | @react-native/babel-preset | 0.86.0 |
| Development | @react-native/eslint-config | 0.86.0 |
| Development | @react-native/jest-preset | 0.86.0 |
| Development | @react-native/metro-config | 0.86.0 |
| Development | eslint | ^8.19.0 |
| Development | jest | ^29.6.3 |
| Development | prettier | 2.8.8 |
| Development | react-test-renderer | 19.2.3 |
| Development | typescript | ^5.9.3 |
| Runtime | @react-native-async-storage/async-storage | ^3.1.1 |
| Runtime | @react-native-community/datetimepicker | ^9.1.0 |
| Runtime | @react-navigation/bottom-tabs | ^7.18.8 |
| Runtime | @react-navigation/drawer | ^7.12.8 |
| Runtime | @react-navigation/native | ^7.3.8 |
| Runtime | @react-navigation/native-stack | ^7.17.10 |
| Runtime | i18next | ^26.3.6 |
| Runtime | jwt-decode | ^4.0.0 |
| Runtime | lucide-react-native | ^1.24.0 |
| Runtime | react | 19.2.3 |
| Runtime | react-i18next | ^17.0.9 |
| Runtime | react-native | 0.86.0 |
| Runtime | react-native-blob-util | ^0.24.10 |
| Runtime | react-native-contacts | ^8.0.10 |
| Runtime | react-native-device-info | ^15.0.2 |
| Runtime | react-native-fast-image | ^8.6.3 |
| Runtime | react-native-gesture-handler | ^3.0.2 |
| Runtime | react-native-gifted-charts | ^1.4.78 |
| Runtime | react-native-html-to-pdf | ^1.3.0 |
| Runtime | react-native-image-picker | ^8.2.1 |
| Runtime | react-native-linear-gradient | ^2.8.3 |
| Runtime | react-native-print | ^0.11.0 |
| Runtime | react-native-razorpay | ^3.0.0 |
| Runtime | react-native-reanimated | ^4.6.0 |
| Runtime | react-native-safe-area-context | ^5.5.2 |
| Runtime | react-native-screens | ^4.26.0 |
| Runtime | react-native-share | ^12.3.1 |
| Runtime | react-native-svg | ^15.15.5 |
| Runtime | react-native-worklets | ^0.12.1 |
| Runtime | sp-react-native-in-app-updates | ^2.0.0 |

### 12.10 Complete Maintained File Inventory

> Excluded from this inventory: `.git`, `node_modules`, CocoaPods, Gradle caches, CMake output, native build directories, and other reproducible generated output. The preserved release AAB is a deliverable, not maintained source.

| File ID | Layer | Module/Area | Type | Relative Path | Responsibility | Public Symbols | Local Imports | External Packages |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FILE-001 | Quality | tests | Automated test | `__tests__/apiSurface.test.js` | api Surface.test automated test. | — | 1 | — |
| FILE-002 | Quality | tests | Automated test | `__tests__/App.test.tsx` | Application render smoke test. | — | 1 | react, react-native, react-test-renderer |
| FILE-003 | Quality | tests | Automated test | `__tests__/billing.test.js` | billing.test automated test. | — | 2 | — |
| FILE-004 | Quality | tests | Automated test | `__tests__/EntitlementContext.test.js` | Entitlement Context.test automated test. | — | 3 | buffer, react, react-test-renderer |
| FILE-005 | Quality | tests | Automated test | `__tests__/invoicePaymentSelection.test.js` | invoice Payment Selection.test automated test. | — | 1 | react, react-native, react-test-renderer |
| FILE-006 | Quality | tests | Automated test | `__tests__/jwtEntitlements.test.js` | jwt Entitlements.test automated test. | — | 2 | buffer |
| FILE-007 | Quality | tests | Automated test | `__tests__/tokenRefresh.test.js` | token Refresh.test automated test. | — | 1 | @react-native-async-storage/async-storage, buffer |
| FILE-008 | Governance | agent-rules | Documentation | `.agents/AGENTS.md` | AGENTS project documentation. | — | 0 | — |
| FILE-009 | Tooling | ruby | Project file | `.bundle/config` | config project file. | — | 0 | — |
| FILE-010 | Project root | configuration | Project configuration/source | `.eslintrc.js` | .eslintrc configuration. | — | 0 | — |
| FILE-011 | Project root | configuration | Project file | `.gitignore` | .gitignore project file. | — | 0 | — |
| FILE-012 | Project root | configuration | Project configuration/source | `.prettierrc.js` | .prettierrc configuration. | — | 0 | — |
| FILE-013 | Project root | configuration | Project file | `.watchmanconfig` | .watchmanconfig project file. | — | 0 | — |
| FILE-014 | Documentation | project-docs | Documentation | `02_ARCHITECTURE_SOURCE.md` | 02 ARCHITECTURE SOURCE project documentation. | — | 0 | — |
| FILE-015 | Documentation | project-docs | Documentation | `03_FUNCTIONAL_MODULES_SOURCE.md` | 03 FUNCTIONAL MODULES SOURCE project documentation. | — | 0 | — |
| FILE-016 | Native | android | Native build configuration | `android/app/build.gradle` | build configuration. | — | 0 | — |
| FILE-017 | Native | android | Project file | `android/app/debug.keystore` | debug project file. | — | 0 | — |
| FILE-018 | Native | android | Project file | `android/app/proguard-rules.pro` | proguard rules project file. | — | 0 | — |
| FILE-019 | Native | android | Native resource/config | `android/app/src/main/AndroidManifest.xml` | Android Manifest configuration. | — | 0 | — |
| FILE-020 | Native | android | Binary/archive | `android/app/src/main/assets/custom/SUSE.zip` | SUSE binary/archive. | — | 0 | — |
| FILE-021 | Native | android | Font asset | `android/app/src/main/assets/fonts/BricolageGrotesque-Bold.ttf` | Bricolage Grotesque Bold font resource. | — | 0 | — |
| FILE-022 | Native | android | Font asset | `android/app/src/main/assets/fonts/BricolageGrotesque-Medium.ttf` | Bricolage Grotesque Medium font resource. | — | 0 | — |
| FILE-023 | Native | android | Font asset | `android/app/src/main/assets/fonts/BricolageGrotesque-Regular.ttf` | Bricolage Grotesque Regular font resource. | — | 0 | — |
| FILE-024 | Native | android | Font asset | `android/app/src/main/assets/fonts/BricolageGrotesque-SemiBold.ttf` | Bricolage Grotesque Semi Bold font resource. | — | 0 | — |
| FILE-025 | Native | android | Font asset | `android/app/src/main/assets/fonts/Fredoka-Bold.ttf` | Fredoka Bold font resource. | — | 0 | — |
| FILE-026 | Native | android | Font asset | `android/app/src/main/assets/fonts/Fredoka-Medium.ttf` | Fredoka Medium font resource. | — | 0 | — |
| FILE-027 | Native | android | Font asset | `android/app/src/main/assets/fonts/Fredoka-Regular.ttf` | Fredoka Regular font resource. | — | 0 | — |
| FILE-028 | Native | android | Font asset | `android/app/src/main/assets/fonts/Fredoka-SemiBold.ttf` | Fredoka Semi Bold font resource. | — | 0 | — |
| FILE-029 | Native | android | Font asset | `android/app/src/main/assets/fonts/Geologica-Bold.ttf` | Geologica Bold font resource. | — | 0 | — |
| FILE-030 | Native | android | Font asset | `android/app/src/main/assets/fonts/Geologica-Medium.ttf` | Geologica Medium font resource. | — | 0 | — |
| FILE-031 | Native | android | Font asset | `android/app/src/main/assets/fonts/Geologica-Regular.ttf` | Geologica Regular font resource. | — | 0 | — |
| FILE-032 | Native | android | Font asset | `android/app/src/main/assets/fonts/Geologica-SemiBold.ttf` | Geologica Semi Bold font resource. | — | 0 | — |
| FILE-033 | Native | android | Font asset | `android/app/src/main/assets/fonts/Inter-Bold.ttf` | Inter Bold font resource. | — | 0 | — |
| FILE-034 | Native | android | Font asset | `android/app/src/main/assets/fonts/Inter-Medium.ttf` | Inter Medium font resource. | — | 0 | — |
| FILE-035 | Native | android | Font asset | `android/app/src/main/assets/fonts/Inter-Regular.ttf` | Inter Regular font resource. | — | 0 | — |
| FILE-036 | Native | android | Font asset | `android/app/src/main/assets/fonts/Inter-SemiBold.ttf` | Inter Semi Bold font resource. | — | 0 | — |
| FILE-037 | Native | android | Font asset | `android/app/src/main/assets/fonts/Poppins-Bold.ttf` | Poppins Bold font resource. | — | 0 | — |
| FILE-038 | Native | android | Font asset | `android/app/src/main/assets/fonts/Poppins-Medium.ttf` | Poppins Medium font resource. | — | 0 | — |
| FILE-039 | Native | android | Font asset | `android/app/src/main/assets/fonts/Poppins-Regular.ttf` | Poppins Regular font resource. | — | 0 | — |
| FILE-040 | Native | android | Font asset | `android/app/src/main/assets/fonts/Poppins-SemiBold.ttf` | Poppins Semi Bold font resource. | — | 0 | — |
| FILE-041 | Native | android | Font asset | `android/app/src/main/assets/fonts/Rubik-Bold.ttf` | Rubik Bold font resource. | — | 0 | — |
| FILE-042 | Native | android | Font asset | `android/app/src/main/assets/fonts/Rubik-Medium.ttf` | Rubik Medium font resource. | — | 0 | — |
| FILE-043 | Native | android | Font asset | `android/app/src/main/assets/fonts/Rubik-Regular.ttf` | Rubik Regular font resource. | — | 0 | — |
| FILE-044 | Native | android | Font asset | `android/app/src/main/assets/fonts/Rubik-SemiBold.ttf` | Rubik Semi Bold font resource. | — | 0 | — |
| FILE-045 | Native | android | Font asset | `android/app/src/main/assets/fonts/SUSE-Black.ttf` | SUSE Black font resource. | — | 0 | — |
| FILE-046 | Native | android | Font asset | `android/app/src/main/assets/fonts/SUSE-Bold.ttf` | SUSE Bold font resource. | — | 0 | — |
| FILE-047 | Native | android | Font asset | `android/app/src/main/assets/fonts/SUSE-ExtraBold.ttf` | SUSE Extra Bold font resource. | — | 0 | — |
| FILE-048 | Native | android | Font asset | `android/app/src/main/assets/fonts/SUSE-ExtraLight.ttf` | SUSE Extra Light font resource. | — | 0 | — |
| FILE-049 | Native | android | Font asset | `android/app/src/main/assets/fonts/SUSE-Light.ttf` | SUSE Light font resource. | — | 0 | — |
| FILE-050 | Native | android | Font asset | `android/app/src/main/assets/fonts/SUSE-Medium.ttf` | SUSE Medium font resource. | — | 0 | — |
| FILE-051 | Native | android | Font asset | `android/app/src/main/assets/fonts/SUSE-Regular.ttf` | SUSE Regular font resource. | — | 0 | — |
| FILE-052 | Native | android | Font asset | `android/app/src/main/assets/fonts/SUSE-SemiBold.ttf` | SUSE Semi Bold font resource. | — | 0 | — |
| FILE-053 | Native | android | Font asset | `android/app/src/main/assets/fonts/SUSE-Thin.ttf` | SUSE Thin font resource. | — | 0 | — |
| FILE-054 | Native | android | Native source | `android/app/src/main/java/com/com.camper.dailybudgetapp/MainActivity.kt` | Main Activity native bootstrap/source file. | — | 0 | — |
| FILE-055 | Native | android | Native source | `android/app/src/main/java/com/com.camper.dailybudgetapp/MainApplication.kt` | Main Application native bootstrap/source file. | — | 0 | — |
| FILE-056 | Native | android | Native resource/config | `android/app/src/main/res/drawable/rn_edit_text_material.xml` | rn edit text material configuration. | — | 0 | — |
| FILE-057 | Native | android | Native resource/config | `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` | ic launcher configuration. | — | 0 | — |
| FILE-058 | Native | android | Image asset | `android/app/src/main/res/mipmap-hdpi/ic_launcher_background.png` | ic launcher background image asset. | — | 0 | — |
| FILE-059 | Native | android | Image asset | `android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png` | ic launcher foreground image asset. | — | 0 | — |
| FILE-060 | Native | android | Image asset | `android/app/src/main/res/mipmap-hdpi/ic_launcher_monochrome.png` | ic launcher monochrome image asset. | — | 0 | — |
| FILE-061 | Native | android | Image asset | `android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png` | ic launcher round image asset. | — | 0 | — |
| FILE-062 | Native | android | Image asset | `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` | ic launcher image asset. | — | 0 | — |
| FILE-063 | Native | android | Image asset | `android/app/src/main/res/mipmap-mdpi/ic_launcher_background.png` | ic launcher background image asset. | — | 0 | — |
| FILE-064 | Native | android | Image asset | `android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png` | ic launcher foreground image asset. | — | 0 | — |
| FILE-065 | Native | android | Image asset | `android/app/src/main/res/mipmap-mdpi/ic_launcher_monochrome.png` | ic launcher monochrome image asset. | — | 0 | — |
| FILE-066 | Native | android | Image asset | `android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png` | ic launcher round image asset. | — | 0 | — |
| FILE-067 | Native | android | Image asset | `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` | ic launcher image asset. | — | 0 | — |
| FILE-068 | Native | android | Image asset | `android/app/src/main/res/mipmap-xhdpi/ic_launcher_background.png` | ic launcher background image asset. | — | 0 | — |
| FILE-069 | Native | android | Image asset | `android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png` | ic launcher foreground image asset. | — | 0 | — |
| FILE-070 | Native | android | Image asset | `android/app/src/main/res/mipmap-xhdpi/ic_launcher_monochrome.png` | ic launcher monochrome image asset. | — | 0 | — |
| FILE-071 | Native | android | Image asset | `android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png` | ic launcher round image asset. | — | 0 | — |
| FILE-072 | Native | android | Image asset | `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` | ic launcher image asset. | — | 0 | — |
| FILE-073 | Native | android | Image asset | `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_background.png` | ic launcher background image asset. | — | 0 | — |
| FILE-074 | Native | android | Image asset | `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png` | ic launcher foreground image asset. | — | 0 | — |
| FILE-075 | Native | android | Image asset | `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_monochrome.png` | ic launcher monochrome image asset. | — | 0 | — |
| FILE-076 | Native | android | Image asset | `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png` | ic launcher round image asset. | — | 0 | — |
| FILE-077 | Native | android | Image asset | `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` | ic launcher image asset. | — | 0 | — |
| FILE-078 | Native | android | Image asset | `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_background.png` | ic launcher background image asset. | — | 0 | — |
| FILE-079 | Native | android | Image asset | `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png` | ic launcher foreground image asset. | — | 0 | — |
| FILE-080 | Native | android | Image asset | `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_monochrome.png` | ic launcher monochrome image asset. | — | 0 | — |
| FILE-081 | Native | android | Image asset | `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png` | ic launcher round image asset. | — | 0 | — |
| FILE-082 | Native | android | Image asset | `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` | ic launcher image asset. | — | 0 | — |
| FILE-083 | Native | android | Native resource/config | `android/app/src/main/res/values/strings.xml` | strings configuration. | — | 0 | — |
| FILE-084 | Native | android | Native resource/config | `android/app/src/main/res/values/styles.xml` | styles configuration. | — | 0 | — |
| FILE-085 | Native | android | Native build configuration | `android/build.gradle` | build configuration. | — | 0 | — |
| FILE-086 | Native | android | Native build configuration | `android/gradle.properties` | gradle configuration. | — | 0 | — |
| FILE-087 | Native | android | Binary/archive | `android/gradle/wrapper/gradle-wrapper.jar` | gradle wrapper binary/archive. | — | 0 | — |
| FILE-088 | Native | android | Native build configuration | `android/gradle/wrapper/gradle-wrapper.properties` | gradle wrapper configuration. | — | 0 | — |
| FILE-089 | Native | android | Native build configuration | `android/gradlew` | gradlew configuration. | — | 0 | — |
| FILE-090 | Native | android | Native build configuration | `android/gradlew.bat` | gradlew configuration. | — | 0 | — |
| FILE-091 | Native | android | Native resource/config | `android/link-assets-manifest.json` | link assets manifest configuration. | — | 0 | — |
| FILE-092 | Native | android | Native build configuration | `android/settings.gradle` | settings configuration. | — | 0 | — |
| FILE-093 | Project root | configuration | Project configuration/source | `app.json` | app configuration. | — | 0 | — |
| FILE-094 | Project root | configuration | Project file | `App.jsx` | Root React Native component; providers, global visual shell, status bar, navigation, and in-app updates. | App, navigationRef | 2 | @react-navigation/native, react, react-native, react-native-gesture-handler, react-native-safe-area-context, react-native-svg, sp-react-native-in-app-updates |
| FILE-095 | Assets | activesubstat.png | Image asset | `assets/activesubstat.png` | activesubstat image asset. | — | 0 | — |
| FILE-096 | Assets | activesubstat2.png | Image asset | `assets/activesubstat2.png` | activesubstat2 image asset. | — | 0 | — |
| FILE-097 | Assets | branded_water_jar.jpg | Image asset | `assets/branded_water_jar.jpg` | branded water jar image asset. | — | 0 | — |
| FILE-098 | Assets | camper_truck.jpg | Image asset | `assets/camper_truck.jpg` | camper truck image asset. | — | 0 | — |
| FILE-099 | Assets | campersplash.png | Image asset | `assets/campersplash.png` | campersplash image asset. | — | 0 | — |
| FILE-100 | Assets | car.png | Image asset | `assets/car.png` | car image asset. | — | 0 | — |
| FILE-101 | Assets | customerfallback - Copy.png | Image asset | `assets/customerfallback - Copy.png` | customerfallback Copy image asset. | — | 0 | — |
| FILE-102 | Assets | customerfallback.png | Image asset | `assets/customerfallback.png` | customerfallback image asset. | — | 0 | — |
| FILE-103 | Assets | customers3d.png | Image asset | `assets/customers3d.png` | customers3d image asset. | — | 0 | — |
| FILE-104 | Assets | customerstats.png | Image asset | `assets/customerstats.png` | customerstats image asset. | — | 0 | — |
| FILE-105 | Assets | customerstats2.png | Image asset | `assets/customerstats2.png` | customerstats2 image asset. | — | 0 | — |
| FILE-106 | Assets | delivery_rickshaw.jpg | Image asset | `assets/delivery_rickshaw.jpg` | delivery rickshaw image asset. | — | 0 | — |
| FILE-107 | Assets | delivery_rickshaw.png | Image asset | `assets/delivery_rickshaw.png` | delivery rickshaw image asset. | — | 0 | — |
| FILE-108 | Assets | englishlogo.png | Image asset | `assets/englishlogo.png` | englishlogo image asset. | — | 0 | — |
| FILE-109 | Assets | fallbackimage.png | Image asset | `assets/fallbackimage.png` | fallbackimage image asset. | — | 0 | — |
| FILE-110 | Assets | fallbackimage1.png | Image asset | `assets/fallbackimage1.png` | fallbackimage1 image asset. | — | 0 | — |
| FILE-111 | Assets | fonts | Font asset | `assets/fonts/BricolageGrotesque-Bold.ttf` | Bricolage Grotesque Bold font resource. | — | 0 | — |
| FILE-112 | Assets | fonts | Font asset | `assets/fonts/BricolageGrotesque-Medium.ttf` | Bricolage Grotesque Medium font resource. | — | 0 | — |
| FILE-113 | Assets | fonts | Font asset | `assets/fonts/BricolageGrotesque-Regular.ttf` | Bricolage Grotesque Regular font resource. | — | 0 | — |
| FILE-114 | Assets | fonts | Font asset | `assets/fonts/BricolageGrotesque-SemiBold.ttf` | Bricolage Grotesque Semi Bold font resource. | — | 0 | — |
| FILE-115 | Assets | fonts | Font asset | `assets/fonts/Fredoka-Bold.ttf` | Fredoka Bold font resource. | — | 0 | — |
| FILE-116 | Assets | fonts | Font asset | `assets/fonts/Fredoka-Medium.ttf` | Fredoka Medium font resource. | — | 0 | — |
| FILE-117 | Assets | fonts | Font asset | `assets/fonts/Fredoka-Regular.ttf` | Fredoka Regular font resource. | — | 0 | — |
| FILE-118 | Assets | fonts | Font asset | `assets/fonts/Fredoka-SemiBold.ttf` | Fredoka Semi Bold font resource. | — | 0 | — |
| FILE-119 | Assets | fonts | Font asset | `assets/fonts/Geologica-Bold.ttf` | Geologica Bold font resource. | — | 0 | — |
| FILE-120 | Assets | fonts | Font asset | `assets/fonts/Geologica-Medium.ttf` | Geologica Medium font resource. | — | 0 | — |
| FILE-121 | Assets | fonts | Font asset | `assets/fonts/Geologica-Regular.ttf` | Geologica Regular font resource. | — | 0 | — |
| FILE-122 | Assets | fonts | Font asset | `assets/fonts/Geologica-SemiBold.ttf` | Geologica Semi Bold font resource. | — | 0 | — |
| FILE-123 | Assets | fonts | Font asset | `assets/fonts/Inter-Bold.ttf` | Inter Bold font resource. | — | 0 | — |
| FILE-124 | Assets | fonts | Font asset | `assets/fonts/Inter-Medium.ttf` | Inter Medium font resource. | — | 0 | — |
| FILE-125 | Assets | fonts | Font asset | `assets/fonts/Inter-Regular.ttf` | Inter Regular font resource. | — | 0 | — |
| FILE-126 | Assets | fonts | Font asset | `assets/fonts/Inter-SemiBold.ttf` | Inter Semi Bold font resource. | — | 0 | — |
| FILE-127 | Assets | fonts | Font asset | `assets/fonts/Poppins-Bold.ttf` | Poppins Bold font resource. | — | 0 | — |
| FILE-128 | Assets | fonts | Font asset | `assets/fonts/Poppins-Medium.ttf` | Poppins Medium font resource. | — | 0 | — |
| FILE-129 | Assets | fonts | Font asset | `assets/fonts/Poppins-Regular.ttf` | Poppins Regular font resource. | — | 0 | — |
| FILE-130 | Assets | fonts | Font asset | `assets/fonts/Poppins-SemiBold.ttf` | Poppins Semi Bold font resource. | — | 0 | — |
| FILE-131 | Assets | fonts | Font asset | `assets/fonts/Rubik-Bold.ttf` | Rubik Bold font resource. | — | 0 | — |
| FILE-132 | Assets | fonts | Font asset | `assets/fonts/Rubik-Medium.ttf` | Rubik Medium font resource. | — | 0 | — |
| FILE-133 | Assets | fonts | Font asset | `assets/fonts/Rubik-Regular.ttf` | Rubik Regular font resource. | — | 0 | — |
| FILE-134 | Assets | fonts | Font asset | `assets/fonts/Rubik-SemiBold.ttf` | Rubik Semi Bold font resource. | — | 0 | — |
| FILE-135 | Assets | fonts | Font asset | `assets/fonts/SUSE-Black.ttf` | SUSE Black font resource. | — | 0 | — |
| FILE-136 | Assets | fonts | Font asset | `assets/fonts/SUSE-Bold.ttf` | SUSE Bold font resource. | — | 0 | — |
| FILE-137 | Assets | fonts | Font asset | `assets/fonts/SUSE-ExtraBold.ttf` | SUSE Extra Bold font resource. | — | 0 | — |
| FILE-138 | Assets | fonts | Font asset | `assets/fonts/SUSE-ExtraLight.ttf` | SUSE Extra Light font resource. | — | 0 | — |
| FILE-139 | Assets | fonts | Font asset | `assets/fonts/SUSE-Light.ttf` | SUSE Light font resource. | — | 0 | — |
| FILE-140 | Assets | fonts | Font asset | `assets/fonts/SUSE-Medium.ttf` | SUSE Medium font resource. | — | 0 | — |
| FILE-141 | Assets | fonts | Font asset | `assets/fonts/SUSE-Regular.ttf` | SUSE Regular font resource. | — | 0 | — |
| FILE-142 | Assets | fonts | Font asset | `assets/fonts/SUSE-SemiBold.ttf` | SUSE Semi Bold font resource. | — | 0 | — |
| FILE-143 | Assets | fonts | Font asset | `assets/fonts/SUSE-Thin.ttf` | SUSE Thin font resource. | — | 0 | — |
| FILE-144 | Assets | fonts | Binary/archive | `assets/fonts/SUSE.zip` | SUSE binary/archive. | — | 0 | — |
| FILE-145 | Assets | goldCar.png | Image asset | `assets/goldCar.png` | gold Car image asset. | — | 0 | — |
| FILE-146 | Assets | header_bg.png | Image asset | `assets/header_bg.png` | header bg image asset. | — | 0 | — |
| FILE-147 | Assets | header_bg1.png | Image asset | `assets/header_bg1.png` | header bg1 image asset. | — | 0 | — |
| FILE-148 | Assets | header_bg10.png | Image asset | `assets/header_bg10.png` | header bg10 image asset. | — | 0 | — |
| FILE-149 | Assets | header_bg2.png | Image asset | `assets/header_bg2.png` | header bg2 image asset. | — | 0 | — |
| FILE-150 | Assets | header_bg5.png | Image asset | `assets/header_bg5.png` | header bg5 image asset. | — | 0 | — |
| FILE-151 | Assets | header.png | Image asset | `assets/header.png` | header image asset. | — | 0 | — |
| FILE-152 | Assets | heroSetting.jpeg | Image asset | `assets/heroSetting.jpeg` | hero Setting image asset. | — | 0 | — |
| FILE-153 | Assets | hindilogo.png | Image asset | `assets/hindilogo.png` | hindilogo image asset. | — | 0 | — |
| FILE-154 | Assets | login6.png | Image asset | `assets/login6.png` | login6 image asset. | — | 0 | — |
| FILE-155 | Assets | login7.png | Image asset | `assets/login7.png` | login7 image asset. | — | 0 | — |
| FILE-156 | Assets | logo1.png | Image asset | `assets/logo1.png` | logo1 image asset. | — | 0 | — |
| FILE-157 | Assets | logo2.png | Image asset | `assets/logo2.png` | logo2 image asset. | — | 0 | — |
| FILE-158 | Assets | onboarding1.png | Image asset | `assets/onboarding1.png` | onboarding1 image asset. | — | 0 | — |
| FILE-159 | Assets | onboarding2.jpg | Image asset | `assets/onboarding2.jpg` | onboarding2 image asset. | — | 0 | — |
| FILE-160 | Assets | onboarding3.png | Image asset | `assets/onboarding3.png` | onboarding3 image asset. | — | 0 | — |
| FILE-161 | Assets | onetimestat.png | Image asset | `assets/onetimestat.png` | onetimestat image asset. | — | 0 | — |
| FILE-162 | Assets | onetimestat2.png | Image asset | `assets/onetimestat2.png` | onetimestat2 image asset. | — | 0 | — |
| FILE-163 | Assets | products3d.png | Image asset | `assets/products3d.png` | products3d image asset. | — | 0 | — |
| FILE-164 | Assets | rich.png | Image asset | `assets/rich.png` | rich image asset. | — | 0 | — |
| FILE-165 | Assets | routes3d.png | Image asset | `assets/routes3d.png` | routes3d image asset. | — | 0 | — |
| FILE-166 | Assets | routestat.png | Image asset | `assets/routestat.png` | routestat image asset. | — | 0 | — |
| FILE-167 | Assets | routestat2.png | Image asset | `assets/routestat2.png` | routestat2 image asset. | — | 0 | — |
| FILE-168 | Assets | subscriptions3d.png | Image asset | `assets/subscriptions3d.png` | subscriptions3d image asset. | — | 0 | — |
| FILE-169 | Assets | truck.png | Image asset | `assets/truck.png` | truck image asset. | — | 0 | — |
| FILE-170 | Project root | configuration | Project configuration/source | `babel.config.js` | babel.config configuration. | — | 0 | — |
| FILE-171 | Project root | configuration | Project file | `build_test.log` | build test project file. | — | 0 | — |
| FILE-172 | Project root | configuration | Project file | `build.log` | build project file. | — | 0 | — |
| FILE-173 | Documentation | project-docs | Documentation | `frontend_report_guide.md` | frontend report guide project documentation. | — | 0 | — |
| FILE-174 | Project root | configuration | Native build configuration | `Gemfile` | Gemfile configuration. | — | 0 | — |
| FILE-175 | Project root | configuration | Project file | `Gemfile.lock` | Gemfile project file. | — | 0 | — |
| FILE-176 | Project root | configuration | Project configuration/source | `index.js` | React Native application registration entry point. | — | 2 | react-native |
| FILE-177 | Native | ios | Project file | `ios/.xcode.env` | .xcode project file. | — | 0 | — |
| FILE-178 | Native | ios | Project file | `ios/.xcode.env.local` | .xcode.env project file. | — | 0 | — |
| FILE-179 | Native | ios | Xcode project configuration | `ios/Compunic.xcodeproj/project.pbxproj` | project configuration. | — | 0 | — |
| FILE-180 | Native | ios | Xcode project configuration | `ios/Compunic.xcodeproj/xcshareddata/xcschemes/Compunic.xcscheme` | Compunic configuration. | — | 0 | — |
| FILE-181 | Native | ios | Project file | `ios/Compunic.xcworkspace/contents.xcworkspacedata` | contents project file. | — | 0 | — |
| FILE-182 | Native | ios | Project file | `ios/Compunic.xcworkspace/xcuserdata/macbookpro.xcuserdatad/UserInterfaceState.xcuserstate` | User Interface State project file. | — | 0 | — |
| FILE-183 | Native | ios | Native source | `ios/Compunic/AppDelegate.swift` | App Delegate native bootstrap/source file. | — | 0 | — |
| FILE-184 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon-20@2x.png` | App Icon 20@2x image asset. | — | 0 | — |
| FILE-185 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon-20@2x~ipad.png` | App Icon 20@2x~ipad image asset. | — | 0 | — |
| FILE-186 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon-20@3x.png` | App Icon 20@3x image asset. | — | 0 | — |
| FILE-187 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon-20~ipad.png` | App Icon 20~ipad image asset. | — | 0 | — |
| FILE-188 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon-29.png` | App Icon 29 image asset. | — | 0 | — |
| FILE-189 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon-29@2x.png` | App Icon 29@2x image asset. | — | 0 | — |
| FILE-190 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon-29@2x~ipad.png` | App Icon 29@2x~ipad image asset. | — | 0 | — |
| FILE-191 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon-29@3x.png` | App Icon 29@3x image asset. | — | 0 | — |
| FILE-192 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon-29~ipad.png` | App Icon 29~ipad image asset. | — | 0 | — |
| FILE-193 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon-40@2x.png` | App Icon 40@2x image asset. | — | 0 | — |
| FILE-194 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon-40@2x~ipad.png` | App Icon 40@2x~ipad image asset. | — | 0 | — |
| FILE-195 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon-40@3x.png` | App Icon 40@3x image asset. | — | 0 | — |
| FILE-196 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon-40~ipad.png` | App Icon 40~ipad image asset. | — | 0 | — |
| FILE-197 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon-60@2x~car.png` | App Icon 60@2x~car image asset. | — | 0 | — |
| FILE-198 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon-60@3x~car.png` | App Icon 60@3x~car image asset. | — | 0 | — |
| FILE-199 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon-83.5@2x~ipad.png` | App Icon 83.5@2x~ipad image asset. | — | 0 | — |
| FILE-200 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon@2x.png` | App Icon@2x image asset. | — | 0 | — |
| FILE-201 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon@2x~ipad.png` | App Icon@2x~ipad image asset. | — | 0 | — |
| FILE-202 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon@3x.png` | App Icon@3x image asset. | — | 0 | — |
| FILE-203 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon~ios-marketing.png` | App Icon~ios marketing image asset. | — | 0 | — |
| FILE-204 | Native | ios | Image asset | `ios/Compunic/Images.xcassets/AppIcon.appiconset/AppIcon~ipad.png` | App Icon~ipad image asset. | — | 0 | — |
| FILE-205 | Native | ios | Native resource/config | `ios/Compunic/Images.xcassets/AppIcon.appiconset/Contents.json` | Contents configuration. | — | 0 | — |
| FILE-206 | Native | ios | Native resource/config | `ios/Compunic/Images.xcassets/Contents.json` | Contents configuration. | — | 0 | — |
| FILE-207 | Native | ios | Native resource/config | `ios/Compunic/Info.plist` | Info configuration. | — | 0 | — |
| FILE-208 | Native | ios | Native resource/config | `ios/Compunic/LaunchScreen.storyboard` | Launch Screen configuration. | — | 0 | — |
| FILE-209 | Native | ios | Native resource/config | `ios/Compunic/PrivacyInfo.xcprivacy` | Privacy Info configuration. | — | 0 | — |
| FILE-210 | Native | ios | Native resource/config | `ios/link-assets-manifest.json` | link assets manifest configuration. | — | 0 | — |
| FILE-211 | Native | ios | Native build configuration | `ios/Podfile` | Podfile configuration. | — | 0 | — |
| FILE-212 | Native | ios | Project file | `ios/Podfile.lock` | Podfile project file. | — | 0 | — |
| FILE-213 | Project root | configuration | Project configuration/source | `jest.config.js` | jest.config configuration. | — | 0 | — |
| FILE-214 | Project root | configuration | Project configuration/source | `jest.setup.js` | jest.setup configuration. | — | 0 | react-native-gesture-handler |
| FILE-215 | Project root | configuration | Project configuration/source | `metro.config.js` | metro.config configuration. | — | 0 | @react-native/metro-config |
| FILE-216 | Project root | configuration | Dependency lockfile | `package-lock.json` | Exact npm dependency resolution lockfile. | — | 0 | — |
| FILE-217 | Project root | configuration | Project configuration/source | `package.json` | Node package manifest, dependency versions, and developer commands. | — | 0 | — |
| FILE-218 | Documentation | project-docs | Documentation | `PROJECT_DOCUMENTATION_SOURCE.md` | PROJECT DOCUMENTATION SOURCE project documentation. | — | 0 | — |
| FILE-219 | Project root | configuration | Project configuration/source | `react-native.config.js` | react native.config configuration. | — | 0 | — |
| FILE-220 | Documentation | project-docs | Documentation | `README.md` | README project documentation. | — | 0 | — |
| FILE-221 | Tooling | scripts | Automation script | `scripts/updateProjectStructure.cjs` | Regenerates the Excel-ready current-project structure in workflow.md. | const | 0 | fs, path |
| FILE-222 | Tooling | scripts | Automation script | `scripts/verifyRelativeImports.cjs` | Validates every relative import, export-from, dynamic import, and require path. | — | 0 | fs, path |
| FILE-223 | Application shell | navigation | Navigation | `src/app/navigation/AuthStack.jsx` | Public onboarding and authentication stack registration. | AuthStack | 1 | @react-navigation/native-stack, react |
| FILE-224 | Application shell | navigation | Navigation | `src/app/navigation/CustomDrawerContent.jsx` | Role-aware drawer menu, entitlement lock display, profile header, and logout action. | CustomDrawerContent | 7 | lucide-react-native, react, react-i18next, react-native, react-native-safe-area-context, react-native-svg |
| FILE-225 | Application shell | navigation | Navigation | `src/app/navigation/MainDrawer.jsx` | Authenticated drawer navigator and drawer-level screens. | MainDrawer | 6 | @react-navigation/drawer, lucide-react-native, react, react-i18next |
| FILE-226 | Application shell | navigation | Navigation | `src/app/navigation/MainTabs.jsx` | Authenticated bottom-tab navigation and tab entitlement guards. | MainTabs | 10 | @react-navigation/bottom-tabs, @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-fast-image, react-native-safe-area-context, react-native-svg |
| FILE-227 | Application shell | navigation | Navigation | `src/app/navigation/RootNavigator.jsx` | Top-level authentication gate, splash transition, entitlement-limit handling, and app stack registration. | RootNavigator | 20 | @react-navigation/native, @react-navigation/native-stack, react, react-i18next, react-native |
| FILE-228 | Application shell | providers | Provider/context | `src/app/providers/AlertContext.jsx` | Global styled alert/modal API used instead of generic native alerts. | AlertProvider, useAlert | 1 | lucide-react-native, react, react-i18next, react-native, react-native-safe-area-context |
| FILE-229 | Application shell | providers | Provider/context | `src/app/providers/AuthContext.js` | Authentication session, persisted tokens, profile state, refresh callbacks, and logout. | AuthContext, AuthProvider | 2 | @react-native-async-storage/async-storage, react, react-native-fast-image |
| FILE-230 | Application shell | providers | Provider/context | `src/app/providers/EntitlementContext.jsx` | Subscription entitlement state, proactive checks, and guarded navigation/actions. | EntitlementProvider, useEntitlements | 4 | react, react-native |
| FILE-231 | Application shell | screens | Screen | `src/app/screens/SplashScreen.jsx` | Animated application splash experience and startup completion callback. | SplashScreen | 1 | lucide-react-native, react, react-native, react-native-fast-image, react-native-svg |
| FILE-232 | Feature | auth | Feature public barrel | `src/features/auth/index.js` | Public exports for the auth feature boundary. | CompleteRegistrationScreen, LoginScreen, OnboardingScreen1, OnboardingScreen2, OtpVerificationScreen, RegisterScreen | 6 | — |
| FILE-233 | Feature | auth | Screen | `src/features/auth/screens/CompleteRegistrationScreen.jsx` | Complete Registration user interface in the auth module. | CompleteRegistrationScreen | 5 | lucide-react-native, react, react-i18next, react-native, react-native-fast-image, react-native-safe-area-context |
| FILE-234 | Feature | auth | Screen | `src/features/auth/screens/LoginScreen.jsx` | Login user interface in the auth module. | LoginScreen | 5 | lucide-react-native, react, react-i18next, react-native, react-native-safe-area-context |
| FILE-235 | Feature | auth | Project file | `src/features/auth/screens/OnboardingScreen1.jsx` | Onboarding Screen1 project file. | OnboardingScreen1 | 4 | lucide-react-native, react, react-i18next, react-native, react-native-fast-image, react-native-safe-area-context |
| FILE-236 | Feature | auth | Project file | `src/features/auth/screens/OnboardingScreen2.jsx` | Onboarding Screen2 project file. | OnboardingScreen2 | 4 | lucide-react-native, react, react-i18next, react-native, react-native-fast-image, react-native-safe-area-context |
| FILE-237 | Feature | auth | Screen | `src/features/auth/screens/OtpVerificationScreen.jsx` | Otp Verification user interface in the auth module. | OtpVerificationScreen | 4 | lucide-react-native, react, react-i18next, react-native, react-native-safe-area-context |
| FILE-238 | Feature | auth | Screen | `src/features/auth/screens/RegisterScreen.jsx` | Register user interface in the auth module. | RegisterScreen | 3 | @react-native-async-storage/async-storage, lucide-react-native, react, react-i18next, react-native, react-native-safe-area-context |
| FILE-239 | Feature | customers | Feature modal | `src/features/customers/components/AddCustomerModal.jsx` | Add Customer modal owned by the customers module. | AddCustomerModal | 5 | lucide-react-native, react, react-i18next, react-native |
| FILE-240 | Feature | customers | Feature public barrel | `src/features/customers/index.js` | Public exports for the customers feature boundary. | AddCustomerModal, AddCustomerScreen, CustomerDeliveryHistoryScreen, CustomerDetailScreen, CustomerHistoryScreen, CustomerListScreen | 6 | — |
| FILE-241 | Feature | customers | Screen | `src/features/customers/screens/AddCustomerScreen.jsx` | Create/edit workflow for Customer. | AddCustomerScreen | 7 | @react-native-community/datetimepicker, @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-contacts |
| FILE-242 | Feature | customers | Screen | `src/features/customers/screens/CustomerDeliveryHistoryScreen.jsx` | History and timeline UI for Customer Delivery. | CustomerDeliveryHistoryScreen | 4 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native |
| FILE-243 | Feature | customers | Screen | `src/features/customers/screens/CustomerDetailScreen.jsx` | Detail and actions UI for Customer. | CustomerDetailScreen | 6 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-fast-image, react-native-safe-area-context |
| FILE-244 | Feature | customers | Screen | `src/features/customers/screens/CustomerHistoryScreen.jsx` | History and timeline UI for Customer. | CustomerHistoryScreen | 5 | lucide-react-native, react, react-i18next, react-native, react-native-linear-gradient |
| FILE-245 | Feature | customers | Screen | `src/features/customers/screens/CustomerListScreen.jsx` | List and management UI for Customer. | CustomerListScreen | 6 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-linear-gradient, react-native-safe-area-context, react-native-svg |
| FILE-246 | Feature | dashboard | Feature public barrel | `src/features/dashboard/index.js` | Public exports for the dashboard feature boundary. | HomeScreen | 1 | — |
| FILE-247 | Feature | dashboard | Screen | `src/features/dashboard/screens/HomeScreen.jsx` | Home user interface in the dashboard module. | HomeScreen | 7 | @react-native-async-storage/async-storage, @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-fast-image, react-native-safe-area-context, react-native-svg |
| FILE-248 | Feature | deliveries | Feature public barrel | `src/features/deliveries/index.js` | Public exports for the deliveries feature boundary. | OrdersScreen, PastDeliveriesScreen, UnbilledDeliveriesScreen | 3 | — |
| FILE-249 | Feature | deliveries | Screen | `src/features/deliveries/screens/OrdersScreen.jsx` | Orders user interface in the deliveries module. | OrdersScreen | 6 | @react-native-community/datetimepicker, @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-safe-area-context |
| FILE-250 | Feature | deliveries | Screen | `src/features/deliveries/screens/PastDeliveriesScreen.jsx` | Past Deliveries user interface in the deliveries module. | PastDeliveriesScreen | 6 | @react-native-community/datetimepicker, @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-safe-area-context |
| FILE-251 | Feature | deliveries | Screen | `src/features/deliveries/screens/UnbilledDeliveriesScreen.jsx` | Unbilled Deliveries user interface in the deliveries module. | UnbilledDeliveriesScreen | 6 | @react-native-community/datetimepicker, @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-linear-gradient |
| FILE-252 | Feature | delivery-subscriptions | Feature public barrel | `src/features/delivery-subscriptions/index.js` | Public exports for the delivery-subscriptions feature boundary. | AddSubscriptionScreen, SubscriptionDetailScreen, SubscriptionListScreen | 3 | — |
| FILE-253 | Feature | delivery-subscriptions | Screen | `src/features/delivery-subscriptions/screens/AddSubscriptionScreen.jsx` | Create/edit workflow for Subscription. | AddSubscriptionScreen | 7 | @react-native-community/datetimepicker, @react-navigation/native, lucide-react-native, react, react-i18next, react-native |
| FILE-254 | Feature | delivery-subscriptions | Screen | `src/features/delivery-subscriptions/screens/SubscriptionDetailScreen.jsx` | Detail and actions UI for Subscription. | SubscriptionDetailScreen | 5 | @react-native-community/datetimepicker, @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-safe-area-context |
| FILE-255 | Feature | delivery-subscriptions | Screen | `src/features/delivery-subscriptions/screens/SubscriptionListScreen.jsx` | List and management UI for Subscription. | SubscriptionListScreen | 6 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-linear-gradient, react-native-svg |
| FILE-256 | Feature | invoices | Component | `src/features/invoices/components/InvoiceAdjustmentActionsSheet.jsx` | Reusable Invoice Adjustment Actions Sheet component. | InvoiceAdjustmentActionsSheet | 1 | lucide-react-native, react, react-i18next, react-native, react-native-safe-area-context |
| FILE-257 | Feature | invoices | Feature modal | `src/features/invoices/components/InvoiceAdjustmentModal.jsx` | Invoice Adjustment modal owned by the invoices module. | InvoiceAdjustmentModal | 1 | lucide-react-native, react, react-i18next, react-native, react-native-safe-area-context |
| FILE-258 | Feature | invoices | Feature public barrel | `src/features/invoices/index.js` | Public exports for the invoices feature boundary. | GenerateInvoiceScreen, InvoiceDetailScreen, InvoiceListScreen | 3 | — |
| FILE-259 | Feature | invoices | Screen | `src/features/invoices/screens/GenerateInvoiceScreen.jsx` | Generate Invoice user interface in the invoices module. | GenerateInvoiceScreen | 8 | @react-native-community/datetimepicker, @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-svg |
| FILE-260 | Feature | invoices | Screen | `src/features/invoices/screens/InvoiceDetailScreen.jsx` | Detail and actions UI for Invoice. | InvoiceDetailScreen | 11 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-blob-util, react-native-html-to-pdf, react-native-print, react-native-safe-area-context, react-native-share, react-native-svg |
| FILE-261 | Feature | invoices | Screen | `src/features/invoices/screens/InvoiceListScreen.jsx` | List and management UI for Invoice. | InvoiceListScreen | 8 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-linear-gradient, react-native-safe-area-context |
| FILE-262 | Feature | one-time-orders | Feature public barrel | `src/features/one-time-orders/index.js` | Public exports for the one-time-orders feature boundary. | AddOneTimeOrderScreen, OneTimeOrderListScreen | 2 | — |
| FILE-263 | Feature | one-time-orders | Screen | `src/features/one-time-orders/screens/AddOneTimeOrderScreen.jsx` | Create/edit workflow for One Time Order. | AddOneTimeOrderScreen | 7 | @react-native-community/datetimepicker, @react-navigation/native, lucide-react-native, react, react-i18next, react-native |
| FILE-264 | Feature | one-time-orders | Screen | `src/features/one-time-orders/screens/OneTimeOrderListScreen.jsx` | List and management UI for One Time Order. | OneTimeOrderListScreen | 8 | @react-native-community/datetimepicker, @react-navigation/native, lucide-react-native, react, react-i18next, react-native |
| FILE-265 | Feature | payments | Feature public barrel | `src/features/payments/index.js` | Public exports for the payments feature boundary. | PaymentsScreen | 1 | — |
| FILE-266 | Feature | payments | Screen | `src/features/payments/screens/PaymentsScreen.jsx` | Payments user interface in the payments module. | PaymentsScreen | 7 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-safe-area-context, react-native-svg |
| FILE-267 | Feature | plan-billing | Feature public barrel | `src/features/plan-billing/index.js` | Public exports for the plan-billing feature boundary. | SubscriptionDashboardScreen | 1 | — |
| FILE-268 | Feature | plan-billing | Screen | `src/features/plan-billing/screens/SubscriptionDashboardScreen.jsx` | Subscription Dashboard user interface in the plan-billing module. | SubscriptionDashboardScreen | 7 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-razorpay |
| FILE-269 | Feature | products | Feature modal | `src/features/products/components/AddProductModal.jsx` | Add Product modal owned by the products module. | AddProductModal | 4 | lucide-react-native, react, react-i18next, react-native |
| FILE-270 | Feature | products | Feature public barrel | `src/features/products/index.js` | Public exports for the products feature boundary. | AddProductModal, AddProductScreen, ProductCatalogScreen, ProductDetailScreen | 4 | — |
| FILE-271 | Feature | products | Screen | `src/features/products/screens/AddProductScreen.jsx` | Create/edit workflow for Product. | AddProductScreen | 5 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-fast-image, react-native-image-picker, react-native-safe-area-context |
| FILE-272 | Feature | products | Screen | `src/features/products/screens/ProductCatalogScreen.jsx` | Product Catalog user interface in the products module. | ProductCatalogScreen | 6 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-fast-image, react-native-linear-gradient, react-native-safe-area-context, react-native-svg |
| FILE-273 | Feature | products | Screen | `src/features/products/screens/ProductDetailScreen.jsx` | Detail and actions UI for Product. | ProductDetailScreen | 5 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-fast-image, react-native-safe-area-context |
| FILE-274 | Feature | reports | Component | `src/features/reports/components/FinancialReport.jsx` | Reusable Financial Report component. | FinancialReport | 3 | lucide-react-native, react, react-i18next, react-native, react-native-gifted-charts |
| FILE-275 | Feature | reports | Component | `src/features/reports/components/InventoryReport.jsx` | Reusable Inventory Report component. | InventoryReport | 3 | lucide-react-native, react, react-i18next, react-native |
| FILE-276 | Feature | reports | Component | `src/features/reports/components/OperationsReport.jsx` | Reusable Operations Report component. | OperationsReport | 3 | lucide-react-native, react, react-i18next, react-native, react-native-gifted-charts |
| FILE-277 | Feature | reports | Component | `src/features/reports/components/OutstandingReport.jsx` | Reusable Outstanding Report component. | OutstandingReport | 3 | lucide-react-native, react, react-i18next, react-native |
| FILE-278 | Feature | reports | Feature public barrel | `src/features/reports/index.js` | Public exports for the reports feature boundary. | FinancialReport, InventoryReport, OperationsReport, OutstandingReport, ReportsScreen | 5 | — |
| FILE-279 | Feature | reports | Screen | `src/features/reports/screens/ReportsScreen.jsx` | Reports user interface in the reports module. | ReportsScreen | 9 | @react-native-community/datetimepicker, @react-navigation/native, lucide-react-native, react, react-i18next, react-native |
| FILE-280 | Feature | routes | Feature modal | `src/features/routes/components/AddRouteModal.jsx` | Add Route modal owned by the routes module. | AddRouteModal | 4 | lucide-react-native, react, react-i18next, react-native |
| FILE-281 | Feature | routes | Feature public barrel | `src/features/routes/index.js` | Public exports for the routes feature boundary. | AddRouteModal, AddRouteScreen, RouteBuilderScreen, RouteDetailScreen, RouteListScreen | 5 | — |
| FILE-282 | Feature | routes | Screen | `src/features/routes/screens/AddRouteScreen.jsx` | Create/edit workflow for Route. | AddRouteScreen | 5 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-safe-area-context |
| FILE-283 | Feature | routes | Screen | `src/features/routes/screens/RouteBuilderScreen.jsx` | Route Builder user interface in the routes module. | RouteBuilderScreen | 5 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-linear-gradient |
| FILE-284 | Feature | routes | Screen | `src/features/routes/screens/RouteDetailScreen.jsx` | Detail and actions UI for Route. | RouteDetailScreen | 5 | @react-native-community/datetimepicker, @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-linear-gradient, react-native-safe-area-context |
| FILE-285 | Feature | routes | Screen | `src/features/routes/screens/RouteListScreen.jsx` | List and management UI for Route. | RouteListScreen | 6 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-linear-gradient, react-native-safe-area-context, react-native-svg |
| FILE-286 | Feature | settings | Feature public barrel | `src/features/settings/index.js` | Public exports for the settings feature boundary. | InvoiceSettingsScreen, ProfileScreen, SettingsScreen | 3 | — |
| FILE-287 | Feature | settings | Screen | `src/features/settings/screens/InvoiceSettingsScreen.jsx` | Invoice Settings user interface in the settings module. | InvoiceSettingsScreen | 5 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-image-picker, react-native-safe-area-context |
| FILE-288 | Feature | settings | Screen | `src/features/settings/screens/ProfileScreen.jsx` | Profile user interface in the settings module. | ProfileScreen | 1 | react, react-native |
| FILE-289 | Feature | settings | Screen | `src/features/settings/screens/SettingsScreen.jsx` | Settings user interface in the settings module. | SettingsScreen | 8 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-fast-image, react-native-safe-area-context |
| FILE-290 | Feature | staff | Feature public barrel | `src/features/staff/index.js` | Public exports for the staff feature boundary. | AddStaffScreen, StaffManagementScreen | 2 | — |
| FILE-291 | Feature | staff | Screen | `src/features/staff/screens/AddStaffScreen.jsx` | Create/edit workflow for Staff. | AddStaffScreen | 5 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-safe-area-context |
| FILE-292 | Feature | staff | Screen | `src/features/staff/screens/StaffManagementScreen.jsx` | Staff Management user interface in the staff module. | StaffManagementScreen | 7 | @react-navigation/native, lucide-react-native, react, react-i18next, react-native, react-native-linear-gradient, react-native-safe-area-context |
| FILE-293 | Documentation | project-docs | Documentation | `src/README.md` | Concise source ownership and validation guide. | — | 0 | — |
| FILE-294 | Project root | configuration | Service/API client | `src/services/api.js` | api service/api client. | api, setApiRole, setLogoutCallback, setTokenRefreshedCallback | 0 | @react-native-async-storage/async-storage, react-native-blob-util |
| FILE-295 | Shared | assets | Image asset | `src/shared/assets/3d/catalog.png` | catalog image asset. | — | 0 | — |
| FILE-296 | Shared | assets | Image asset | `src/shared/assets/3d/customers.png` | customers image asset. | — | 0 | — |
| FILE-297 | Shared | assets | Image asset | `src/shared/assets/3d/routes.png` | routes image asset. | — | 0 | — |
| FILE-298 | Shared | assets | Image asset | `src/shared/assets/3d/staff.png` | staff image asset. | — | 0 | — |
| FILE-299 | Shared | assets | Image asset | `src/shared/assets/3d/subscriptions.png` | subscriptions image asset. | — | 0 | — |
| FILE-300 | Shared | assets | Image asset | `src/shared/assets/images/home_banner.jpg` | home banner image asset. | — | 0 | — |
| FILE-301 | Shared | assets | Image asset | `src/shared/assets/images/LoginScreenImage.png` | Login Screen Image image asset. | — | 0 | — |
| FILE-302 | Shared | assets | Image asset | `src/shared/assets/images/OtpScreenImage.png` | Otp Screen Image image asset. | — | 0 | — |
| FILE-303 | Shared | components | Component | `src/shared/components/CurvedHeader.jsx` | Reusable gradient curved header used across application screens. | CurvedHeader | 1 | @react-navigation/native, react, react-native, react-native-fast-image, react-native-safe-area-context, react-native-svg |
| FILE-304 | Shared | components | Component | `src/shared/components/DeliveryStatusSlider.jsx` | Reusable interactive delivery-status control. | DeliveryStatusSlider | 1 | lucide-react-native, react, react-native, react-native-gesture-handler, react-native-reanimated |
| FILE-305 | Shared | components | Component | `src/shared/components/ImageWithSkeleton.jsx` | Image wrapper that displays a loading skeleton until the asset is ready. | ImageWithSkeleton | 0 | react, react-native, react-native-fast-image |
| FILE-306 | Shared | components | Component | `src/shared/components/LanguageSelector.jsx` | Reusable multi-language selector used by authentication and settings UI. | LanguageSelector, SUPPORTED_LANGUAGES | 1 | @react-native-async-storage/async-storage, lucide-react-native, react, react-i18next, react-native |
| FILE-307 | Shared | constants | Constant/token map | `src/shared/constants/colors.js` | Shared application color tokens. | COLORS | 0 | — |
| FILE-308 | Shared | constants | Constant/token map | `src/shared/constants/subscriptionEntitlements.js` | Entitlement identifiers and localized feature-name mappings. | ENTITLEMENT_KEYS, ENTITLEMENT_TRANSLATION_KEYS, PROACTIVE_ENTITLEMENT_KEYS | 0 | — |
| FILE-309 | Shared | i18n | Localization setup | `src/shared/i18n/billingTranslations.js` | billing Translations localization setup. | billingTranslations | 0 | — |
| FILE-310 | Shared | i18n | Localization setup | `src/shared/i18n/index.js` | i18next initialization, locale registration, fallback, and saved-language restoration. | i18n | 9 | @react-native-async-storage/async-storage, i18next, react-i18next |
| FILE-311 | Shared | i18n | Locale dictionary | `src/shared/i18n/locales/bn.js` | Bengali translation dictionary. | bn | 0 | — |
| FILE-312 | Shared | i18n | Locale dictionary | `src/shared/i18n/locales/en.js` | English translation dictionary. | en | 0 | — |
| FILE-313 | Shared | i18n | Locale dictionary | `src/shared/i18n/locales/gu.js` | Gujarati translation dictionary. | gu | 0 | — |
| FILE-314 | Shared | i18n | Locale dictionary | `src/shared/i18n/locales/hi.js` | Hindi translation dictionary. | hi | 0 | — |
| FILE-315 | Shared | i18n | Locale dictionary | `src/shared/i18n/locales/mr.js` | Marathi translation dictionary. | mr | 0 | — |
| FILE-316 | Shared | i18n | Locale dictionary | `src/shared/i18n/locales/pa.js` | Punjabi translation dictionary. | pa | 0 | — |
| FILE-317 | Shared | i18n | Locale dictionary | `src/shared/i18n/locales/ta.js` | Tamil translation dictionary. | ta | 0 | — |
| FILE-318 | Shared | i18n | Locale dictionary | `src/shared/i18n/locales/te.js` | Telugu translation dictionary. | te | 0 | — |
| FILE-319 | Shared | services | Service/API client | `src/shared/services/api.js` | Compatibility facade preserving the existing public api and callback exports. | api, apiDebugError, apiDebugLog, apiDebugWarn, applyNewToken, logAccessTokenDetails, notifyPlanLimit, refreshAccessToken, setApiRole, setLogoutCallback, setPlanLimitCallback, setTokenRefreshedCallback | 2 | — |
| FILE-320 | Shared | services | Service/API client | `src/shared/services/api/accountingApi.js` | Ledger, payment, and customer-deposit API operations. | accountingApi | 1 | — |
| FILE-321 | Shared | services | Service/API client | `src/shared/services/api/authApi.js` | Authentication, OTP, registration, logout, and account deletion API operations. | authApi | 1 | — |
| FILE-322 | Shared | services | Service/API client | `src/shared/services/api/client.js` | API base URL, role prefix, authentication, token refresh queue, entitlement handling, logging, and HTTP request helpers. | API_BASE_URL, apiDebugError, apiDebugLog, apiDebugWarn, applyNewToken, deleteRequest, fetchWithAuth, getApiPrefix, getRequest, logAccessTokenDetails, notifyPlanLimit, patchMultipartRequest, patchRequest, postMultipartRequest, postRequest, putRequest, refreshAccessToken, runSubscriptionRequest, setApiRole, setLogoutCallback, setPlanLimitCallback, setTokenRefreshedCallback, shouldLogApi | 0 | @react-native-async-storage/async-storage, jwt-decode |
| FILE-323 | Shared | services | Service/API client | `src/shared/services/api/customersApi.js` | Customer CRUD, sequencing, delivery history, jar collection, and activity API operations. | customersApi | 1 | — |
| FILE-324 | Shared | services | Service/API client | `src/shared/services/api/dashboardApi.js` | Dashboard summary API operations. | dashboardApi | 1 | — |
| FILE-325 | Shared | services | Service/API client | `src/shared/services/api/deliveriesApi.js` | Delivery generation, listing, tracking, and status API operations. | deliveriesApi | 1 | — |
| FILE-326 | Shared | services | Service/API client | `src/shared/services/api/deliverySubscriptionsApi.js` | Customer delivery-subscription, pause, and override API operations. | deliverySubscriptionsApi | 1 | — |
| FILE-327 | Shared | services | Service/API client | `src/shared/services/api/index.js` | Combines all domain API modules into the existing public api object. | api | 14 | — |
| FILE-328 | Shared | services | Service/API client | `src/shared/services/api/invoicesApi.js` | Invoice generation, listing, summary, detail, and PDF-download API operations. | invoicesApi | 1 | react-native, react-native-blob-util |
| FILE-329 | Shared | services | Service/API client | `src/shared/services/api/oneTimeOrdersApi.js` | One-time order API operations. | oneTimeOrdersApi | 1 | — |
| FILE-330 | Shared | services | Service/API client | `src/shared/services/api/planBillingApi.js` | Vendor plan, entitlement, checkout, billing, cancellation, payment-history, and usage API operations. | planBillingApi | 1 | — |
| FILE-331 | Shared | services | Service/API client | `src/shared/services/api/productsApi.js` | Product catalog API operations, including multipart create/update. | productsApi | 1 | — |
| FILE-332 | Shared | services | Service/API client | `src/shared/services/api/profileApi.js` | Vendor profile and public category API operations. | profileApi | 1 | — |
| FILE-333 | Shared | services | Service/API client | `src/shared/services/api/reportsApi.js` | Financial, outstanding, operations, and inventory report API operations. | reportsApi | 1 | — |
| FILE-334 | Shared | services | Service/API client | `src/shared/services/api/routesApi.js` | Route CRUD and staff-assignment API operations. | routesApi | 1 | — |
| FILE-335 | Shared | services | Service/API client | `src/shared/services/api/staffApi.js` | Staff CRUD API operations. | staffApi | 1 | — |
| FILE-336 | Shared | utils | Utility | `src/shared/utils/billing.js` | billing utility. | getInvoiceAmounts, getInvoiceStatusText, getInvoiceTotalQuantity, getStatementDescription, getStatementDirection, parseLocalDate, toLocalDateString, validateInvoicePeriod | 0 | — |
| FILE-337 | Shared | utils | Utility | `src/shared/utils/entitlements.js` | entitlements utility. | decodeTokenEntitlements, entitlementsFromSubscription, getTokenEntitlement | 1 | jwt-decode |
| FILE-338 | Shared | utils | Utility | `src/shared/utils/seedDatabase.js` | Local seed/helper data utility. | seedDatabase | 1 | — |
| FILE-339 | Project root | configuration | Binary/archive | `SUSE.zip` | SUSE binary/archive. | — | 0 | — |
| FILE-340 | Documentation | project-docs | Documentation | `workflow.md` | Task history plus generated current-project architecture source for Excel exports. | — | 0 | — |

### 12.11 Automatic Maintenance Contract

| Trigger | Required Action | Result |
| --- | --- | --- |
| Any maintained project file is added, moved, renamed, or removed | `npm run docs:structure` | Regenerates all Section 12 tables from the live filesystem. |
| Any source import is changed | `npm run check:imports` | Regenerates Section 12, then verifies every relative import path. |
| Any functional or UI change is completed | Append a dated entry to Section 10 and run the structure generator. | Keeps history and current architecture synchronized. |
| Before Excel generation | `npm run docs:structure` | Ensures workbook input reflects the latest maintained project state. |

Generated-section boundaries: `<!-- PROJECT_STRUCTURE:START -->` to `<!-- PROJECT_STRUCTURE:END -->`.
<!-- PROJECT_STRUCTURE:END -->

### Date: 2026-09-09 (Wednesday)
- **Component / File**: HomeScreen.jsx
- **User Request**: Update the dashboard overview card to replace the rickshaw image with the camper truck image and adjust its sizing.
- **Root Cause / Task**: The UI overview card needed an updated aesthetic using the new camper truck asset instead of the rickshaw asset.
- **Changes Made**:
  1. Updated the FastImage source in the overview card from delivery_rickshaw.jpg to camper_truck.jpg.
  2. Adjusted the image dimensions (width: 110, height: 80, marginLeft: 0) to ensure the camper truck fits perfectly inside the card layout without overlapping text.
  3. Made the camper truck image larger (width: 150, height: 130), set resizeMode to 'cover', and absolutely positioned it to bleed to the edges of the card.
  5. The user reverted the full-background design due to aspect ratio distortion on the truck. Restored the truck to be an inline element on the right side but with improved layout bounds (width: 140, height: 95, resizeMode: contain) to ensure it displays crisply without stretching.
  5. Scaled the width of car.png to 140 while pinning the height to 85. This makes the car significantly larger due to its landscape aspect ratio, while ensuring the overall card container height doesn't expand vertically.
  6. Absolutely positioned the car.png image (`right: -16`, `bottom: -16`) and increased its dimensions (width: 160, height: 110). This anchors the car perfectly to the bottom-right corner of the card, making it look much larger and more integrated without distorting the internal flex layout or increasing the card's height.
  7. Engineered a new FloatingCarImage animated component in HomeScreen.jsx that wraps the vehicle asset in an infinite, smooth floating animation loop (bobbing up and down by 8px using Native Driver), giving the dashboard a highly dynamic and polished feel.

### Date: 2026-09-12 (Saturday)
- **Component / File**: InvoiceDetailScreen.jsx, invoicesApi.js
- **User Request**: Restructure the invoice detail layout to restore the classic "Notes" section, position Payments and Terms & Conditions at the bottom, and style the elements to look beautiful and professional.
- **Root Cause / Task**: The user wanted to revert some layout changes and implement a highly structured, aesthetically pleasing invoice view (for both the screen and the generated PDF) with clear borders, ordered totals, and distinct callout sections.
- **Changes Made**:
  1. Updated `InvoiceDetailScreen.jsx` to restore the "Notes" section on the left side of the "Totals" box.
  2. Moved the "Payment Details" and "Terms & Conditions" to a new dedicated, full-width block positioned strictly *below* the totals.
  3. Switched the Payment and T&C block layout to a vertical column (`flexDirection: 'column'`) so that T&C explicitly sits below Payment Details instead of side-by-side.
  4. Reordered the "Totals Table Box" so that **Total Discount** reliably renders immediately after **Current Charges**, followed by **Extra Charges**.
  5. Removed conditional rendering (`> 0`) for Discount and Extra Charges in the totals table. They now *always* render (displaying as `0.00` if empty) to ensure strict layout consistency across all invoices.
  6. Upgraded the visual styling of the "Notes" box to a premium "callout" design. Applied a soft blue background (`#F0F9FF`), a distinct sky-blue left border (`#0EA5E9`), and high-contrast dark blue text (`#0369A1`) for perfect readability.
  7. Increased border widths around the layout blocks to `1.5px` and used a darker `#94A3B8` slate color to provide a crisp, clearly distinguished visual hierarchy on screen and in print.
  8. Refactored the corresponding HTML template inside `InvoiceDetailScreen.jsx` so that the generated PDF perfectly matches the exact new structure and styling of the screen UI.

### Date: 2026-09-24 (Thursday)
- **Component / File**: PastDeliveriesScreen.jsx
- **User Request**: Chek the code base and fix as in modify past deliveries section there is issue with curved header it i not proper fix that
- **Root Cause / Task**: The "Modify Past Deliveries" screen had an incorrect header title ("All Deliveries") and was missing standard padding from its `CurvedHeader`, causing layout issues.
- **Changes Made**:
  1. Updated the `title` prop in `CurvedHeader` to correctly use `t('deliveries.pastDeliveries') || 'Modify / Past Deliveries'` so it matches the drawer label.
  2. Adjusted the `height` to `120` and added `paddingTop: 10` to `contentStyle` within `CurvedHeader` to properly accommodate the status bar and match the styling of other standard screens in the app.

### Date: 2026-09-24 (Thursday) - Route Detail Screen Layout Fix
- **Component / File**: RouteDetailScreen.jsx
- **User Request**: fix inside route details section the crad not visible for both android and ios fix that content issue
- **Root Cause / Task**: The "premium route card" gradient wasn't rendering correctly (invisible card content/background) because `LinearGradient` was placed as an absolutely positioned child behind flex row items. This combination often leads to layout collapsing or overlapping issues on both iOS and Android when the parent has `overflow: 'hidden'`. 
- **Changes Made**:
  1. Updated the import of `LinearGradient` to use the default export `import LinearGradient` to avoid any named export resolution issues with `react-native-linear-gradient`.
  2. Changed the markup to use `<LinearGradient>` directly as the container element for the route card (instead of a background child), ensuring its flex children (`premiumRouteIconBox` and `premiumRouteInfo`) naturally determine the height and dimensions of the gradient wrapper.

### Date: 2026-09-24 (Thursday) - iOS Header Visibility Fix
- **Component / File**: CurvedHeader.jsx
- **User Request**: for ios there is cut half of part not visble fix that
- **Root Cause / Task**: The `CurvedHeader` was clamping the SVG background height to a maximum of 55 pixels (`Math.min(height, 55)`) for all non-Home screens. Because iOS devices have larger top safe area insets (notches/dynamic islands), the combined height of the inset, padding, and content exceeded this clamped height. This caused the white header text to spill out of the blue SVG background and overlap with the app's white background, rendering the bottom half of the text invisible (appearing "cut in half").
- **Changes Made**:
  1. Removed the artificial `Math.min(height, 55)` clamp in `CurvedHeader.jsx`.
  2. The component now fully respects the `height` prop passed from each screen (typically 110-120px), ensuring the SVG background perfectly spans the entire padded content area on all iOS and Android devices.

### Date: 2026-09-24 (Thursday) - Route Detail Card Shadow & Rendering Fix
- **Component / File**: RouteDetailScreen.jsx
- **User Request**: chec k the detail card for android and ios it is not visibke also for ios that card is geeting cut check insde route deatil screen
- **Root Cause / Task**: The "premium route card" had multiple platform-specific rendering issues because of a single View attempting to manage both `overflow: 'hidden'` (to clip the internal background decoration) AND `shadow/elevation` (to give it a floating effect) without a solid `backgroundColor`.
  1. On iOS, `overflow: 'hidden'` clips all box shadows, making the shadow completely invisible ("cut").
  2. On Android, an element with `elevation` but no `backgroundColor` often fails to render completely ("not visible") because the OS cannot calculate a shadow outline from a transparent box.
- **Changes Made**:
  1. Restructured the card layout into the standard React Native container pattern: an outer `premiumRouteCardShadow` container and an inner `premiumRouteCardInner` container.
  2. The outer wrapper handles `elevation` and `shadow` properties and now has a solid `backgroundColor: '#D97706'` (essential for Android) and does *not* use `overflow: 'hidden'` (fixing iOS shadow clipping).
  3. The inner wrapper handles the padding, `flexDirection`, and safely applies `overflow: 'hidden'` to perfectly mask the `LinearGradient` and the absolute `<MapPin>` decoration without destroying the shadow.

### Date: 2026-09-24 (Thursday) - Invoice Screen Header Keyboard Fix
- **Component / File**: GenerateInvoiceScreen.jsx
- **User Request**: now fix for the invoice screen curved header it is bottom attached fix that for ios and android both
- **Root Cause / Task**: In the "Generate Invoice" screen, the `CurvedHeader` component was inadvertently nested *inside* the `KeyboardAvoidingView`. When the user opened the keyboard on this screen, the `KeyboardAvoidingView` would recalculate the layout (pushing up on iOS with `padding`, or shrinking/anchoring content to the bottom on Android with `height`), which caused the fixed header to detach from the top and get pushed around or appear attached to the bottom/keyboard.
- **Changes Made**:
  1. Extracted `CurvedHeader` outside of the `KeyboardAvoidingView` wrapper in `GenerateInvoiceScreen.jsx`.
  2. The `KeyboardAvoidingView` now only wraps the scrollable form content, ensuring the premium header remains perfectly fixed at the top of the screen at all times on both iOS and Android.

### Date: 2026-09-24 (Thursday) - Invoice Header Layout Standardization
- **Component / File**: InvoiceListScreen.jsx, InvoiceDetailScreen.jsx, GenerateInvoiceScreen.jsx
- **User Request**: no for curved header in invoice i want as invoice text is at bottom last in ios and android both as we adjust for routebuilder i need adjust for this also for invoice screen for invoice list screen invoice detail screen
- **Root Cause / Task**: The user noticed that the title text inside the `CurvedHeader` on the Invoice screens appeared pushed too far to the bottom/top compared to other screens. This was because the Invoice screens were using a taller height (`130`-`140`) and lacked the `paddingTop: 10` that was previously used to perfectly center the text in the `RouteBuilderScreen` header.
- **Changes Made**:
  1. Updated the `CurvedHeader` properties across all three main invoice screens (`InvoiceListScreen`, `InvoiceDetailScreen`, and `GenerateInvoiceScreen`).
  2. Standardized the `height` to `120` across all of them (matching `RouteBuilderScreen`).
  3. Added `paddingTop: 10` to the `contentStyle` across all of them (matching `RouteBuilderScreen`), ensuring the title text is correctly aligned vertically on both iOS and Android.

### Date: 2026-09-24 (Thursday) - Invoice List Card Shadow Android Fix
- **Component / File**: InvoiceListScreen.jsx
- **User Request**: now i want that for android in list screen of invoice cards are not proper check that what issy=ue as some undescet border with gey coor is seen fix that keep like ios matched
- **Root Cause / Task**: The invoice cards in `InvoiceListScreen` had `borderWidth: 1`, `elevation: 2`, and an absolute `<LinearGradient>`, but lacked a solid `backgroundColor` on the main container itself. On Android, applying `elevation` to a container with a transparent background causes the OS to draw a shadow outline of the border itself, resulting in a dirty, blurry grey border effect instead of a clean drop shadow.
- **Changes Made**:
  1. Added `backgroundColor: '#FFFFFF'` to `styles.card` in `InvoiceListScreen.jsx`.
  2. This provides Android's rendering engine a solid canvas to properly cast the shadow, restoring the clean, premium drop-shadow effect so it correctly matches the smooth iOS shadow presentation.

### Date: 2026-09-24 (Thursday) - Invoice Cards Status Indicator UI Polish
- **Component / File**: InvoiceListScreen.jsx
- **User Request**: also as crads are not like we have revious where as per status there are some color combo so that they are clear for user
- **Root Cause / Task**: The invoice cards were only using very faint, subtle background gradients and 1px borders to denote status, which wasn't prominent enough for users. This broke visual consistency with other screens (like Orders and Subscriptions) that use thick, heavily saturated left-borders to clearly communicate status states.
- **Changes Made**:
  1. Updated `InvoiceListScreen.jsx` to apply `borderLeftWidth: 4` and `borderLeftColor: statusColors.dot` to the invoice cards.
  2. This adds a bold, thick left border using the strong status color (Green for Paid, Blue for Partially Paid, Orange for Pending), matching the app's established UI conventions and making the invoice status instantly recognizable at a glance.

### Date: 2026-09-24 (Thursday) - Subscription Header Layout Standardization
- **Component / File**: SubscriptionListScreen.jsx, SubscriptionDetailScreen.jsx, SubscriptionDashboardScreen.jsx
- **User Request**: now do the same fix for subscription curved header as text is bottom there also for all three screens relted to it
- **Root Cause / Task**: Similar to the invoice screens, the subscription screens were using inconsistent and taller heights for the `CurvedHeader` (e.g. `130`, `140`) and lacked the `paddingTop: 10` style offset, causing the title text to sit awkwardly lower in the header compared to the Route Builder layout.
- **Changes Made**:
  1. Updated `SubscriptionListScreen.jsx`, `SubscriptionDetailScreen.jsx`, and `SubscriptionDashboardScreen.jsx` to perfectly match the `RouteBuilderScreen` header layout standards.
  2. Adjusted `height={120}` and added `contentStyle={{ paddingTop: 10, paddingBottom: 25 }}` to each screen's `CurvedHeader` instance.
  3. The subscription headers will now have perfectly aligned text placement that matches the rest of the standardized app UI.

### Date: 2026-09-24 (Thursday) - One Time Orders Header Layout Standardization
- **Component / File**: AddOneTimeOrderScreen.jsx, OneTimeOrderListScreen.jsx
- **User Request**: Now for one time order screen same curved headerf issue
- **Root Cause / Task**: The one-time order screens were still using the legacy, taller `CurvedHeader` properties (`height={140}` and `paddingBottom: 35/25` without top padding offset), which caused the header text to sit too low and unaligned relative to the globally standardized layout (e.g. RouteBuilder/Invoices).
- **Changes Made**:
  1. Updated `AddOneTimeOrderScreen.jsx` and `OneTimeOrderListScreen.jsx` to match the established header spacing standard.
  2. Adjusted `height={120}` and applied `contentStyle={{ paddingTop: 10, paddingBottom: 25 }}` to center the text elegantly in both screens.

### Date: 2026-09-24 (Thursday) - Products Header Layout Standardization
- **Component / File**: ProductCatalogScreen.jsx, AddProductScreen.jsx
- **User Request**: now forproduct screen do the same
- **Root Cause / Task**: The product screens had inconsistent header heights (`140` and `110`) and were missing the top padding offset needed to align the header text to the established baseline. 
- **Changes Made**:
  1. Updated `ProductCatalogScreen.jsx` and `AddProductScreen.jsx` to match the exact same `CurvedHeader` styling as the other finalized screens.
  2. Both are now strictly locked to `height={120}` with `contentStyle={{ paddingTop: 10, paddingBottom: 25 }}`.
  3. (`ProductDetailScreen.jsx` was verified and already matched the correct dimensions).

### Date: 2026-09-24 (Thursday) - Staff Management Header Layout Standardization
- **Component / File**: StaffManagementScreen.jsx
- **User Request**: for staff managemnt screen now
- **Root Cause / Task**: The `StaffManagementScreen` was using a taller `CurvedHeader` (`height={140}`) without top padding, causing the header text to sit too low relative to the globally standardized layout (e.g., RouteBuilder/Invoices). 
- **Changes Made**:
  1. Updated `StaffManagementScreen.jsx` to use `height={120}` and applied `contentStyle={{ paddingTop: 10, paddingBottom: 25 }}` to vertically center the header text perfectly.
  2. (`AddStaffScreen.jsx` was already matching the correct specifications and required no changes).

### Date: 2026-09-24 (Thursday) - Reports Header Layout Standardization
- **Component / File**: ReportsScreen.jsx
- **User Request**: for business report i want the same do be done now
- **Root Cause / Task**: The `ReportsScreen` was using a smaller `CurvedHeader` (`height={110}`) without top padding, causing the header text to sit too low relative to the globally standardized layout (e.g., RouteBuilder/Invoices). 
- **Changes Made**:
  1. Updated `ReportsScreen.jsx` to use `height={120}` and applied `contentStyle={{ paddingTop: 10, paddingBottom: 25 }}` to vertically center the header text perfectly.

### Date: 2026-09-24 (Thursday) - Subscription Title Translation Update
- **Component / File**: src/shared/i18n/locales/*.js (en.js, hi.js, gu.js, mr.js, bn.js, pa.js, ta.js, te.js)
- **User Request**: mke subscribiton and billing to plans & pricing also fix its relted transltions
- **Root Cause / Task**: The user wanted the "Subscription & Billing" section to be renamed to "Plans & Pricing" across the app to make its purpose clearer to the users. 
- **Changes Made**:
  1. Updated the `subscriptionBilling.title` key across all 8 language translation files.
  2. Changed English translation to "Plans & Pricing".
  3. Translated and applied "Plans & Pricing" into all corresponding regional languages (Hindi, Gujarati, Marathi, Bengali, Punjabi, Tamil, Telugu).

### Date: 2026-09-24 (Thursday) - Invoice Settings i18n Translation Fix
- **Component / File**: InvoiceSettingsScreen.jsx
- **User Request**: invoice setting i8n langage transltion not included propely check this and fix that
- **Root Cause / Task**: The `InvoiceSettingsScreen` was rendering fully hardcoded English strings instead of routing text through the `react-i18next` framework. This meant language localization updates were skipping this settings page entirely.
- **Changes Made**:
  1. Imported `useTranslation` from `react-i18next` and extracted the `t` function within the component.
  2. Wrapped all major user-facing UI text strings (Titles, Labels, Hints, Payment Modes, and Button Text) in the `t('key', 'Default Text')` wrapper.
  3. Ensured that `PAYMENT_MODES` defaults are cleanly passed to the `t()` translation function at render-time to prevent scope crashes.
