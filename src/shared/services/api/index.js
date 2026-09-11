import { accountingApi } from './accountingApi';
import { authApi } from './authApi';
import { customersApi } from './customersApi';
import { dashboardApi } from './dashboardApi';
import { deliveriesApi } from './deliveriesApi';
import { deliverySubscriptionsApi } from './deliverySubscriptionsApi';
import { invoicesApi } from './invoicesApi';
import { oneTimeOrdersApi } from './oneTimeOrdersApi';
import { planBillingApi } from './planBillingApi';
import { productsApi } from './productsApi';
import { profileApi } from './profileApi';
import { reportsApi } from './reportsApi';
import { routesApi } from './routesApi';
import { staffApi } from './staffApi';

export const api = {
  ...authApi,
  ...profileApi,
  ...staffApi,
  ...productsApi,
  ...routesApi,
  ...customersApi,
  ...deliverySubscriptionsApi,
  ...deliveriesApi,
  ...oneTimeOrdersApi,
  ...dashboardApi,
  ...invoicesApi,
  ...accountingApi,
  ...reportsApi,
  ...planBillingApi,
};
