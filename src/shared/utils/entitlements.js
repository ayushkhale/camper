import { jwtDecode } from 'jwt-decode';
import { ENTITLEMENT_KEYS } from '../constants/subscriptionEntitlements';

const MANAGEMENT_FOR_LIMIT = {
  [ENTITLEMENT_KEYS.CUSTOMER_LIMIT]: ENTITLEMENT_KEYS.CUSTOMER_MANAGEMENT,
  [ENTITLEMENT_KEYS.PRODUCT_LIMIT]: ENTITLEMENT_KEYS.PRODUCT_MANAGEMENT,
  [ENTITLEMENT_KEYS.STAFF_LIMIT]: ENTITLEMENT_KEYS.STAFF_MANAGEMENT,
  [ENTITLEMENT_KEYS.ROUTE_LIMIT]: ENTITLEMENT_KEYS.ROUTE_MANAGEMENT,
};

export const decodeTokenEntitlements = (token, now = Date.now()) => {
  if (!token) return { status: 'missing', entitlements: {}, expiresAt: 0 };

  try {
    const payload = jwtDecode(token);
    const expiresAt = Number(payload?.exp) * 1000;
    if (!Number.isFinite(expiresAt) || expiresAt <= now) {
      return { status: 'expired', entitlements: {}, expiresAt: expiresAt || 0 };
    }

    const entitlements = payload?.entitlements;
    if (!entitlements || typeof entitlements !== 'object' || Array.isArray(entitlements)) {
      return { status: 'missing-claims', entitlements: {}, expiresAt };
    }

    const knownKeys = Object.values(ENTITLEMENT_KEYS);
    if (!knownKeys.some((key) => Object.prototype.hasOwnProperty.call(entitlements, key))) {
      return { status: 'missing-claims', entitlements: {}, expiresAt };
    }

    return { status: 'valid', entitlements, expiresAt };
  } catch {
    return { status: 'invalid', entitlements: {}, expiresAt: 0 };
  }
};

export const getTokenEntitlement = (entitlements, featureKey) => {
  const value = entitlements?.[featureKey];
  const managementKey = MANAGEMENT_FOR_LIMIT[featureKey];
  const allowed = managementKey
    ? typeof value === 'number' && Number.isFinite(value) && value > 0 &&
      entitlements[managementKey] === true
    : value === true;

  return { allowed, value, checkedAt: Date.now() };
};

export const entitlementsFromSubscription = (response) => {
  const subscription = response?.data || response;
  const status = String(subscription?.status || '').toLowerCase();
  const cancellationEndsAt = Date.parse(subscription?.currentPeriodEnd || '');
  const cancellationPending = Boolean(subscription?.cancelAtPeriodEnd) &&
    Number.isFinite(cancellationEndsAt) && cancellationEndsAt > Date.now();
  if (!['active', 'trial', 'trialing'].includes(status) && !cancellationPending) return {};

  const features = subscription?.planVersion?.features || subscription?.features;
  return features && typeof features === 'object' && !Array.isArray(features)
    ? features
    : null;
};
