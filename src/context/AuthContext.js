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
  }, []);

  const login = async (token, userData) => {
    try {
      await AsyncStorage.setItem('jwt_token', token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      setApiRole(userData?.role || 'owner');
      setUserToken(token);
      setUser(userData);
    } catch (e) {
      console.error('Failed to save login data', e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('jwt_token');
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
