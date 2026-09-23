import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

// export const API_BASE_URL = typeof __DEV__ !== 'undefined' && __DEV__
//   ? 'http://192.168.1.6:3007'
//   : 'https://api-camper.compunic.co.in';
export const API_BASE_URL = 'http://192.168.1.6:3007';
// export const API_BASE_URL = 'https://api-camper.compunic.co.in';

export const shouldLogApi = (isDevelopment = typeof __DEV__ !== 'undefined' && __DEV__, baseUrl = API_BASE_URL) =>
  isDevelopment && !/^https:\/\//i.test(baseUrl);

export const apiDebugLog = (...args) => {
  if (shouldLogApi()) console.log(...args);
};
export const apiDebugWarn = (...args) => {
  if (shouldLogApi()) console.warn(...args);
};
export const apiDebugError = (...args) => {
  if (shouldLogApi()) console.error(...args);
};

const sanitizeForLog = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeForLog);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [
    key,
    /^(?:token|accessToken|refreshToken|newToken|password|otp)$/i.test(key)
      ? '[REDACTED]'
      : sanitizeForLog(nestedValue),
  ]));
};

// Development-only JWT diagnostics. The encoded access token and refresh token
// are deliberately never printed; the decoded claims are enough to verify that
// a login, refresh, or plan response supplied the expected entitlement values.
export const logAccessTokenDetails = (event, token, details = {}) => {
  if (!shouldLogApi()) return;

  if (typeof token !== 'string' || !token) {
    apiDebugWarn(`[Auth Token] ${event}: no access token received`, details);
    return;
  }

  try {
    const payload = jwtDecode(token);
    const entitlements = payload?.entitlements && typeof payload.entitlements === 'object'
      ? payload.entitlements
      : {};
    apiDebugLog(`[Auth Token] ${event}`, {
      ...details,
      decodedPayload: payload,
      entitlementCount: Object.keys(entitlements).length,
      entitlements,
      issuedAt: Number.isFinite(Number(payload?.iat))
        ? new Date(Number(payload.iat) * 1000).toISOString()
        : null,
      expiresAt: Number.isFinite(Number(payload?.exp))
        ? new Date(Number(payload.exp) * 1000).toISOString()
        : null,
    });
  } catch (error) {
    apiDebugError(`[Auth Token] ${event}: decode failed`, {
      ...details,
      message: error?.message || String(error),
    });
  }
};

let refreshPromise = null;

let onLogoutCallback = null;
export const setLogoutCallback = (cb) => { onLogoutCallback = cb; };

let onTokenRefreshedCallback = null;
export const setTokenRefreshedCallback = (cb) => { onTokenRefreshedCallback = cb; };

let onPlanLimitCallback = null;
export const setPlanLimitCallback = (cb) => { onPlanLimitCallback = cb; };
export const notifyPlanLimit = (message, details = {}) => {
  if (onPlanLimitCallback) onPlanLimitCallback(message, details);
};

let apiPrefix = '/api/vendor';
export const setApiRole = (role) => {
  apiPrefix = role === 'staff' ? '/api/staff' : '/api/vendor';
};
export const getApiPrefix = () => apiPrefix;

const limitFeatureForRequest = (url, method, message) => {
  if (method !== 'POST' || !/limit|quota|maximum|plan/i.test(message)) return null;
  const match = url.match(/\/api\/(?:vendor|staff)\/(customers|products|staff|routes)(?:\?|$)/);
  return {
    customers: 'customer.limit',
    products: 'product.limit',
    staff: 'staff.limit',
    routes: 'route.limit',
  }[match?.[1]] || null;
};

const clearRevokedSession = async () => {
  await AsyncStorage.multiRemove(['jwt_token', 'refresh_token', 'user_data']);
  if (onLogoutCallback) onLogoutCallback();
};

