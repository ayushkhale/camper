import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
  runSubscriptionRequest,
} from './client';

export const planBillingApi = {
  getActivePlans: (token) => {
    const endpoint = '/api/subscription_module/customer/plans';
    return runSubscriptionRequest(
      'getActivePlans',
      { method: 'GET', endpoint },
      () => getRequest(endpoint, token),
    );
  },

  getSubscriptionPlan: (token, planId) => {
    const endpoint = `/api/subscription_module/admin/plans/${planId}`;
    return runSubscriptionRequest(
      'getSubscriptionPlan',
      { method: 'GET', endpoint, planId },
      () => getRequest(endpoint, token),
    );
  },

  getSubscriptionStatus: (token, customerId) => {
    const endpoint = `/api/subscription_module/customer/subscription/${customerId}`;
    return runSubscriptionRequest(
      'getSubscriptionStatus',
      { method: 'GET', endpoint, customerId },
      () => getRequest(endpoint, token),
    );
  },

  getSubscriptionEntitlement: (token, customerId, featureKey) => {
    const encodedFeatureKey = encodeURIComponent(featureKey);
    const endpoint = `/api/subscription_module/customer/subscription/${customerId}/entitlement/${encodedFeatureKey}`;
    return runSubscriptionRequest(
      'getSubscriptionEntitlement',
      { method: 'GET', endpoint, customerId, featureKey },
      () => getRequest(endpoint, token),
    );
  },

  checkoutSubscription: (token, data) => {
    const endpoint = '/api/subscription_module/customer/checkout';
    return runSubscriptionRequest(
      'checkoutSubscription',
      { method: 'POST', endpoint, payload: data },
      () => postRequest(endpoint, data, token),
    );
  },

  changeSubscriptionPlan: (token, subscriptionId, data) => {
    const endpoint = `/api/subscription_module/customer/subscription/${subscriptionId}/plan`;
    return runSubscriptionRequest(
      'changeSubscriptionPlan',
      { method: 'PUT', endpoint, subscriptionId, payload: data },
      () => putRequest(endpoint, data, token),
    );
  },

  cancelSubscriptionPlan: (token, subscriptionId, data = { cancelAtPeriodEnd: true }) => {
    const endpoint = `/api/subscription_module/customer/subscription/${subscriptionId}`;
    return runSubscriptionRequest(
      'cancelSubscriptionPlan',
      { method: 'DELETE', endpoint, subscriptionId, payload: data },
      () => deleteRequest(endpoint, token, data),
    );
  },

  getSubscriptionPayments: (token, subscriptionId) => {
    const endpoint = `/api/subscription_module/customer/subscription/${subscriptionId}/payments`;
    return runSubscriptionRequest(
      'getSubscriptionPayments',
      { method: 'GET', endpoint, subscriptionId },
      () => getRequest(endpoint, token),
    );
  },

  getSubscriptionUsage: (token, customerId, params = {}) => {
    let queryParams = [];
    if (params.startDate) queryParams.push(`startDate=${encodeURIComponent(params.startDate)}`);
    if (params.endDate) queryParams.push(`endDate=${encodeURIComponent(params.endDate)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const endpoint = `/api/subscription_module/customer/subscription/${customerId}/usage${queryString}`;
    return runSubscriptionRequest(
      'getSubscriptionUsage',
      { method: 'GET', endpoint, customerId, filters: params },
      () => getRequest(endpoint, token),
    );
  },
};
