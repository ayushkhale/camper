import ReactNativeBlobUtil from 'react-native-blob-util';

const API_BASE_URL = 'http://192.168.1.5:3007';
// const API_BASE_URL = 'https://api-camper.compunic.co.in';


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
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  console.log(`🚀 [API Request] GET ${url}`);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

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
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  logRequest(url, body);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

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
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  logRequest(url, body);

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

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
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log(`🚀 [API Request] POST Multipart ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

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
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log(`🚀 [API Request] PATCH Multipart ${url}`);

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: formData,
    });

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
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log(`🚀 [API Request] DELETE ${url}`);
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

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
  loginRequestOtp: (phone) =>
    postRequest('/api/auth/request-otp', { phone, type: 'user' }),

  // Login Flow - Step 2: Verify OTP
  loginVerifyOtp: (contextId, otp) =>
    postRequest('/api/auth/verify-otp', { contextId, otp }),

  // Resend OTP
  resendOtp: (contextId) =>
    postRequest('/api/auth/resend-otp', { contextId }),

  // Vendor Profile APIs
  getVendorProfile: (token) =>
    getRequest('/api/vendor/profile', token),

  updateVendorProfile: (token, updatedData) =>
    patchRequest('/api/vendor/profile', updatedData, token),

  // Fetch Categories
  getCategories: () =>
    getRequest('/api/public/categories'),

  // Staff APIs
  listStaff: (token) =>
    getRequest('/api/vendor/staff', token),

  addStaff: (token, staffData) =>
    postRequest('/api/vendor/staff', staffData, token),

  updateStaff: (token, id, staffData) =>
    patchRequest(`/api/vendor/staff/${id}`, staffData, token),

  deleteStaff: (token, id) =>
    deleteRequest(`/api/vendor/staff/${id}`, token),

  // Product / SKU Catalog APIs
  listProducts: (token) =>
    getRequest('/api/vendor/products', token),

  getProduct: (token, id) =>
    getRequest(`/api/vendor/products/${id}`, token),

  createProduct: (token, formData) =>
    postMultipartRequest('/api/vendor/products', formData, token),

  updateProduct: (token, id, data, isMultipart = false) =>
    isMultipart
      ? patchMultipartRequest(`/api/vendor/products/${id}`, data, token)
      : patchRequest(`/api/vendor/products/${id}`, data, token),

  deleteProduct: (token, id) =>
    deleteRequest(`/api/vendor/products/${id}`, token),

  // Delivery Routes APIs
  listRoutes: (token) =>
    getRequest('/api/vendor/routes', token),

  getRoute: (token, id) =>
    getRequest(`/api/vendor/routes/${id}`, token),

  createRoute: (token, routeData) =>
    postRequest('/api/vendor/routes', routeData, token),

  updateRoute: (token, id, routeData) =>
    patchRequest(`/api/vendor/routes/${id}`, routeData, token),

  deleteRoute: (token, id) =>
    deleteRequest(`/api/vendor/routes/${id}`, token),

  assignStaff: (token, id, assignmentData) =>
    postRequest(`/api/vendor/routes/${id}/assign-staff`, assignmentData, token),

  endStaffAssignment: (token, routeId, staffRouteId) =>
    deleteRequest(`/api/vendor/routes/${routeId}/assign-staff/${staffRouteId}`, token),

  // Customer APIs
  listCustomers: (token, search = '', routeId = '') => {
    let queryParams = [];
    if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
    if (routeId) queryParams.push(`routeId=${encodeURIComponent(routeId)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`/api/vendor/customers${queryString}`, token);
  },

  getCustomer: (token, id) =>
    getRequest(`/api/vendor/customers/${id}`, token),

  createCustomer: (token, customerData) =>
    postRequest('/api/vendor/customers', customerData, token),

  updateCustomer: (token, id, customerData) =>
    patchRequest(`/api/vendor/customers/${id}`, customerData, token),

  deleteCustomer: (token, id) =>
    deleteRequest(`/api/vendor/customers/${id}`, token),

  updateCustomerSequence: (token, sequences) =>
    patchRequest('/api/vendor/customers/sequence', { sequences }, token),

  getCustomerDeliveries: (token, customerId, { from, to, status, invoiced } = {}) => {
    let queryParams = [];
    if (from) queryParams.push(`from=${encodeURIComponent(from)}`);
    if (to) queryParams.push(`to=${encodeURIComponent(to)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    if (invoiced) queryParams.push(`invoiced=${encodeURIComponent(invoiced)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`/api/vendor/customers/${customerId}/deliveries${queryString}`, token);
  },

  getCustomerJarCollections: (token, customerId, { from, to } = {}) => {
    let queryParams = [];
    if (from) queryParams.push(`from=${encodeURIComponent(from)}`);
    if (to) queryParams.push(`to=${encodeURIComponent(to)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`/api/vendor/customers/${customerId}/jar-collections${queryString}`, token);
  },

  // Subscriptions APIs
  listSubscriptions: (token, customerId = '', status = '') => {
    let queryParams = [];
    if (customerId) queryParams.push(`customerId=${encodeURIComponent(customerId)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`/api/vendor/subscriptions${queryString}`, token);
  },

  getSubscription: (token, id) =>
    getRequest(`/api/vendor/subscriptions/${id}`, token),

  createSubscription: (token, subscriptionData) =>
    postRequest('/api/vendor/subscriptions', subscriptionData, token),

  updateSubscription: (token, id, subscriptionData) =>
    patchRequest(`/api/vendor/subscriptions/${id}`, subscriptionData, token),

  deleteSubscription: (token, id) =>
    deleteRequest(`/api/vendor/subscriptions/${id}`, token),

  // Deliveries APIs
  generateDeliveries: (token, targetDate) =>
    postRequest('/api/vendor/deliveries/generate', { targetDate }, token),

  listDeliveries: (token, date, routeId = '', status = '') => {
    let queryParams = [`date=${encodeURIComponent(date)}`];
    if (routeId) queryParams.push(`routeId=${encodeURIComponent(routeId)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    const queryString = `?${queryParams.join('&')}`;
    return getRequest(`/api/vendor/deliveries${queryString}`, token);
  },

  trackDeliveries: (token, { date, routeId = '', status = '' } = {}) => {
    let queryParams = [`date=${encodeURIComponent(date)}`];
    if (routeId) queryParams.push(`routeId=${encodeURIComponent(routeId)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    const queryString = `?${queryParams.join('&')}`;
    return getRequest(`/api/vendor/deliveries/track${queryString}`, token);
  },

  updateDeliveryStatus: (token, id, statusData) =>
    patchRequest(`/api/vendor/deliveries/${id}/status`, statusData, token),

  // Pauses APIs
  listPauses: (token, subscriptionId) =>
    getRequest(`/api/vendor/subscriptions/${subscriptionId}/pauses`, token),

  addPause: (token, subscriptionId, pauseData) =>
    postRequest(`/api/vendor/subscriptions/${subscriptionId}/pauses`, pauseData, token),

  deletePause: (token, subscriptionId, pauseId) =>
    deleteRequest(`/api/vendor/subscriptions/${subscriptionId}/pauses/${pauseId}`, token),

  // Overrides APIs
  listOverrides: (token, subscriptionId) =>
    getRequest(`/api/vendor/subscriptions/${subscriptionId}/overrides`, token),

  addOverride: (token, subscriptionId, overrideData) =>
    postRequest(`/api/vendor/subscriptions/${subscriptionId}/overrides`, overrideData, token),

  deleteOverride: (token, subscriptionId, overrideId) =>
    deleteRequest(`/api/vendor/subscriptions/${subscriptionId}/overrides/${overrideId}`, token),

  // One-Time Orders APIs
  listOneTimeOrders: (token) =>
    getRequest('/api/vendor/one-time-orders', token),

  createOneTimeOrder: (token, orderData) =>
    postRequest('/api/vendor/one-time-orders', orderData, token),

  updateOneTimeOrderStatus: (token, id, status) =>
    patchRequest(`/api/vendor/one-time-orders/${id}/status`, { status }, token),

  fulfillOneTimeOrder: (token, id, data) =>
    postRequest(`/api/vendor/one-time-orders/${id}/fulfill`, data, token),

  // Dashboard APIs
  getDashboardStats: (token) =>
    getRequest('/api/vendor/dashboard', token),

  // ── INVOICES ─────────────────────────────────────────────────
  getUninvoicedPreSummary: (token, customerId = '') => {
    const queryString = customerId ? `?customerId=${encodeURIComponent(customerId)}` : '';
    return getRequest(`/api/vendor/invoices/pre-summary${queryString}`, token);
  },

  generateInvoices: (token, data) =>
    postRequest('/api/vendor/invoices/generate', data, token),

  listInvoices: (token, { customerId, status, from, to } = {}) => {
    let queryParams = [];
    if (customerId) queryParams.push(`customerId=${encodeURIComponent(customerId)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    if (from) queryParams.push(`from=${encodeURIComponent(from)}`);
    if (to) queryParams.push(`to=${encodeURIComponent(to)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`/api/vendor/invoices${queryString}`, token);
  },

  getInvoiceById: (token, id) =>
    getRequest(`/api/vendor/invoices/${id}`, token),

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

  // ── LEDGER ───────────────────────────────────────────────────
  recordPayment: (token, data) =>
    postRequest('/api/vendor/ledgers/payment', data, token),

  getAccountStatement: (token, customerId) =>
    getRequest(`/api/vendor/ledgers/account/${customerId}`, token),

  // ── DEPOSITS ─────────────────────────────────────────────────
  collectDeposit: (token, data) =>
    postRequest('/api/vendor/deposits/collect', data, token),

  settleDepositToBill: (token, data) =>
    postRequest('/api/vendor/deposits/settle-to-bill', data, token),

  refundDeposit: (token, data) =>
    postRequest('/api/vendor/deposits/refund', data, token),

  getDepositLedger: (token, customerId) =>
    getRequest(`/api/vendor/deposits/${customerId}`, token),
};
