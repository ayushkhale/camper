import { deleteRequest, getApiPrefix, getRequest, patchRequest, postRequest } from './client';

export const customersApi = {
  listCustomers: (token, search = '', routeId = '') => {
    let queryParams = [];
    if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
    if (routeId) queryParams.push(`routeId=${encodeURIComponent(routeId)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${getApiPrefix()}/customers${queryString}`, token);
  },

  getCustomer: (token, id) =>
    getRequest(`${getApiPrefix()}/customers/${id}`, token),

  createCustomer: (token, customerData) =>
    postRequest(`${getApiPrefix()}/customers`, customerData, token),

  updateCustomer: (token, id, customerData) =>
    patchRequest(`${getApiPrefix()}/customers/${id}`, customerData, token),

  deleteCustomer: (token, id) =>
    deleteRequest(`${getApiPrefix()}/customers/${id}`, token),

  updateCustomerSequence: (token, sequences) =>
    patchRequest(`${getApiPrefix()}/customers/sequence`, { sequences }, token),

  getCustomerDeliveries: (token, customerId, { from, to, status, invoiced } = {}) => {
    let queryParams = [];
    if (from) queryParams.push(`from=${encodeURIComponent(from)}`);
    if (to) queryParams.push(`to=${encodeURIComponent(to)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    if (invoiced) queryParams.push(`invoiced=${encodeURIComponent(invoiced)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${getApiPrefix()}/customers/${customerId}/deliveries${queryString}`, token);
  },

  getCustomerJarCollections: (token, customerId, { from, to } = {}) => {
    let queryParams = [];
    if (from) queryParams.push(`from=${encodeURIComponent(from)}`);
    if (to) queryParams.push(`to=${encodeURIComponent(to)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${getApiPrefix()}/customers/${customerId}/jar-collections${queryString}`, token);
  },

  getCustomerDeliveryHistory: (token, customerId, filters = {}) => {
    let queryParams = [];
    if (filters.invoiced) queryParams.push(`invoiced=${encodeURIComponent(filters.invoiced)}`);
    if (filters.status) queryParams.push(`status=${encodeURIComponent(filters.status)}`);
    if (filters.from) queryParams.push(`from=${encodeURIComponent(filters.from)}`);
    if (filters.to) queryParams.push(`to=${encodeURIComponent(filters.to)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${getApiPrefix()}/customers/${customerId}/deliveries${queryString}`, token);
  },

  getCustomerActivity: (token, customerId, params = {}) => {
    let queryParams = [];
    if (params.type && params.type !== 'all') queryParams.push(`type=${encodeURIComponent(params.type)}`);
    if (params.invoiced) queryParams.push(`invoiced=${encodeURIComponent(params.invoiced)}`);
    if (params.page) queryParams.push(`page=${encodeURIComponent(params.page)}`);
    if (params.limit) queryParams.push(`limit=${encodeURIComponent(params.limit)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${getApiPrefix()}/customers/${customerId}/activity${queryString}`, token);
  },
};
