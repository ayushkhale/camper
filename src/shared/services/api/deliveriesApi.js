import { getApiPrefix, getRequest, patchRequest, postRequest } from './client';

export const deliveriesApi = {
  generateDeliveries: (token, targetDate) =>
    postRequest(`${getApiPrefix()}/deliveries/generate`, { targetDate }, token),

  listDeliveries: (token, date, routeId = '', status = '') => {
    let queryParams = [`date=${encodeURIComponent(date)}`];
    if (routeId) queryParams.push(`routeId=${encodeURIComponent(routeId)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    const queryString = `?${queryParams.join('&')}`;
    return getRequest(`${getApiPrefix()}/deliveries${queryString}`, token);
  },

  trackDeliveries: (token, { date, routeId = '', status = '' } = {}) => {
    let queryParams = [`date=${encodeURIComponent(date)}`];
    if (routeId) queryParams.push(`routeId=${encodeURIComponent(routeId)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    const queryString = `?${queryParams.join('&')}`;
    return getRequest(`${getApiPrefix()}/deliveries/track${queryString}`, token);
  },

  updateDeliveryStatus: (token, id, statusData) =>
    patchRequest(`${getApiPrefix()}/deliveries/${id}/status`, statusData, token),
};
