import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('token');
      if (storedToken) {
        setToken(storedToken);
        const res = await api.get('/api/auth/me');
        setUser(res.data);
      }
    } catch (e) {
      await SecureStore.deleteItemAsync('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { token, user } = res.data;
    await SecureStore.setItemAsync('token', token);
    setToken(token);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setToken(null);
    setUser(null);
  };

  const loginWithGoogle = async (accessToken) => {
    const res = await api.post('/api/auth/google', { token: accessToken });
    const { token, user: loggedInUser } = res.data;
    await SecureStore.setItemAsync('token', token);
    setToken(token);
    setUser(loggedInUser);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, loginWithGoogle, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);