// Both a 401 retry and a plan-change refresh use this one rotating request.
export const refreshAccessToken = ({ forceFresh = false } = {}) => {
  if (refreshPromise) {
    apiDebugLog('[Auth Token] Refresh already in progress.', {
      forceFresh,
      action: forceFresh ? 'queue-another-refresh' : 'share-current-refresh',
    });
    return forceFresh
      ? refreshPromise.then(() => refreshAccessToken())
      : refreshPromise;
  }

  refreshPromise = (async () => {
    apiDebugLog('[Auth Token] Refresh started.', { forceFresh });
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) {
      apiDebugWarn('[Auth Token] Refresh stopped: no refresh token is stored.');
      await clearRevokedSession();
      const error = new Error('No refresh token available');
      error.authRevoked = true;
      throw error;
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      apiDebugError('[Auth Token] Refresh request failed.', {
        status: response.status,
        message: data.message || 'Token refresh failed',
      });
      const error = new Error(data.message || 'Token refresh failed');
      if ([400, 401, 403].includes(response.status)) {
        await clearRevokedSession();
        error.authRevoked = true;
      }
      throw error;
    }

    const payload = data.data || data;
    if (typeof payload.token !== 'string' || !payload.token) {
      apiDebugError('[Auth Token] Refresh response did not contain an access token.');
      await clearRevokedSession();
      const error = new Error('Refresh response did not include an access token');
      error.authRevoked = true;
      throw error;
    }

    await AsyncStorage.setItem('jwt_token', payload.token);
    if (payload.refreshToken) {
      await AsyncStorage.setItem('refresh_token', payload.refreshToken);
    }
    logAccessTokenDetails('Refresh succeeded and token was stored', payload.token, {
      forceFresh,
      refreshTokenRotated: Boolean(payload.refreshToken),
    });
    if (onTokenRefreshedCallback) onTokenRefreshedCallback(payload.token);
    return payload.token;
  })().finally(() => {
    apiDebugLog('[Auth Token] Refresh finished.');
    refreshPromise = null;
  });

  return refreshPromise;
};

// Apply a token that arrived inline inside an API response (e.g. newToken from
// plan upgrade / cancel) without triggering a separate /auth/refresh call.
export const applyNewToken = async (token, source = 'inline API response') => {
  if (typeof token !== 'string' || !token) {
    apiDebugWarn(`[Auth Token] ${source}: inline newToken was missing or invalid.`);
    return;
  }
  await AsyncStorage.setItem('jwt_token', token);
  logAccessTokenDetails(`Applied newToken from ${source}`, token);
  if (onTokenRefreshedCallback) onTokenRefreshedCallback(token);
};

export const fetchWithAuth = async (url, options, token = null) => {
  let currentToken = token;
  const headers = { ...options.headers };
  if (currentToken) {
    headers.Authorization = `Bearer ${currentToken}`;
  }

  try {
    let response = await fetch(url, { ...options, headers });

    if (response.status === 401 && currentToken && !url.includes('/api/auth/refresh-token')) {
      apiDebugWarn('[Auth Token] API returned 401; checking for a newer token.', { url });
      const storedToken = await AsyncStorage.getItem('jwt_token');
      let retryToken = storedToken && storedToken !== currentToken
        ? storedToken
        : await refreshAccessToken();
      apiDebugLog('[Auth Token] Retrying request with updated access token.', {
        url,
        source: storedToken && storedToken !== currentToken ? 'storage' : 'refresh-endpoint',
      });
      headers.Authorization = `Bearer ${retryToken}`;
      response = await fetch(url, { ...options, headers });

      // A refresh may have finished while the first request was in flight.
      if (response.status === 401 && retryToken === storedToken && retryToken !== currentToken) {
        apiDebugWarn('[Auth Token] Stored replacement token was rejected; refreshing once.', { url });
        retryToken = await refreshAccessToken();
        headers.Authorization = `Bearer ${retryToken}`;
        response = await fetch(url, { ...options, headers });
      }
      if (response.status === 401) {
        apiDebugError('[Auth Token] Retried request was rejected; clearing the session.', { url });
        await clearRevokedSession();
        const error = new Error('Session expired');
        error.authRevoked = true;
        throw error;
      }
    }

    if (response.status === 409 || response.status === 403) {
      const errorData = await response.clone().json().catch(() => ({}));
      const message = errorData.message || errorData.error || 'Subscription limit reached.';
      const errorCode = errorData.code || errorData.errorCode || errorData.error;
      const isFeatureLocked = response.status === 403 && (
        errorCode === 'PLAN_LIMIT_REACHED' ||
        /feature.*locked|purchase a plan|trial expired|not included in current plan/i.test(message)
      );

      if (response.status !== 409 && !isFeatureLocked) {
        return response;
      }

      notifyPlanLimit(message, {
        status: response.status,
        errorCode,
        featureKey: errorData.featureKey ||
          limitFeatureForRequest(url, options.method, message),
      });
      const error = new Error('PLAN_LIMIT_REACHED');
      error.isPlanLimit = true;
      error.status = response.status;
      error.backendMessage = message;
      throw error;
    }

    return response;
  } catch (error) {
    throw error;
  }
};

const logRequest = (url, body) => {
  if (!shouldLogApi()) return;
  console.log(`🚀 [API Request] POST ${url}`);
  if (body) {
    const safeBody = sanitizeForLog(body);
    console.log('📦 [API Payload]', JSON.stringify(safeBody, null, 2));
  }
};

const logResponse = (url, status, data) => {
  if (!shouldLogApi()) return;
  console.log(`✅ [API Response] ${status} from ${url}`);
  console.log('📄 [API Response Data]', JSON.stringify(sanitizeForLog(data), null, 2));
};

