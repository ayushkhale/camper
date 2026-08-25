import ReactNativeBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';

let isRefreshing = false;
let failedQueue = [];

let onLogoutCallback = null;
export const setLogoutCallback = (cb) => { onLogoutCallback = cb; };

let onTokenRefreshedCallback = null;
export const setTokenRefreshedCallback = (cb) => { onTokenRefreshedCallback = cb; };

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

const fetchWithAuth = async (url, options, token = null) => {
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
          console.warn(`❌ [API] No refresh token found in storage! Logging out...`);
          throw new Error('No refresh token available');
        }

        console.log(`🚀 [API] Fetching new access token from /api/auth/refresh-token`);
        const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        const refreshData = await refreshResponse.json();
        
        if (!refreshResponse.ok) {
          console.error(`❌ [API] Refresh failed with status:`, refreshResponse.status, refreshData);
          throw new Error(refreshData.message || 'Refresh failed');
        }

        console.log(`🎉 [API] Token refreshed successfully! Saving to storage...`);
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
    return response;
  } catch (error) {
    throw error;
  }
};

// const API_BASE_URL = 'http://192.168.1.5:3007';
const API_BASE_URL = 'https://api-camper.compunic.co.in';


let apiPrefix = '/api/vendor';
export const setApiRole = (role) => {
  apiPrefix = role === 'staff' ? '/api/staff' : '/api/vendor';
};


const logRequest = (url, body) => {
  console.log(`🚀 [API Request] POST ${url}`);
  if (body) {
    // Mask sensitive codes/OTPs in logs to prevent security warnings
    const safeBody = { ...body };
    if (safeBody.otp) safeBody.otp = '******';
    console.log(`📦 [API Payload]`, JSON.stringify(safeBody, null, 2));
  }
};

const logResponse = (url, status, data) => {
  console.log(`✅ [API Response] ${status} from ${url}`);
  console.log(`📄 [API Response Data]`, JSON.stringify(data, null, 2));
};

const logError = (url, error) => {
  console.error(`❌ [API Error] ${url} failed:`, error.message || error);
};

