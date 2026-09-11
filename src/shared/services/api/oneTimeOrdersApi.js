import { getApiPrefix, getRequest, patchRequest, postRequest } from './client';

export const oneTimeOrdersApi = {
  listOneTimeOrders: (token) =>
    getRequest(`${getApiPrefix()}/one-time-orders`, token),

  createOneTimeOrder: (token, orderData) =>
    postRequest(`${getApiPrefix()}/one-time-orders`, orderData, token),

  updateOneTimeOrderStatus: (token, id, status) =>
    patchRequest(`${getApiPrefix()}/one-time-orders/${id}/status`, { status }, token),

  fulfillOneTimeOrder: (token, id, data) =>
    postRequest(`${getApiPrefix()}/one-time-orders/${id}/fulfill`, data, token),
};
