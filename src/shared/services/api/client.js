import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'http://192.168.1.6:3007';
// export const API_BASE_URL = 'https://api-camper.compunic.co.in';

let isRefreshing = false;
let failedQueue = [];

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

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
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
      console.log(`🔄 [API] 401 caught for ${url}. Initiating token refresh process...`);
      if (isRefreshing) {
        console.log(`⏳ [API] Refresh already in progress. Queueing request for ${url}`);
        const newToken = await new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        console.log(`✅ [API] Resuming queued request with new token for ${url}`);
        headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(url, { ...options, headers });
        return response;
      }

      isRefreshing = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (!refreshToken) {
          console.warn('❌ [API] No refresh token found in storage! Logging out...');
          throw new Error('No refresh token available');
        }

        console.log('🚀 [API] Fetching new access token from /api/auth/refresh-token');
        const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        const refreshData = await refreshResponse.json();

        if (!refreshResponse.ok) {
          console.error('❌ [API] Refresh failed with status:', refreshResponse.status, refreshData);
          throw new Error(refreshData.message || 'Refresh failed');
        }

        console.log('🎉 [API] Token refreshed successfully! Saving to storage...');
        const newAccessToken = refreshData.token;
        const newRefreshToken = refreshData.refreshToken;

        await AsyncStorage.setItem('jwt_token', newAccessToken);
        await AsyncStorage.setItem('refresh_token', newRefreshToken);

        if (onTokenRefreshedCallback) onTokenRefreshedCallback(newAccessToken);

        processQueue(null, newAccessToken);

        headers.Authorization = `Bearer ${newAccessToken}`;
        response = await fetch(url, { ...options, headers });
      } catch (refreshError) {
        processQueue(refreshError, null);
        await AsyncStorage.removeItem('jwt_token');
        await AsyncStorage.removeItem('refresh_token');
        if (onLogoutCallback) onLogoutCallback();
        throw refreshError;
      } finally {
        isRefreshing = false;
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

      if (!url.includes('/entitlement/')) {
        notifyPlanLimit(message, {
          status: response.status,
          errorCode,
        });
      }
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
  console.log(`🚀 [API Request] POST ${url}`);
  if (body) {
    const safeBody = { ...body };
    if (safeBody.otp) safeBody.otp = '******';
    console.log('📦 [API Payload]', JSON.stringify(safeBody, null, 2));
  }
};

const logResponse = (url, status, data) => {
  console.log(`✅ [API Response] ${status} from ${url}`);
  console.log('📄 [API Response Data]', JSON.stringify(data, null, 2));
};

const logError = (url, error) => {
  if (error.message === 'No subscription found for this customer') {
    console.log(`ℹ️ [API Info] ${url}: ${error.message} (Expected for new users)`);
    return;
  }
  console.error(`❌ [API Error] ${url} failed:`, error.message || error);
};

export const getRequest = async (endpoint, token = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`🚀 [API Request] GET ${url}`);
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
  console.log(`[API Request] PUT ${url}`);
  if (body) {
    console.log('[API Payload]', JSON.stringify(body, null, 2));
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
  console.log(`🚀 [API Request] POST Multipart ${url}`);

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
  console.log(`🚀 [API Request] PATCH Multipart ${url}`);

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
  console.log(`🚀 [API Request] DELETE ${url}`);
  if (body) {
    console.log('[API Payload]', JSON.stringify(body, null, 2));
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
  console.log(`[Subscription API] ${operation} request:`, requestDetails);

  try {
    const response = await request();
    console.log(`[Subscription API] ${operation} response:`, response);
    return response;
  } catch (error) {
    console.error(`[Subscription API] ${operation} error:`, {
      message: error?.message || String(error),
      backendMessage: error?.backendMessage,
      isPlanLimit: Boolean(error?.isPlanLimit),
    });
    throw error;
  }
};
