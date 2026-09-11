import { deleteRequest, getApiPrefix, getRequest, patchRequest, postRequest } from './client';

export const routesApi = {
  listRoutes: (token) =>
    getRequest(`${getApiPrefix()}/routes`, token),

  getRoutes: (token) =>
    getRequest(`${getApiPrefix()}/routes`, token),

  getRoute: (token, id) =>
    getRequest(`${getApiPrefix()}/routes/${id}`, token),

  createRoute: (token, routeData) =>
    postRequest(`${getApiPrefix()}/routes`, routeData, token),

  updateRoute: (token, id, routeData) =>
    patchRequest(`${getApiPrefix()}/routes/${id}`, routeData, token),

  deleteRoute: (token, id) =>
    deleteRequest(`${getApiPrefix()}/routes/${id}`, token),

  assignStaff: (token, id, assignmentData) =>
    postRequest(`${getApiPrefix()}/routes/${id}/assign-staff`, assignmentData, token),

  endStaffAssignment: (token, routeId, staffRouteId) =>
    deleteRequest(`${getApiPrefix()}/routes/${routeId}/assign-staff/${staffRouteId}`, token),
};
