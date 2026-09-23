import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  refreshAccessToken,
  apiDebugError,
  apiDebugLog,
  logAccessTokenDetails,
  setApiRole,
  setLogoutCallback,
  setTokenRefreshedCallback,
} from '../../shared/services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const token = await AsyncStorage.getItem('jwt_token');
        const userData = await AsyncStorage.getItem('user_data');
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setApiRole(parsedUser.role);
          logAccessTokenDetails('Restored saved session on app boot', token, {
            userRole: parsedUser.role,
          });
          
          if (parsedUser.logoUrl || parsedUser.imageUrl) {
            import('react-native-fast-image').then(FastImage => {
              FastImage.default.preload([{ uri: parsedUser.logoUrl || parsedUser.imageUrl }]);
            }).catch(() => {});
          }

          setUserToken(token);
          setUser(parsedUser);
        } else {
          apiDebugLog('[Auth Token] App boot found no complete saved session.', {
            accessTokenPresent: Boolean(token),
            userDataPresent: Boolean(userData),
          });
        }
      } catch (e) {
        apiDebugError('[Auth Token] Failed to load saved auth data.', e);
      } finally {
        setIsLoading(false);
      }
    };
    setLogoutCallback(() => {
      logout();
    });
    setTokenRefreshedCallback((token) => {
      apiDebugLog('[Auth Token] React auth state updated with the new access token.');
      setUserToken(token);
    });
    loadAuthData();

    return () => {
      setLogoutCallback(null);
      setTokenRefreshedCallback(null);
    };
  }, []);

  const login = async (token, refreshToken, userData) => {
    try {
      await AsyncStorage.setItem('jwt_token', token);
      if (refreshToken) {
        await AsyncStorage.setItem('refresh_token', refreshToken);
      }
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      setApiRole(userData?.role || 'owner');
      logAccessTokenDetails('Login succeeded and token was stored', token, {
        refreshTokenStored: Boolean(refreshToken),
        userRole: userData?.role || 'owner',
      });
      
      if (userData?.logoUrl || userData?.imageUrl) {
        import('react-native-fast-image').then(FastImage => {
          FastImage.default.preload([{ uri: userData.logoUrl || userData.imageUrl }]);
        }).catch(() => {});
      }

      setUserToken(token);
      setUser(userData);
    } catch (e) {
      apiDebugError('[Auth Token] Failed to save login data.', e);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      apiDebugLog('[Auth Token] Logout started.', {
        refreshTokenPresent: Boolean(refreshToken),
      });
      if (refreshToken) {
        import('../../shared/services/api').then(({ api }) => {
          api.logout(refreshToken).catch(err => apiDebugLog(
            '[Auth Token] API logout failed; local session cleanup continued.',
            err?.message || String(err),
          ));
        });
      }
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('user_data');
      setUserToken(null);
      setUser(null);
      apiDebugLog('[Auth Token] Local session cleared.');
    } catch (e) {
      apiDebugError('[Auth Token] Failed to remove login data.', e);
    }
  };

  const refreshAuthToken = useCallback(async (options) => {
    try {
      apiDebugLog('[Auth Token] AuthContext requested an access-token refresh.', options || {});
      const token = await refreshAccessToken(options);
      setUserToken(token);
      apiDebugLog('[Auth Token] AuthContext refresh completed.');
      return token;
    } catch (error) {
      apiDebugError('[Auth Token] AuthContext refresh failed.', {
        message: error?.message || String(error),
        authRevoked: Boolean(error?.authRevoked),
      });
      if (error.authRevoked) {
        setUserToken(null);
        setUser(null);
      }
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isLoading, userToken, user, login, logout, refreshAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
};
