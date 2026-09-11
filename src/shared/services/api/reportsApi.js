import { getApiPrefix, getRequest } from './client';

export const reportsApi = {
  getFinancialReports: (token, params = {}) => {
    let queryParams = [];
    if (params.rangePreset) queryParams.push(`rangePreset=${encodeURIComponent(params.rangePreset)}`);
    if (params.from) queryParams.push(`from=${encodeURIComponent(params.from)}`);
    if (params.to) queryParams.push(`to=${encodeURIComponent(params.to)}`);
    if (params.routeId) queryParams.push(`routeId=${encodeURIComponent(params.routeId)}`);
    if (params.staffId) queryParams.push(`staffId=${encodeURIComponent(params.staffId)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${getApiPrefix()}/reports/financials${queryString}`, token);
  },

  getOutstandingReports: (token, params = {}) => {
    let queryParams = [];
    if (params.routeId) queryParams.push(`routeId=${encodeURIComponent(params.routeId)}`);
    if (params.staffId) queryParams.push(`staffId=${encodeURIComponent(params.staffId)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${getApiPrefix()}/reports/outstanding${queryString}`, token);
  },

  getOperationsReports: (token, params = {}) => {
    let queryParams = [];
    if (params.rangePreset) queryParams.push(`rangePreset=${encodeURIComponent(params.rangePreset)}`);
    if (params.from) queryParams.push(`from=${encodeURIComponent(params.from)}`);
    if (params.to) queryParams.push(`to=${encodeURIComponent(params.to)}`);
    if (params.routeId) queryParams.push(`routeId=${encodeURIComponent(params.routeId)}`);
    if (params.staffId) queryParams.push(`staffId=${encodeURIComponent(params.staffId)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${getApiPrefix()}/reports/operations${queryString}`, token);
  },

  getInventoryReports: (token, params = {}) => {
    let queryParams = [];
    if (params.rangePreset) queryParams.push(`rangePreset=${encodeURIComponent(params.rangePreset)}`);
    if (params.from) queryParams.push(`from=${encodeURIComponent(params.from)}`);
    if (params.to) queryParams.push(`to=${encodeURIComponent(params.to)}`);
    if (params.routeId) queryParams.push(`routeId=${encodeURIComponent(params.routeId)}`);
    if (params.staffId) queryParams.push(`staffId=${encodeURIComponent(params.staffId)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${getApiPrefix()}/reports/inventory${queryString}`, token);
  },
};
