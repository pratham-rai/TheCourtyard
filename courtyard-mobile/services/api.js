import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.29.177:5000'; // your local backend IP

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Auto-attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor to alert on connection issues
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
      const { Alert } = require('react-native');
      Alert.alert(
        'Connection Unreachable',
        `Unable to reach the backend at:\n${API_URL}\n\n1. Ensure the backend server is running.\n2. Ensure your phone/simulator is on the SAME Wi-Fi network.\n3. Verify your computer's local IP address and update services/api.js.`
      );
    }
    return Promise.reject(error);
  }
);

export default api;