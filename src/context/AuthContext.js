import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setApiRole } from '../services/api';

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
          
          if (parsedUser.logoUrl || parsedUser.imageUrl) {
            import('react-native-fast-image').then(FastImage => {
              FastImage.default.preload([{ uri: parsedUser.logoUrl || parsedUser.imageUrl }]);
            }).catch(() => {});
          }

          setUserToken(token);
          setUser(parsedUser);
        }
      } catch (e) {
        console.error('Failed to load auth data', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthData();

    // Register callback so api.js can trigger logout on refresh token failure
    import('../services/api').then(({ setLogoutCallback, setTokenRefreshedCallback }) => {
      setLogoutCallback(() => {
        logout();
      });
      setTokenRefreshedCallback((newToken) => {
        setUserToken(newToken);
      });
    });
  }, []);

  const login = async (token, refreshToken, userData) => {
    try {
      await AsyncStorage.setItem('jwt_token', token);
      if (refreshToken) {
        await AsyncStorage.setItem('refresh_token', refreshToken);
      }
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      setApiRole(userData?.role || 'owner');
      
      if (userData?.logoUrl || userData?.imageUrl) {
        import('react-native-fast-image').then(FastImage => {
          FastImage.default.preload([{ uri: userData.logoUrl || userData.imageUrl }]);
        }).catch(() => {});
      }

      setUserToken(token);
      setUser(userData);
    } catch (e) {
      console.error('Failed to save login data', e);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (refreshToken) {
        import('../services/api').then(({ api }) => {
          api.logout(refreshToken).catch(err => console.log('API logout failed, cleaning up locally', err));
        });
      }
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('user_data');
      setUserToken(null);
      setUser(null);
    } catch (e) {
      console.error('Failed to remove login data', e);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoading, userToken, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
