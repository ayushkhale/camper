import { deleteRequest, postRequest } from './client';

export const authApi = {
  logout: (refreshToken) =>
    postRequest('/api/auth/logout', { refreshToken }),

  signupRequestOtp: (phone) =>
    postRequest('/api/auth/signup-request-otp', { phone }),

  signupVerifyOtp: (contextId, otp) =>
    postRequest('/api/auth/signup-verify-otp', { contextId, otp }),

  completeRegistration: (token, ownerName, businessName, businessCategoryId, email, address, pincode, city, state, country) =>
    postRequest('/api/auth/complete-registration', { ownerName, businessName, businessCategoryId, email, address, pincode, city, state, country }, token),

  loginRequestOtp: (phone) =>
    postRequest('/api/auth/request-otp', { phone, type: 'user' }),

  loginVerifyOtp: (contextId, otp) =>
    postRequest('/api/auth/verify-otp', { contextId, otp }),

  resendOtp: (contextId) =>
    postRequest('/api/auth/resend-otp', { contextId }),

  deleteAccount: (token) =>
    deleteRequest('/api/auth/delete-account', token),
};
