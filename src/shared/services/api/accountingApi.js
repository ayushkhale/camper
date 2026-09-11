import { getApiPrefix, getRequest, postRequest } from './client';

export const accountingApi = {
  recordPayment: (token, data) =>
    postRequest(`${getApiPrefix()}/ledgers/payment`, data, token),

  getAccountStatement: (token, customerId) =>
    getRequest(`${getApiPrefix()}/ledgers/account/${customerId}`, token),

  collectDeposit: (token, data) =>
    postRequest(`${getApiPrefix()}/deposits/collect`, data, token),

  settleDepositToBill: (token, data) =>
    postRequest(`${getApiPrefix()}/deposits/settle-to-bill`, data, token),

  refundDeposit: (token, data) =>
    postRequest(`${getApiPrefix()}/deposits/refund`, data, token),

  getDepositLedger: (token, customerId) =>
    getRequest(`${getApiPrefix()}/deposits/${customerId}`, token),
};
