
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
  completeRegistration: (token, ownerName, businessName, businessCategoryId, email) => 
    postRequest('/api/auth/complete-registration', { ownerName, businessName, businessCategoryId, email }, token),

  // Login Flow - Step 1: Request OTP
  loginRequestOtp: (phone) => 
    postRequest('/api/auth/request-otp', { phone, type: 'user' }),

  // Login Flow - Step 2: Verify OTP
  loginVerifyOtp: (contextId, otp) => 
    postRequest('/api/auth/verify-otp', { contextId, otp }),

  // Resend OTP
  resendOtp: (contextId) => 
    postRequest('/api/auth/resend-otp', { contextId }),

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
};
