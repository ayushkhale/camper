import {
  deleteRequest,
  getApiPrefix,
  getRequest,
  patchMultipartRequest,
  patchRequest,
  postMultipartRequest,
} from './client';

export const productsApi = {
  listProducts: (token) =>
    getRequest(`${getApiPrefix()}/products`, token),

  getProduct: (token, id) =>
    getRequest(`${getApiPrefix()}/products/${id}`, token),

  createProduct: (token, formData) =>
    postMultipartRequest(`${getApiPrefix()}/products`, formData, token),

  updateProduct: (token, id, data, isMultipart = false) =>
    isMultipart
      ? patchMultipartRequest(`${getApiPrefix()}/products/${id}`, data, token)
      : patchRequest(`${getApiPrefix()}/products/${id}`, data, token),

  deleteProduct: (token, id) =>
    deleteRequest(`${getApiPrefix()}/products/${id}`, token),
};
