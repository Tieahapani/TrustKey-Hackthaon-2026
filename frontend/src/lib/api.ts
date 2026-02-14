import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000,
});

// Automatically attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Token retrieval failed — continue without auth
  }
  return config;
});

// Handle network errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.warn('API unreachable — backend may not be running');
    }
    return Promise.reject(error);
  }
);

export default api;