const getRequest = async (endpoint, token = null) => {
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

const postRequest = async (endpoint, body, token = null) => {
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
      const error = new Error(data.message || 'Something went wrong');
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

const patchRequest = async (endpoint, body, token = null) => {
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

const postMultipartRequest = async (endpoint, formData, token = null) => {
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
      const error = new Error(data.message || 'Something went wrong');
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

const patchMultipartRequest = async (endpoint, formData, token = null) => {
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

const deleteRequest = async (endpoint, token = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`🚀 [API Request] DELETE ${url}`);
  try {
    const response = await fetchWithAuth(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
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

export const api = {
  logout: (refreshToken) =>
    postRequest('/api/auth/logout', { refreshToken }),
  // Signup Flow - Step 1: Request OTP
  signupRequestOtp: (phone) =>
    postRequest('/api/auth/signup-request-otp', { phone }),

  // Signup Flow - Step 2: Verify OTP
  signupVerifyOtp: (contextId, otp) =>
    postRequest('/api/auth/signup-verify-otp', { contextId, otp }),

  // Signup Flow - Step 3: Complete Registration
  completeRegistration: (token, ownerName, businessName, businessCategoryId, email, address, pincode, city, state, country) =>
    postRequest('/api/auth/complete-registration', { ownerName, businessName, businessCategoryId, email, address, pincode, city, state, country }, token),

  // Login Flow - Step 1: Request OTP
  loginRequestOtp: (phone) => //
    postRequest('/api/auth/request-otp', { phone, type: 'user' }),

  // Login Flow - Step 2: Verify OTP
  loginVerifyOtp: (contextId, otp) =>
    postRequest('/api/auth/verify-otp', { contextId, otp }),

  // Resend OTP
  resendOtp: (contextId) =>
    postRequest('/api/auth/resend-otp', { contextId }),

  // Vendor Profile APIs
  getVendorProfile: (token) =>
    getRequest(`${apiPrefix}/profile`, token),

  updateVendorProfile: (token, updatedData) =>
    patchRequest(`${apiPrefix}/profile`, updatedData, token),

  // Fetch Categories
  getCategories: () =>
    getRequest('/api/public/categories'),

  // Staff APIs
  listStaff: (token) =>
    getRequest(`${apiPrefix}/staff`, token),

  addStaff: (token, staffData) =>
    postRequest(`${apiPrefix}/staff`, staffData, token),

  updateStaff: (token, id, staffData) =>
    patchRequest(`${apiPrefix}/staff/${id}`, staffData, token),

  deleteStaff: (token, id) =>
    deleteRequest(`${apiPrefix}/staff/${id}`, token),

  // Product / SKU Catalog APIs
  listProducts: (token) =>
    getRequest(`${apiPrefix}/products`, token),

  getProduct: (token, id) =>
    getRequest(`${apiPrefix}/products/${id}`, token),

  createProduct: (token, formData) =>
    postMultipartRequest(`${apiPrefix}/products`, formData, token),

  updateProduct: (token, id, data, isMultipart = false) =>
    isMultipart
      ? patchMultipartRequest(`${apiPrefix}/products/${id}`, data, token)
      : patchRequest(`${apiPrefix}/products/${id}`, data, token),

  deleteProduct: (token, id) =>
    deleteRequest(`${apiPrefix}/products/${id}`, token),

  // Delivery Routes APIs
  listRoutes: (token) =>
    getRequest(`${apiPrefix}/routes`, token),

  getRoutes: (token) =>
    getRequest(`${apiPrefix}/routes`, token),

  getRoute: (token, id) =>
    getRequest(`${apiPrefix}/routes/${id}`, token),

  createRoute: (token, routeData) =>
    postRequest(`${apiPrefix}/routes`, routeData, token),

  updateRoute: (token, id, routeData) =>
    patchRequest(`${apiPrefix}/routes/${id}`, routeData, token),

  deleteRoute: (token, id) =>
    deleteRequest(`${apiPrefix}/routes/${id}`, token),

  assignStaff: (token, id, assignmentData) =>
    postRequest(`${apiPrefix}/routes/${id}/assign-staff`, assignmentData, token),

  endStaffAssignment: (token, routeId, staffRouteId) =>
    deleteRequest(`${apiPrefix}/routes/${routeId}/assign-staff/${staffRouteId}`, token),

  // Customer APIs
  listCustomers: (token, search = '', routeId = '') => {
    let queryParams = [];
    if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
    if (routeId) queryParams.push(`routeId=${encodeURIComponent(routeId)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${apiPrefix}/customers${queryString}`, token);
  },

  getCustomer: (token, id) =>
    getRequest(`${apiPrefix}/customers/${id}`, token),

  createCustomer: (token, customerData) =>
    postRequest(`${apiPrefix}/customers`, customerData, token),

  updateCustomer: (token, id, customerData) =>
    patchRequest(`${apiPrefix}/customers/${id}`, customerData, token),

  deleteCustomer: (token, id) =>
    deleteRequest(`${apiPrefix}/customers/${id}`, token),

  updateCustomerSequence: (token, sequences) =>
    patchRequest(`${apiPrefix}/customers/sequence`, { sequences }, token),

  getCustomerDeliveries: (token, customerId, { from, to, status, invoiced } = {}) => {
    let queryParams = [];
    if (from) queryParams.push(`from=${encodeURIComponent(from)}`);
    if (to) queryParams.push(`to=${encodeURIComponent(to)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    if (invoiced) queryParams.push(`invoiced=${encodeURIComponent(invoiced)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${apiPrefix}/customers/${customerId}/deliveries${queryString}`, token);
  },

  getCustomerJarCollections: (token, customerId, { from, to } = {}) => {
    let queryParams = [];
    if (from) queryParams.push(`from=${encodeURIComponent(from)}`);
    if (to) queryParams.push(`to=${encodeURIComponent(to)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${apiPrefix}/customers/${customerId}/jar-collections${queryString}`, token);
  },

  // Subscriptions APIs
  listSubscriptions: (token, customerId = '', status = '') => {
    let queryParams = [];
    if (customerId) queryParams.push(`customerId=${encodeURIComponent(customerId)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${apiPrefix}/subscriptions${queryString}`, token);
  },

  getSubscription: (token, id) =>
    getRequest(`${apiPrefix}/subscriptions/${id}`, token),

  createSubscription: (token, subscriptionData) =>
    postRequest(`${apiPrefix}/subscriptions`, subscriptionData, token),

  updateSubscription: (token, id, subscriptionData) =>
    patchRequest(`${apiPrefix}/subscriptions/${id}`, subscriptionData, token),

  deleteSubscription: (token, id) =>
    deleteRequest(`${apiPrefix}/subscriptions/${id}`, token),

  // Deliveries APIs
  generateDeliveries: (token, targetDate) =>
    postRequest(`${apiPrefix}/deliveries/generate`, { targetDate }, token),

  listDeliveries: (token, date, routeId = '', status = '') => {
    let queryParams = [`date=${encodeURIComponent(date)}`];
    if (routeId) queryParams.push(`routeId=${encodeURIComponent(routeId)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    const queryString = `?${queryParams.join('&')}`;
    return getRequest(`${apiPrefix}/deliveries${queryString}`, token);
  },

  trackDeliveries: (token, { date, routeId = '', status = '' } = {}) => {
    let queryParams = [`date=${encodeURIComponent(date)}`];
    if (routeId) queryParams.push(`routeId=${encodeURIComponent(routeId)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    const queryString = `?${queryParams.join('&')}`;
    return getRequest(`${apiPrefix}/deliveries/track${queryString}`, token);
  },

  updateDeliveryStatus: (token, id, statusData) =>
    patchRequest(`${apiPrefix}/deliveries/${id}/status`, statusData, token),

  // Pauses APIs
  listPauses: (token, subscriptionId) =>
    getRequest(`${apiPrefix}/subscriptions/${subscriptionId}/pauses`, token),

  addPause: (token, subscriptionId, pauseData) =>
    postRequest(`${apiPrefix}/subscriptions/${subscriptionId}/pauses`, pauseData, token),

  deletePause: (token, subscriptionId, pauseId) =>
    deleteRequest(`${apiPrefix}/subscriptions/${subscriptionId}/pauses/${pauseId}`, token),

  // Overrides APIs
  listOverrides: (token, subscriptionId) =>
    getRequest(`${apiPrefix}/subscriptions/${subscriptionId}/overrides`, token),

  addOverride: (token, subscriptionId, overrideData) =>
    postRequest(`${apiPrefix}/subscriptions/${subscriptionId}/overrides`, overrideData, token),

  deleteOverride: (token, subscriptionId, overrideId) =>
    deleteRequest(`${apiPrefix}/subscriptions/${subscriptionId}/overrides/${overrideId}`, token),

  // One-Time Orders APIs
  listOneTimeOrders: (token) =>
    getRequest(`${apiPrefix}/one-time-orders`, token),

  createOneTimeOrder: (token, orderData) =>
    postRequest(`${apiPrefix}/one-time-orders`, orderData, token),

  updateOneTimeOrderStatus: (token, id, status) =>
    patchRequest(`${apiPrefix}/one-time-orders/${id}/status`, { status }, token),

  fulfillOneTimeOrder: (token, id, data) =>
    postRequest(`${apiPrefix}/one-time-orders/${id}/fulfill`, data, token),

  // Dashboard APIs
  getDashboardStats: (token) =>
    getRequest(`${apiPrefix}/dashboard`, token),

  // ── INVOICES ─────────────────────────────────────────────────
  getUninvoicedPreSummary: (token, customerId = '') => {
    const queryString = customerId ? `?customerId=${encodeURIComponent(customerId)}` : '';
    return getRequest(`${apiPrefix}/invoices/pre-summary${queryString}`, token);
  },

  generateInvoices: (token, data) =>
    postRequest(`${apiPrefix}/invoices/generate`, data, token),

  listInvoices: (token, { customerId, status, from, to } = {}) => {
    let queryParams = [];
    if (customerId) queryParams.push(`customerId=${encodeURIComponent(customerId)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    if (from) queryParams.push(`from=${encodeURIComponent(from)}`);
    if (to) queryParams.push(`to=${encodeURIComponent(to)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${apiPrefix}/invoices${queryString}`, token);
  },

  getInvoiceById: (token, id) =>
    getRequest(`${apiPrefix}/invoices/${id}`, token),

  downloadInvoicePDF: async (token, invoiceId, customerName = 'Customer') => {
    const url = `${API_BASE_URL}/api/vendor/invoices/${invoiceId}/download`;
    console.log(`🚀 [API Request] GET ${url} for PDF download`);

    try {
      // 1. Fetch using standard fetch (bypasses Android cleartext bug in blob-util fetch)
      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to download invoice PDF: ${response.status}`);
      }

      // 2. Read as blob and convert to base64
      const blob = await response.blob();
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // reader.result is usually 'data:application/pdf;base64,JVBERi0xLj...'
      const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

      if (!base64String) {
        throw new Error('Failed to parse base64 data from PDF');
      }

      // 3. Write securely to physical device storage
      const dirs = ReactNativeBlobUtil.fs.dirs;
      const safeName = customerName.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_'); // Keeps English and Hindi characters safe for filename
      const path = `${dirs.CacheDir}/${safeName}_Invoice.pdf`;

      await ReactNativeBlobUtil.fs.writeFile(path, base64String, 'base64');

      return path;
    } catch (error) {
      throw new Error(`Error downloading PDF: ${error.message}`);
    }
  },

  // ── PRE-BILLING / UNINVOICED DELIVERIES ───────────────────────
  getUninvoicedSummary: (token, customerId = null) => {
    const params = customerId ? `?customerId=${encodeURIComponent(customerId)}` : '';
    return getRequest(`${apiPrefix}/invoices/pre-summary${params}`, token);
  },

  getCustomerDeliveryHistory: (token, customerId, filters = {}) => {
    let queryParams = [];
    if (filters.invoiced) queryParams.push(`invoiced=${encodeURIComponent(filters.invoiced)}`);
    if (filters.status) queryParams.push(`status=${encodeURIComponent(filters.status)}`);
    if (filters.from) queryParams.push(`from=${encodeURIComponent(filters.from)}`);
    if (filters.to) queryParams.push(`to=${encodeURIComponent(filters.to)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${apiPrefix}/customers/${customerId}/deliveries${queryString}`, token);
  },

  getCustomerActivity: (token, customerId, params = {}) => {
    let queryParams = [];
    if (params.type && params.type !== 'all') queryParams.push(`type=${encodeURIComponent(params.type)}`);
    if (params.invoiced) queryParams.push(`invoiced=${encodeURIComponent(params.invoiced)}`);
    if (params.page) queryParams.push(`page=${encodeURIComponent(params.page)}`);
    if (params.limit) queryParams.push(`limit=${encodeURIComponent(params.limit)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${apiPrefix}/customers/${customerId}/activity${queryString}`, token);
  },

  generateInvoices: (token, payload) =>
    postRequest(`${apiPrefix}/invoices/generate`, payload, token),

  // ── LEDGER ───────────────────────────────────────────────────
  recordPayment: (token, data) =>
    postRequest(`${apiPrefix}/ledgers/payment`, data, token),

  getAccountStatement: (token, customerId) =>
    getRequest(`${apiPrefix}/ledgers/account/${customerId}`, token),

  // ── DEPOSITS ─────────────────────────────────────────────────
  collectDeposit: (token, data) =>
    postRequest(`${apiPrefix}/deposits/collect`, data, token),

  settleDepositToBill: (token, data) =>
    postRequest(`${apiPrefix}/deposits/settle-to-bill`, data, token),

  refundDeposit: (token, data) =>
    postRequest(`${apiPrefix}/deposits/refund`, data, token),

  getDepositLedger: (token, customerId) =>
    getRequest(`${apiPrefix}/deposits/${customerId}`, token),

  // ── REPORTS ──────────────────────────────────────────────────
  getFinancialReports: (token, params = {}) => {
    let queryParams = [];
    if (params.rangePreset) queryParams.push(`rangePreset=${encodeURIComponent(params.rangePreset)}`);
    if (params.from) queryParams.push(`from=${encodeURIComponent(params.from)}`);
    if (params.to) queryParams.push(`to=${encodeURIComponent(params.to)}`);
    if (params.routeId) queryParams.push(`routeId=${encodeURIComponent(params.routeId)}`);
    if (params.staffId) queryParams.push(`staffId=${encodeURIComponent(params.staffId)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${apiPrefix}/reports/financials${queryString}`, token);
  },

  getOutstandingReports: (token, params = {}) => {
    let queryParams = [];
    if (params.routeId) queryParams.push(`routeId=${encodeURIComponent(params.routeId)}`);
    if (params.staffId) queryParams.push(`staffId=${encodeURIComponent(params.staffId)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${apiPrefix}/reports/outstanding${queryString}`, token);
  },

  getOperationsReports: (token, params = {}) => {
    let queryParams = [];
    if (params.rangePreset) queryParams.push(`rangePreset=${encodeURIComponent(params.rangePreset)}`);
    if (params.from) queryParams.push(`from=${encodeURIComponent(params.from)}`);
    if (params.to) queryParams.push(`to=${encodeURIComponent(params.to)}`);
    if (params.routeId) queryParams.push(`routeId=${encodeURIComponent(params.routeId)}`);
    if (params.staffId) queryParams.push(`staffId=${encodeURIComponent(params.staffId)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${apiPrefix}/reports/operations${queryString}`, token);
  },

  getInventoryReports: (token, params = {}) => {
    let queryParams = [];
    if (params.rangePreset) queryParams.push(`rangePreset=${encodeURIComponent(params.rangePreset)}`);
    if (params.from) queryParams.push(`from=${encodeURIComponent(params.from)}`);
    if (params.to) queryParams.push(`to=${encodeURIComponent(params.to)}`);
    if (params.routeId) queryParams.push(`routeId=${encodeURIComponent(params.routeId)}`);
    if (params.staffId) queryParams.push(`staffId=${encodeURIComponent(params.staffId)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${apiPrefix}/reports/inventory${queryString}`, token);
  },
};
