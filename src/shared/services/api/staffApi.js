import { deleteRequest, getApiPrefix, getRequest, patchRequest, postRequest } from './client';

export const staffApi = {
  listStaff: (token) =>
    getRequest(`${getApiPrefix()}/staff`, token),

  addStaff: (token, staffData) =>
    postRequest(`${getApiPrefix()}/staff`, staffData, token),

  updateStaff: (token, id, staffData) =>
    patchRequest(`${getApiPrefix()}/staff/${id}`, staffData, token),

  deleteStaff: (token, id) =>
    deleteRequest(`${getApiPrefix()}/staff/${id}`, token),
};
