
const API_BASE_URL = 'http://192.168.1.30:3007';

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

  // Dashboard APIs
  getDashboardStats: (token) =>
    getRequest('/api/vendor/dashboard', token),
};
