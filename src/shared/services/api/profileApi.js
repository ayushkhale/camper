import { getApiPrefix, getRequest, patchRequest } from './client';

export const profileApi = {
  getVendorProfile: (token) =>
    getRequest(`${getApiPrefix()}/profile`, token),

  updateVendorProfile: (token, updatedData) =>
    patchRequest(`${getApiPrefix()}/profile`, updatedData, token),

  getCategories: () =>
    getRequest('/api/public/categories'),
};
