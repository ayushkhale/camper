import { Buffer } from 'buffer';
import { ENTITLEMENT_KEYS } from '../src/shared/constants/subscriptionEntitlements';
import {
  decodeTokenEntitlements,
  entitlementsFromSubscription,
  getTokenEntitlement,
} from '../src/shared/utils/entitlements';

const tokenWith = (payload) =>
  `e30.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;

test('reads boolean features and numeric limits from an unexpired JWT', () => {
  const entitlements = {
    invoicing: true,
    'customer.limit': 100,
    'customer.management': true,
  };
  const decoded = decodeTokenEntitlements(tokenWith({
    exp: Math.floor(Date.now() / 1000) + 3600,
    entitlements,
  }));

  expect(decoded.status).toBe('valid');
  expect(getTokenEntitlement(decoded.entitlements, ENTITLEMENT_KEYS.INVOICING).allowed).toBe(true);
  expect(getTokenEntitlement(decoded.entitlements, ENTITLEMENT_KEYS.CUSTOMER_LIMIT))
    .toMatchObject({ allowed: true, value: 100 });
  expect(getTokenEntitlement(decoded.entitlements, ENTITLEMENT_KEYS.STAFF_LIMIT).allowed).toBe(false);
});

test('a positive limit does not override a disabled management feature', () => {
  expect(getTokenEntitlement({
    'customer.limit': 100,
    'customer.management': false,
  }, ENTITLEMENT_KEYS.CUSTOMER_LIMIT).allowed).toBe(false);
  expect(getTokenEntitlement({
    'customer.limit': 0,
    'customer.management': true,
  }, ENTITLEMENT_KEYS.CUSTOMER_LIMIT).allowed).toBe(false);
});

test('expired, malformed, and old tokens cannot unlock features', () => {
  expect(decodeTokenEntitlements(tokenWith({
    exp: Math.floor(Date.now() / 1000) - 1,
    entitlements: { invoicing: true },
  })).status).toBe('expired');
  expect(decodeTokenEntitlements(tokenWith({
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).status).toBe('missing-claims');
  expect(decodeTokenEntitlements('not-a-token').status).toBe('invalid');
});

test('a current subscription can supply one-request fallback features', () => {
  const features = { invoicing: true, 'customer.limit': 100, 'customer.management': true };
  expect(entitlementsFromSubscription({
    data: { status: 'active', planVersion: { features } },
  })).toEqual(features);
  expect(entitlementsFromSubscription({
    data: { status: 'expired', planVersion: { features } },
  })).toEqual({});
  expect(entitlementsFromSubscription({
    data: {
      status: 'cancelled',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(Date.now() + 86400000).toISOString(),
      planVersion: { features },
    },
  })).toEqual(features);
});