const logError = (url, error) => {
  if (!shouldLogApi()) return;
  if (error.message === 'No subscription found for this customer') {
    console.log(`ℹ️ [API Info] ${url}: ${error.message} (Expected for new users)`);
    return;
  }
  console.error(`❌ [API Error] ${url} failed:`, error.message || error);
};

export const getRequest = async (endpoint, token = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  apiDebugLog(`🚀 [API Request] GET ${url}`);
  try {
    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }, token);

    const data = await response.json();
    logResponse(url, response.status, data);

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Something went wrong');
      logError(url, error);
      throw error;
    }

    return data;
  } catch (error) {
    logError(url, error);
    throw error;
  }
};

export const postRequest = async (endpoint, body, token = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  logRequest(url, body);

  try {
    const response = await fetchWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, token);

    if (response.status === 429) {
      const error = new Error('TOO_MANY_REQUESTS');
      logError(url, error);
      throw error;
    }

    const data = await response.json();
    logResponse(url, response.status, data);

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Something went wrong');
      logError(url, error);
      throw error;
    }

    return data;
  } catch (error) {
    if (error.message !== 'TOO_MANY_REQUESTS' && !error.message.includes('went wrong')) {
      logError(url, error);
    }
    throw error;
  }
};

export const patchRequest = async (endpoint, body, token = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  logRequest(url, body);

  try {
    const response = await fetchWithAuth(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, token);

    const data = await response.json();
    logResponse(url, response.status, data);

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Something went wrong');
      logError(url, error);
      throw error;
    }

    return data;
  } catch (error) {
    logError(url, error);
    throw error;
  }
};

export const putRequest = async (endpoint, body, token = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  apiDebugLog(`[API Request] PUT ${url}`);
  if (body && shouldLogApi()) {
    apiDebugLog('[API Payload]', JSON.stringify(body, null, 2));
  }

  try {
    const response = await fetchWithAuth(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, token);

    const data = await response.json();
    logResponse(url, response.status, data);

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Something went wrong');
      logError(url, error);
      throw error;
    }

    return data;
  } catch (error) {
    logError(url, error);
    throw error;
  }
};

export const postMultipartRequest = async (endpoint, formData, token = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  apiDebugLog(`🚀 [API Request] POST Multipart ${url}`);

  try {
    const response = await fetchWithAuth(url, {
      method: 'POST',
      headers: {},
      body: formData,
    }, token);

    if (response.status === 429) {
      const error = new Error('TOO_MANY_REQUESTS');
      logError(url, error);
      throw error;
    }

    const data = await response.json();
    logResponse(url, response.status, data);

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Something went wrong');
      logError(url, error);
      throw error;
    }

    return data;
  } catch (error) {
    if (error.message !== 'TOO_MANY_REQUESTS' && !error.message.includes('went wrong')) {
      logError(url, error);
    }
    throw error;
  }
};

export const patchMultipartRequest = async (endpoint, formData, token = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  apiDebugLog(`🚀 [API Request] PATCH Multipart ${url}`);

  try {
    const response = await fetchWithAuth(url, {
      method: 'PATCH',
      headers: {},
      body: formData,
    }, token);

    const data = await response.json();
    logResponse(url, response.status, data);

    if (!response.ok) {
      const error = new Error(data.message || 'Something went wrong');
      logError(url, error);
      throw error;
    }

    return data;
  } catch (error) {
    logError(url, error);
    throw error;
  }
};

export const deleteRequest = async (endpoint, token = null, body = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  apiDebugLog(`🚀 [API Request] DELETE ${url}`);
  if (body && shouldLogApi()) {
    apiDebugLog('[API Payload]', JSON.stringify(body, null, 2));
  }
  try {
    const response = await fetchWithAuth(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }, token);

    const data = await response.json();
    logResponse(url, response.status, data);

    if (!response.ok) {
      const error = new Error(data.message || 'Something went wrong');
      logError(url, error);
      throw error;
    }

    return data;
  } catch (error) {
    logError(url, error);
    throw error;
  }
};

export const runSubscriptionRequest = async (operation, requestDetails, request) => {
  apiDebugLog(`[Subscription API] ${operation} request:`, requestDetails);

  try {
    const response = await request();
    apiDebugLog(`[Subscription API] ${operation} response:`, sanitizeForLog(response));
    const inlineToken = response?.newToken || response?.data?.newToken || null;
    if (inlineToken) {
      await applyNewToken(inlineToken, `${operation} response`);
    } else if (/changeSubscriptionPlan|cancelSubscriptionPlan/i.test(operation)) {
      apiDebugWarn(`[Subscription API] ${operation} response did not include newToken.`);
    }
    return response;
  } catch (error) {
    apiDebugError(`[Subscription API] ${operation} error:`, {
      message: error?.message || String(error),
      backendMessage: error?.backendMessage,
      isPlanLimit: Boolean(error?.isPlanLimit),
    });
    throw error;
  }
};
