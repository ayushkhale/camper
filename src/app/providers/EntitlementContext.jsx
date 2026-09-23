import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { AuthContext } from './AuthContext';
import { api, apiDebugError, apiDebugLog, notifyPlanLimit } from '../../shared/services/api';
import { PROACTIVE_ENTITLEMENT_KEYS } from '../../shared/constants/subscriptionEntitlements';
import {
  decodeTokenEntitlements,
  entitlementsFromSubscription,
  getTokenEntitlement,
} from '../../shared/utils/entitlements';

const FOREGROUND_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const REFRESH_BEFORE_EXPIRY_MS = 60 * 1000;
const EntitlementContext = createContext(null);

export const EntitlementProvider = ({ children }) => {
  const { userToken, user, refreshAuthToken } = useContext(AuthContext);
  const [locked, setLocked] = useState({ token: null, values: {} });
  const [fallback, setFallback] = useState({ token: null, entitlements: null });
  const [clockTick, setClockTick] = useState(Date.now());
  const lastRefreshAtRef = useRef(Date.now());
  const lastAttemptRef = useRef({ token: null, reason: null });
  const fallbackRequestRef = useRef(null);

  const decoded = useMemo(
    () => decodeTokenEntitlements(userToken, Math.max(Date.now(), clockTick)),
    [userToken, clockTick],
  );
  const lockedValues = useMemo(
    () => locked.token === userToken ? locked.values : {},
    [locked, userToken],
  );

  const loadFallback = useCallback((token) => {
    if (fallbackRequestRef.current?.token === token) {
      return fallbackRequestRef.current.promise;
    }
    apiDebugLog('[Entitlement JWT] Token has no entitlement claims; starting the one-request legacy fallback.');
    const promise = api.getSubscriptionStatus(token, user?.vendorAccountId || 'me')
      .then(entitlementsFromSubscription)
      .catch((error) => {
        apiDebugError('[Entitlement JWT] Legacy fallback failed.', error?.message || String(error));
        return null;
      })
      .then((features) => {
        apiDebugLog('[Entitlement JWT] Legacy fallback completed.', {
          entitlementCount: features ? Object.keys(features).length : 0,
          entitlements: features,
        });
        setFallback({ token, entitlements: features });
        return features;
      })
      .finally(() => {
        if (fallbackRequestRef.current?.token === token) fallbackRequestRef.current = null;
      });
    fallbackRequestRef.current = { token, promise };
    return promise;
  }, [user?.vendorAccountId]);

  const getCurrentEntitlement = useCallback((featureKey) => {
    if (!featureKey || !userToken) {
      return { allowed: false, unavailable: true, checkedAt: Date.now() };
    }
    const features = decoded.status === 'valid'
      ? decoded.entitlements
      : decoded.status === 'missing-claims' && fallback.token === userToken
        ? fallback.entitlements
        : null;
    if (!features) return { allowed: false, unavailable: true, checkedAt: Date.now() };
    return lockedValues[featureKey] || getTokenEntitlement(features, featureKey);
  }, [decoded, fallback, lockedValues, userToken]);

  const invalidateEntitlements = useCallback(() => {
    setLocked({ token: userToken, values: {} });
  }, [userToken]);

  const markEntitlementLocked = useCallback((featureKey, reason = '') => {
    if (!featureKey) return;
    setLocked((current) => ({
      token: userToken,
      values: {
        ...(current.token === userToken ? current.values : {}),
        [featureKey]: { allowed: false, reason, checkedAt: Date.now() },
      },
    }));
  }, [userToken]);

  const markAllEntitlementsLocked = useCallback((reason = '') => {
    const values = {};
    PROACTIVE_ENTITLEMENT_KEYS.forEach((featureKey) => {
      values[featureKey] = { allowed: false, reason, checkedAt: Date.now() };
    });
    setLocked({ token: userToken, values });
  }, [userToken]);

  const checkEntitlement = useCallback(async (featureKey) => {
    let result = getCurrentEntitlement(featureKey);
    if (result.unavailable && userToken) {
      try {
        const freshToken = decoded.status === 'missing-claims'
          ? userToken
          : await refreshAuthToken();
        const freshClaims = decodeTokenEntitlements(freshToken);
        if (freshClaims.status === 'valid') {
          result = getTokenEntitlement(freshClaims.entitlements, featureKey);
        } else if (freshClaims.status === 'missing-claims') {
          const features = await loadFallback(freshToken);
          if (features) result = getTokenEntitlement(features, featureKey);
        }
      } catch {
        // The auth layer handles revoked refresh tokens. A network failure stays locked.
      }
    }
    apiDebugLog('[Entitlement JWT] Feature checked.', {
      featureKey,
      allowed: Boolean(result.allowed),
      unavailable: Boolean(result.unavailable),
      value: result.value,
      tokenStatus: decoded.status,
    });
    return result;
  }, [decoded.status, getCurrentEntitlement, loadFallback, refreshAuthToken, userToken]);

  const refreshEntitlements = useCallback(async () => {
    apiDebugLog('[Entitlement JWT] A fresh entitlement token was requested.');
    const token = await refreshAuthToken({ forceFresh: true });
    const claims = decodeTokenEntitlements(token);
    if (claims.status === 'valid') {
      apiDebugLog('[Entitlement JWT] Fresh JWT entitlements applied.', {
        entitlementCount: Object.keys(claims.entitlements).length,
        entitlements: claims.entitlements,
      });
      return claims.entitlements;
    }
    if (claims.status === 'missing-claims') {
      const features = await loadFallback(token);
      if (features) return features;
    }
    throw new Error('Entitlements are unavailable after token refresh');
  }, [loadFallback, refreshAuthToken]);

  const guardEntitlement = useCallback(async (featureKey, onAllowed) => {
    const entitlement = await checkEntitlement(featureKey);
    if (entitlement.allowed) {
      if (onAllowed) await onAllowed();
      return true;
    }
    if (entitlement.unavailable) return false;

    const reason = entitlement.reason ? ` ${entitlement.reason}` : '';
    notifyPlanLimit(`Feature '${featureKey}' is locked.${reason}`, {
      status: 409,
      featureKey,
    });
    return false;
  }, [checkEntitlement]);

  const isEntitlementLocked = useCallback(
    (featureKey) => Boolean(featureKey) && !getCurrentEntitlement(featureKey).allowed,
    [getCurrentEntitlement],
  );

  const entitlements = useMemo(() => {
    const values = {};
    PROACTIVE_ENTITLEMENT_KEYS.forEach((featureKey) => {
      values[featureKey] = getCurrentEntitlement(featureKey);
    });
    return values;
  }, [getCurrentEntitlement]);

  useEffect(() => {
    lastRefreshAtRef.current = Date.now();
    if (!userToken) {
      apiDebugLog('[Entitlement JWT] No signed-in token; all gated features remain locked.');
      return undefined;
    }

    apiDebugLog('[Entitlement JWT] Token claims loaded into entitlement state.', {
      status: decoded.status,
      expiresAt: decoded.expiresAt ? new Date(decoded.expiresAt).toISOString() : null,
      entitlementCount: Object.keys(decoded.entitlements || {}).length,
      entitlements: decoded.entitlements,
    });

    if (decoded.status === 'missing-claims' && fallback.token !== userToken) {
      loadFallback(userToken);
    }

    const needsRefresh = (decoded.status !== 'valid' && decoded.status !== 'missing-claims') ||
      decoded.expiresAt - Date.now() <= REFRESH_BEFORE_EXPIRY_MS;
    if (needsRefresh) {
      const reason = decoded.status === 'valid' ? 'expiring' : decoded.status;
      if (lastAttemptRef.current.token !== userToken || lastAttemptRef.current.reason !== reason) {
        lastAttemptRef.current = { token: userToken, reason };
        apiDebugLog('[Entitlement JWT] Refreshing because the token needs attention.', { reason });
        refreshAuthToken().catch(() => {});
      }
    }

    if (decoded.status !== 'valid' && decoded.status !== 'missing-claims') return undefined;
    const refreshIn = Math.max(0, decoded.expiresAt - Date.now() - REFRESH_BEFORE_EXPIRY_MS);
    const expireIn = Math.max(0, decoded.expiresAt - Date.now() + 100);
    const refreshTimer = setTimeout(() => {
      lastAttemptRef.current = { token: userToken, reason: 'expiring' };
      apiDebugLog('[Entitlement JWT] Refreshing one minute before token expiry.');
      refreshAuthToken().catch(() => {});
    }, refreshIn);
    const expiryTimer = setTimeout(() => setClockTick(Date.now()), expireIn);
    return () => {
      clearTimeout(refreshTimer);
      clearTimeout(expiryTimer);
    };
  }, [decoded, fallback.token, loadFallback, refreshAuthToken, userToken]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' || !userToken) return;
      if (Date.now() - lastRefreshAtRef.current < FOREGROUND_REFRESH_INTERVAL_MS) return;
      lastRefreshAtRef.current = Date.now();
      apiDebugLog('[Entitlement JWT] App returned to foreground after five minutes; refreshing token.');
      refreshAuthToken().catch(() => {});
    });
    return () => subscription.remove();
  }, [refreshAuthToken, userToken]);

  const value = useMemo(() => ({
    entitlements,
    checkEntitlement,
    guardEntitlement,
    invalidateEntitlements,
    markAllEntitlementsLocked,
    markEntitlementLocked,
    refreshEntitlements,
    isEntitlementLocked,
  }), [
    checkEntitlement,
    entitlements,
    guardEntitlement,
    invalidateEntitlements,
    isEntitlementLocked,
    markAllEntitlementsLocked,
    markEntitlementLocked,
    refreshEntitlements,
  ]);

  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  );
};

export const useEntitlements = () => {
  const context = useContext(EntitlementContext);
  if (!context) throw new Error('useEntitlements must be used within an EntitlementProvider');
  return context;
};
