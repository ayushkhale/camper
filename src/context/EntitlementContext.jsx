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
import { api, notifyPlanLimit } from '../services/api';
import { PROACTIVE_ENTITLEMENT_KEYS } from '../constants/subscriptionEntitlements';

const ENTITLEMENT_CACHE_TTL_MS = 5 * 60 * 1000;

const EntitlementContext = createContext(null);

const unwrapEntitlement = (response) => {
  const payload = response?.data || response;
  return {
    allowed: payload?.allowed !== false,
    value: payload?.value,
    reason: payload?.reason || payload?.message || '',
    checkedAt: Date.now(),
  };
};

export const EntitlementProvider = ({ children }) => {
  const { userToken, user } = useContext(AuthContext);
  const customerId = user?.vendorAccountId || 'me';
  const [entitlements, setEntitlements] = useState({});
  const cacheRef = useRef(new Map());
  const inFlightRef = useRef(new Map());
  const lastFullRefreshAtRef = useRef(0);
  const sessionRef = useRef('');
  const stateVersionRef = useRef(0);

  const invalidateEntitlements = useCallback(() => {
    stateVersionRef.current += 1;
    cacheRef.current.clear();
    inFlightRef.current.clear();
    lastFullRefreshAtRef.current = 0;
    setEntitlements({});
  }, []);

  const markEntitlementLocked = useCallback((featureKey, reason = '') => {
    if (!featureKey) return;
    stateVersionRef.current += 1;
    inFlightRef.current.delete(featureKey);
    const lockedEntitlement = {
      allowed: false,
      reason,
      checkedAt: Date.now(),
    };
    cacheRef.current.set(featureKey, lockedEntitlement);
    setEntitlements((current) => ({
      ...current,
      [featureKey]: lockedEntitlement,
    }));
  }, []);

  const markAllEntitlementsLocked = useCallback((reason = '') => {
    stateVersionRef.current += 1;
    inFlightRef.current.clear();
    const checkedAt = Date.now();
    const lockedEntitlements = {};
    PROACTIVE_ENTITLEMENT_KEYS.forEach((featureKey) => {
      const lockedEntitlement = { allowed: false, reason, checkedAt };
      cacheRef.current.set(featureKey, lockedEntitlement);
      lockedEntitlements[featureKey] = lockedEntitlement;
    });
    setEntitlements(lockedEntitlements);
  }, []);

  const checkEntitlement = useCallback(async (featureKey, options = {}) => {
    if (!featureKey || !userToken) {
      return { allowed: true, unavailable: true, checkedAt: Date.now() };
    }

    const { force = false } = options;
    const cached = cacheRef.current.get(featureKey);
    if (!force && cached && Date.now() - cached.checkedAt < ENTITLEMENT_CACHE_TTL_MS) {
      return cached;
    }

    if (!force && inFlightRef.current.has(featureKey)) {
      return inFlightRef.current.get(featureKey);
    }

    const requestSession = sessionRef.current;
    const requestStateVersion = stateVersionRef.current;
    const request = api.getSubscriptionEntitlement(userToken, customerId, featureKey)
      .then(unwrapEntitlement)
      .catch((error) => {
        if (error?.isPlanLimit) {
          return {
            allowed: false,
            reason: error.backendMessage || '',
            checkedAt: Date.now(),
          };
        }

        console.log(`[Entitlements] ${featureKey} check unavailable:`, error?.message);
        return {
          allowed: true,
          unavailable: true,
          checkedAt: Date.now(),
        };
      })
      .then((result) => {
        if (
          sessionRef.current === requestSession &&
          stateVersionRef.current === requestStateVersion
        ) {
          cacheRef.current.set(featureKey, result);
          setEntitlements((current) => ({ ...current, [featureKey]: result }));
        }
        return result;
      })
      .finally(() => {
        if (inFlightRef.current.get(featureKey) === request) {
          inFlightRef.current.delete(featureKey);
        }
      });

    inFlightRef.current.set(featureKey, request);
    return request;
  }, [customerId, userToken]);

  const refreshEntitlements = useCallback(async (featureKeys = PROACTIVE_ENTITLEMENT_KEYS) => {
    if (!userToken) return [];
    const keys = Array.from(new Set(featureKeys.filter(Boolean)));
    const results = await Promise.all(keys.map((key) => checkEntitlement(key, { force: true })));
    lastFullRefreshAtRef.current = Date.now();
    return results;
  }, [checkEntitlement, userToken]);

  const guardEntitlement = useCallback(async (featureKey, onAllowed) => {
    const entitlement = await checkEntitlement(featureKey);
    if (entitlement.allowed) {
      if (onAllowed) await onAllowed();
      return true;
    }

    const reason = entitlement.reason ? ` ${entitlement.reason}` : '';
    notifyPlanLimit(`Feature '${featureKey}' is locked.${reason}`, {
      status: 409,
      featureKey,
    });
    return false;
  }, [checkEntitlement]);

  const isEntitlementLocked = useCallback(
    (featureKey) => entitlements[featureKey]?.allowed === false,
    [entitlements],
  );

  useEffect(() => {
    sessionRef.current = `${userToken || ''}:${customerId}`;
    invalidateEntitlements();
    if (userToken) {
      refreshEntitlements();
    }
  }, [customerId, invalidateEntitlements, refreshEntitlements, userToken]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        nextState === 'active' &&
        userToken &&
        Date.now() - lastFullRefreshAtRef.current >= ENTITLEMENT_CACHE_TTL_MS
      ) {
        refreshEntitlements();
      }
    });

    return () => subscription.remove();
  }, [refreshEntitlements, userToken]);

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
  if (!context) {
    throw new Error('useEntitlements must be used within an EntitlementProvider');
  }
  return context;
};
