export const ENTITLEMENT_KEYS = Object.freeze({
  CUSTOMER_LIMIT: 'customer.limit',
  PRODUCT_LIMIT: 'product.limit',
  STAFF_LIMIT: 'staff.limit',
  ROUTE_LIMIT: 'route.limit',
  INVOICING: 'invoicing',
  REPORTS_ANALYTICS: 'reports.analytics',
  ONE_TIME_ORDERS: 'one_time_orders',
  WHATSAPP_REMINDERS: 'whatsapp.reminders',
  ROUTE_MANAGEMENT: 'route.management',
  STAFF_MANAGEMENT: 'staff.management',
  DELIVERY_TRACKING: 'delivery.tracking',
  LEDGER_MANAGEMENT: 'ledger.management',
  DEPOSIT_MANAGEMENT: 'deposit.management',
  PRODUCT_MANAGEMENT: 'product.management',
  CUSTOMER_MANAGEMENT: 'customer.management',
  SUBSCRIPTION_MANAGEMENT: 'subscription.management',
});

export const PROACTIVE_ENTITLEMENT_KEYS = Object.freeze(
  Object.values(ENTITLEMENT_KEYS),
);

export const ENTITLEMENT_TRANSLATION_KEYS = Object.freeze({
  [ENTITLEMENT_KEYS.CUSTOMER_LIMIT]: 'subscriptionFeatures.customerLimit',
  [ENTITLEMENT_KEYS.PRODUCT_LIMIT]: 'subscriptionFeatures.productLimit',
  [ENTITLEMENT_KEYS.STAFF_LIMIT]: 'subscriptionFeatures.staffLimit',
  [ENTITLEMENT_KEYS.ROUTE_LIMIT]: 'subscriptionFeatures.routeLimit',
  [ENTITLEMENT_KEYS.INVOICING]: 'subscriptionFeatures.invoicing',
  [ENTITLEMENT_KEYS.REPORTS_ANALYTICS]: 'subscriptionFeatures.reportsAnalytics',
  [ENTITLEMENT_KEYS.ONE_TIME_ORDERS]: 'subscriptionFeatures.oneTimeOrders',
  [ENTITLEMENT_KEYS.WHATSAPP_REMINDERS]: 'subscriptionFeatures.whatsappReminders',
  [ENTITLEMENT_KEYS.ROUTE_MANAGEMENT]: 'subscriptionFeatures.routeManagement',
  [ENTITLEMENT_KEYS.STAFF_MANAGEMENT]: 'subscriptionFeatures.staffManagement',
  [ENTITLEMENT_KEYS.DELIVERY_TRACKING]: 'subscriptionFeatures.deliveryTracking',
  [ENTITLEMENT_KEYS.LEDGER_MANAGEMENT]: 'subscriptionFeatures.ledgerManagement',
  [ENTITLEMENT_KEYS.DEPOSIT_MANAGEMENT]: 'subscriptionFeatures.depositManagement',
  [ENTITLEMENT_KEYS.PRODUCT_MANAGEMENT]: 'subscriptionFeatures.productManagement',
  [ENTITLEMENT_KEYS.CUSTOMER_MANAGEMENT]: 'subscriptionFeatures.customerManagement',
  [ENTITLEMENT_KEYS.SUBSCRIPTION_MANAGEMENT]: 'subscriptionFeatures.subscriptionManagement',
});
