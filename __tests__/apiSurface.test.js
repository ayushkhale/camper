jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: { fs: { dirs: {}, writeFile: jest.fn() } },
}));

import {
  api,
  notifyPlanLimit,
  setApiRole,
  setLogoutCallback,
  setPlanLimitCallback,
  setTokenRefreshedCallback,
} from '../src/shared/services/api';

const EXPECTED_API_METHODS = [
  'addInvoiceAdjustments',
  'addOverride',
  'addPause',
  'addStaff',
  'assignStaff',
  'cancelSubscriptionPlan',
  'changeSubscriptionPlan',
  'checkoutSubscription',
  'collectDeposit',
  'completeRegistration',
  'createCustomer',
  'createOneTimeOrder',
  'createProduct',
  'createRoute',
  'createSubscription',
  'deleteAccount',
  'deleteCustomer',
  'deleteOverride',
  'deletePause',
  'deleteProduct',
  'deleteRoute',
  'deleteStaff',
  'deleteSubscription',
  'downloadInvoicePDF',
  'endStaffAssignment',
  'fulfillOneTimeOrder',
  'generateDeliveries',
  'generateInvoices',
  'getAccountStatement',
  'getActivePlans',
  'getCategories',
  'getCustomer',
  'getCustomerActivity',
  'getCustomerDeliveries',
  'getCustomerDeliveryHistory',
  'getCustomerJarCollections',
  'getDashboardStats',
  'getDepositLedger',
  'getFinancialReports',
  'getInventoryReports',
  'getInvoiceById',
  'getOperationsReports',
  'getOutstandingReports',
  'getProduct',
  'getRoute',
  'getRoutes',
  'getSubscription',
  'getSubscriptionEntitlement',
  'getSubscriptionPayments',
  'getSubscriptionPlan',
  'getSubscriptionStatus',
  'getSubscriptionUsage',
  'getUninvoicedPreSummary',
  'getUninvoicedSummary',
  'getVendorProfile',
  'listCustomers',
  'listDeliveries',
  'listInvoices',
  'listOneTimeOrders',
  'listOverrides',
  'listPauses',
  'listProducts',
  'listRoutes',
  'listStaff',
  'listSubscriptions',
  'loginRequestOtp',
  'loginVerifyOtp',
  'logout',
  'recordPayment',
  'refundDeposit',
  'resendOtp',
  'settleDepositToBill',
  'signupRequestOtp',
  'signupVerifyOtp',
  'trackDeliveries',
  'updateCustomer',
  'updateCustomerSequence',
  'updateDeliveryStatus',
  'updateOneTimeOrderStatus',
  'updateProduct',
  'updateRoute',
  'updateStaff',
  'updateSubscription',
  'updateVendorProfile',
];

test('preserves the complete public API method surface after service splitting', () => {
  expect(Object.keys(api).sort()).toEqual(EXPECTED_API_METHODS.sort());
  for (const method of EXPECTED_API_METHODS) {
    expect(typeof api[method]).toBe('function');
  }
});

test('preserves API lifecycle and entitlement callback exports', () => {
  expect(typeof notifyPlanLimit).toBe('function');
  expect(typeof setApiRole).toBe('function');
  expect(typeof setLogoutCallback).toBe('function');
  expect(typeof setPlanLimitCallback).toBe('function');
  expect(typeof setTokenRefreshedCallback).toBe('function');
});
