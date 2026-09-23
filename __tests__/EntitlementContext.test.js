import { Buffer } from 'buffer';
import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AuthContext } from '../src/app/providers/AuthContext';
import {
  EntitlementProvider,
  useEntitlements,
} from '../src/app/providers/EntitlementContext';
import { api } from '../src/shared/services/api';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

jest.mock('../src/shared/services/api', () => ({
  api: { getSubscriptionStatus: jest.fn() },
  apiDebugError: jest.fn(),
  apiDebugLog: jest.fn(),
  notifyPlanLimit: jest.fn(),
  setApiRole: jest.fn(),
}));

const tokenWith = (payload) =>
  `e30.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;

let currentEntitlements;
const ReadEntitlements = () => {
  currentEntitlements = useEntitlements();
  return null;
};

const treeForToken = (token) => (
  <AuthContext.Provider value={{
    userToken: token,
    user: { vendorAccountId: 'vendor-id' },
    refreshAuthToken: jest.fn().mockResolvedValue(token),
  }}>
    <EntitlementProvider><ReadEntitlements /></EntitlementProvider>
  </AuthContext.Provider>
);

const renderForToken = async (token) => {
  let renderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(treeForToken(token));
  });
  return renderer;
};

beforeEach(() => {
  jest.clearAllMocks();
  currentEntitlements = null;
});

test('JWT claims unlock features without any entitlement HTTP request', async () => {
  const token = tokenWith({
    exp: Math.floor(Date.now() / 1000) + 3600,
    entitlements: { invoicing: true },
  });
  const renderer = await renderForToken(token);

  expect(currentEntitlements.isEntitlementLocked('invoicing')).toBe(false);
  expect(api.getSubscriptionStatus).not.toHaveBeenCalled();
  await act(async () => renderer.unmount());
});

test('an old JWT uses one subscription request to load all features', async () => {
  api.getSubscriptionStatus.mockResolvedValue({
    data: { status: 'active', planVersion: { features: { invoicing: true } } },
  });
  const token = tokenWith({ exp: Math.floor(Date.now() / 1000) + 3600 });
  const renderer = await renderForToken(token);

  expect(api.getSubscriptionStatus).toHaveBeenCalledTimes(1);
  expect(currentEntitlements.isEntitlementLocked('invoicing')).toBe(false);
  await act(async () => renderer.unmount());
});

test('a plan refresh reloads fallback features before reporting success', async () => {
  api.getSubscriptionStatus
    .mockResolvedValueOnce({
      data: { status: 'active', planVersion: { features: { invoicing: false } } },
    })
    .mockResolvedValueOnce({
      data: { status: 'active', planVersion: { features: { invoicing: true } } },
    });
  const token = tokenWith({ exp: Math.floor(Date.now() / 1000) + 3600 });
  const renderer = await renderForToken(token);

  expect(currentEntitlements.isEntitlementLocked('invoicing')).toBe(true);
  await act(async () => {
    await currentEntitlements.refreshEntitlements();
  });
  expect(api.getSubscriptionStatus).toHaveBeenCalledTimes(2);
  expect(currentEntitlements.isEntitlementLocked('invoicing')).toBe(false);
  await act(async () => renderer.unmount());
});

test('a new JWT clears old locks and applies the changed plan flags', async () => {
  const firstToken = tokenWith({
    exp: Math.floor(Date.now() / 1000) + 3600,
    entitlements: { invoicing: true, 'customer.limit': 5, 'customer.management': true },
  });
  const upgradedToken = tokenWith({
    exp: Math.floor(Date.now() / 1000) + 3600,
    entitlements: { invoicing: true, 'customer.limit': 50, 'customer.management': true },
  });
  const downgradedToken = tokenWith({
    exp: Math.floor(Date.now() / 1000) + 3600,
    entitlements: { invoicing: false, 'customer.limit': 0, 'customer.management': true },
  });
  const renderer = await renderForToken(firstToken);
  await act(async () => currentEntitlements.markEntitlementLocked('invoicing'));
  expect(currentEntitlements.isEntitlementLocked('invoicing')).toBe(true);

  await act(async () => renderer.update(treeForToken(upgradedToken)));
  expect(currentEntitlements.isEntitlementLocked('invoicing')).toBe(false);
  expect(currentEntitlements.entitlements['customer.limit'].value).toBe(50);

  await act(async () => renderer.update(treeForToken(downgradedToken)));
  expect(currentEntitlements.isEntitlementLocked('invoicing')).toBe(true);
  expect(currentEntitlements.isEntitlementLocked('customer.limit')).toBe(true);
  await act(async () => renderer.unmount());
});
