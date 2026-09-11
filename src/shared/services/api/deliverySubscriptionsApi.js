import { deleteRequest, getApiPrefix, getRequest, patchRequest, postRequest } from './client';

export const deliverySubscriptionsApi = {
  listSubscriptions: (token, customerId = '', status = '') => {
    let queryParams = [];
    if (customerId) queryParams.push(`customerId=${encodeURIComponent(customerId)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${getApiPrefix()}/subscriptions${queryString}`, token);
  },

  getSubscription: (token, id) =>
    getRequest(`${getApiPrefix()}/subscriptions/${id}`, token),

  createSubscription: (token, subscriptionData) =>
    postRequest(`${getApiPrefix()}/subscriptions`, subscriptionData, token),

  updateSubscription: (token, id, subscriptionData) =>
    patchRequest(`${getApiPrefix()}/subscriptions/${id}`, subscriptionData, token),

  deleteSubscription: (token, id) =>
    deleteRequest(`${getApiPrefix()}/subscriptions/${id}`, token),

  listPauses: (token, subscriptionId) =>
    getRequest(`${getApiPrefix()}/subscriptions/${subscriptionId}/pauses`, token),

  addPause: (token, subscriptionId, pauseData) =>
    postRequest(`${getApiPrefix()}/subscriptions/${subscriptionId}/pauses`, pauseData, token),

  deletePause: (token, subscriptionId, pauseId) =>
    deleteRequest(`${getApiPrefix()}/subscriptions/${subscriptionId}/pauses/${pauseId}`, token),

  listOverrides: (token, subscriptionId) =>
    getRequest(`${getApiPrefix()}/subscriptions/${subscriptionId}/overrides`, token),

  addOverride: (token, subscriptionId, overrideData) =>
    postRequest(`${getApiPrefix()}/subscriptions/${subscriptionId}/overrides`, overrideData, token),

  deleteOverride: (token, subscriptionId, overrideId) =>
    deleteRequest(`${getApiPrefix()}/subscriptions/${subscriptionId}/overrides/${overrideId}`, token),
};
