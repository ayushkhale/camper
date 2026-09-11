import ReactNativeBlobUtil from 'react-native-blob-util';
import { API_BASE_URL, getApiPrefix, getRequest, postRequest } from './client';

export const invoicesApi = {
  getUninvoicedPreSummary: (token, customerId = '') => {
    const queryString = customerId ? `?customerId=${encodeURIComponent(customerId)}` : '';
    return getRequest(`${getApiPrefix()}/invoices/pre-summary${queryString}`, token);
  },

  generateInvoices: (token, payload) =>
    postRequest(`${getApiPrefix()}/invoices/generate`, payload, token),

  listInvoices: (token, { customerId, status, from, to } = {}) => {
    let queryParams = [];
    if (customerId) queryParams.push(`customerId=${encodeURIComponent(customerId)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    if (from) queryParams.push(`from=${encodeURIComponent(from)}`);
    if (to) queryParams.push(`to=${encodeURIComponent(to)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return getRequest(`${getApiPrefix()}/invoices${queryString}`, token);
  },

  getInvoiceById: (token, id) =>
    getRequest(`${getApiPrefix()}/invoices/${id}`, token),

  addInvoiceAdjustments: (token, invoiceId, adjustments) =>
    postRequest(
      `${getApiPrefix()}/invoices/${encodeURIComponent(invoiceId)}/adjustments`,
      { adjustments },
      token
    ),

  downloadInvoicePDF: async (token, invoiceId, customerName = 'Customer') => {
    const url = `${API_BASE_URL}/api/vendor/invoices/${invoiceId}/download`;
    console.log(`🚀 [API Request] GET ${url} for PDF download`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to download invoice PDF: ${response.status}`);
      }

      const blob = await response.blob();
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

      if (!base64String) {
        throw new Error('Failed to parse base64 data from PDF');
      }

      const dirs = ReactNativeBlobUtil.fs.dirs;
      const safeName = customerName.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_');
      const path = `${dirs.CacheDir}/${safeName}_Invoice.pdf`;

      await ReactNativeBlobUtil.fs.writeFile(path, base64String, 'base64');

      return path;
    } catch (error) {
      throw new Error(`Error downloading PDF: ${error.message}`);
    }
  },

  getUninvoicedSummary: (token, customerId = null) => {
    const params = customerId ? `?customerId=${encodeURIComponent(customerId)}` : '';
    return getRequest(`${getApiPrefix()}/invoices/pre-summary${params}`, token);
  },
};
