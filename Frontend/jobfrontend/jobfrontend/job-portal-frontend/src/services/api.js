// Apply Job API
import axios from "axios";

export const applyJob = async (jobId) => {
  const res = await API.post("/applications/apply", { jobId }, {
    withCredentials: true
  });
  return res.data;
};


export function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (typeof configuredBaseUrl === 'string' && configuredBaseUrl.trim()) {
    return configuredBaseUrl.trim().replace(/\/+$/, '');
  }

  // Vitest runs in Node; call the backend directly (no Vite proxy).
  if (import.meta.env.MODE === 'test') {
    return 'http://localhost:5000/api';
  }

  // Dev server: same-origin /api so Vite proxies to the backend (vite.config.js).
  // Vitest runs with DEV=true but MODE=test — use absolute URL there.
  if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
    return '/api';
  }

  return 'http://localhost:5000/api';
}

function getStoredToken() {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const token = localStorage.getItem('token');
  return typeof token === 'string' && token.trim() ? token.trim() : null;
}

const API = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (token && !config.headers?.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
