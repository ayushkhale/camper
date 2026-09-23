jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    multiRemove: jest.fn(),
  },
}));

import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  applyNewToken,
  fetchWithAuth,
  logAccessTokenDetails,
  refreshAccessToken,
  runSubscriptionRequest,
  shouldLogApi,
  setLogoutCallback,
  setPlanLimitCallback,
  setTokenRefreshedCallback,
} from '../src/shared/services/api/client';

const response = (status, body) => ({
  status,
  ok: status >= 200 && status < 300,
  json: jest.fn().mockResolvedValue(body),
  clone: () => ({ json: jest.fn().mockResolvedValue(body) }),
});

beforeEach(() => {
  jest.clearAllMocks();
  AsyncStorage.getItem.mockImplementation(async (key) => ({
    refresh_token: 'old-refresh',
    jwt_token: 'old-access',
  }[key] || null));
  global.fetch = jest.fn();
  setLogoutCallback(null);
  setPlanLimitCallback(null);
  setTokenRefreshedCallback(null);
});

test('concurrent refresh requests share one rotation and update the auth token', async () => {
  const onToken = jest.fn();
  setTokenRefreshedCallback(onToken);
  global.fetch.mockResolvedValue(response(200, {
    token: 'new-access',
    refreshToken: 'new-refresh',
  }));

  const [first, second] = await Promise.all([refreshAccessToken(), refreshAccessToken()]);

  expect(first).toBe('new-access');
  expect(second).toBe('new-access');
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('jwt_token', 'new-access');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('refresh_token', 'new-refresh');
  expect(onToken).toHaveBeenCalledWith('new-access');
});

test('an inline plan token is stored and updates the auth state without a refresh request', async () => {
  const onToken = jest.fn();
  setTokenRefreshedCallback(onToken);

  await applyNewToken('inline-plan-access', 'plan test response');

  expect(AsyncStorage.setItem).toHaveBeenCalledWith('jwt_token', 'inline-plan-access');
  expect(onToken).toHaveBeenCalledWith('inline-plan-access');
  expect(global.fetch).not.toHaveBeenCalled();
});

test('development token diagnostics show decoded claims without printing the raw JWT', () => {
  const token = [
    'e30',
    Buffer.from(JSON.stringify({
      role: 'owner',
      exp: Math.floor(Date.now() / 1000) + 3600,
      entitlements: { invoicing: true, 'customer.limit': 100 },
    })).toString('base64url'),
    'signature',
  ].join('.');
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});

  logAccessTokenDetails('test login', token);

  expect(log).toHaveBeenCalledWith('[Auth Token] test login', expect.objectContaining({
    entitlementCount: 2,
    entitlements: { invoicing: true, 'customer.limit': 100 },
  }));
  expect(JSON.stringify(log.mock.calls)).not.toContain(token);
  log.mockRestore();
});

test('API diagnostics stay disabled for production and HTTPS backends', () => {
  expect(shouldLogApi(false, 'http://192.168.1.6:3007')).toBe(false);
  expect(shouldLogApi(true, 'https://api.example.test')).toBe(false);
  expect(shouldLogApi(true, 'http://192.168.1.6:3007')).toBe(true);
});

test('subscription responses centrally apply an inline newToken', async () => {
  const onToken = jest.fn();
  setTokenRefreshedCallback(onToken);

  const result = await runSubscriptionRequest(
    'changeSubscriptionPlan',
    { subscriptionId: 'subscription-id' },
    async () => ({ success: true, data: { newToken: 'changed-plan-access' } }),
  );

  expect(result.success).toBe(true);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('jwt_token', 'changed-plan-access');
  expect(onToken).toHaveBeenCalledWith('changed-plan-access');
  expect(global.fetch).not.toHaveBeenCalled();
});

test('a plan-change refresh waits for any older rotation and gets a newer token', async () => {
  const stored = { refresh_token: 'old-refresh', jwt_token: 'old-access' };
  AsyncStorage.getItem.mockImplementation(async (key) => stored[key] || null);
  AsyncStorage.setItem.mockImplementation(async (key, value) => { stored[key] = value; });
  let finishFirst;
  global.fetch
    .mockImplementationOnce(() => new Promise((resolve) => { finishFirst = resolve; }))
    .mockResolvedValueOnce(response(200, {
      token: 'plan-access', refreshToken: 'plan-refresh',
    }));

  const olderRefresh = refreshAccessToken();
  const planRefresh = refreshAccessToken({ forceFresh: true });
  await Promise.resolve();
  finishFirst(response(200, { token: 'older-access', refreshToken: 'newer-refresh' }));

  await expect(olderRefresh).resolves.toBe('older-access');
  await expect(planRefresh).resolves.toBe('plan-access');
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(JSON.parse(global.fetch.mock.calls[1][1].body).refreshToken).toBe('newer-refresh');
});

test('a 401 request refreshes once and retries with the new access token', async () => {
  global.fetch
    .mockResolvedValueOnce(response(401, {}))
    .mockResolvedValueOnce(response(200, { token: 'new-access', refreshToken: 'new-refresh' }))
    .mockResolvedValueOnce(response(200, { success: true }));

  const result = await fetchWithAuth('https://example.test/api/vendor/customers', {
    method: 'GET',
    headers: {},
  }, 'old-access');

  expect(result.status).toBe(200);
  expect(global.fetch).toHaveBeenCalledTimes(3);
  expect(global.fetch.mock.calls[2][1].headers.Authorization).toBe('Bearer new-access');
});

test('revoked refresh tokens clear the session and call logout', async () => {
  const onLogout = jest.fn();
  setLogoutCallback(onLogout);
  global.fetch.mockResolvedValue(response(401, { message: 'Revoked' }));

  await expect(refreshAccessToken()).rejects.toThrow('Revoked');
  expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
    'jwt_token', 'refresh_token', 'user_data',
  ]);
  expect(onLogout).toHaveBeenCalledTimes(1);
});

test('a request still rejected after refresh ends the session', async () => {
  const onLogout = jest.fn();
  setLogoutCallback(onLogout);
  global.fetch
    .mockResolvedValueOnce(response(401, {}))
    .mockResolvedValueOnce(response(200, { token: 'new-access', refreshToken: 'new-refresh' }))
    .mockResolvedValueOnce(response(401, {}));

  await expect(fetchWithAuth('https://example.test/api/vendor/customers', {
    method: 'GET', headers: {},
  }, 'old-access')).rejects.toThrow('Session expired');
  expect(onLogout).toHaveBeenCalledTimes(1);
});

test('a network failure does not discard a valid session', async () => {
  global.fetch.mockRejectedValue(new Error('Network unavailable'));

  await expect(refreshAccessToken()).rejects.toThrow('Network unavailable');
  expect(AsyncStorage.multiRemove).not.toHaveBeenCalled();
});

test('a quota rejection identifies the specific resource limit', async () => {
  const onPlanLimit = jest.fn();
  setPlanLimitCallback(onPlanLimit);
  global.fetch.mockResolvedValue(response(409, { message: 'Customer limit reached' }));

  await expect(fetchWithAuth('https://example.test/api/vendor/customers', {
    method: 'POST', headers: {},
  }, 'old-access')).rejects.toMatchObject({ isPlanLimit: true });
  expect(onPlanLimit).toHaveBeenCalledWith('Customer limit reached',
    expect.objectContaining({ featureKey: 'customer.limit' }));
});
