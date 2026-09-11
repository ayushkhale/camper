import { getApiPrefix, getRequest } from './client';

export const dashboardApi = {
  getDashboardStats: (token) =>
    getRequest(`${getApiPrefix()}/dashboard`, token),
};
