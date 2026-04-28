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
    const url = configuredBaseUrl.trim().replace(/\/+$/, '');
    console.log(`[API] Using Base URL (Configured): ${url}`);
    return url;
  }

  // Vitest runs in Node; call the backend directly (no Vite proxy).
  if (import.meta.env.MODE === 'test') {
    const url = 'http://localhost:5000/api';
    console.log(`[API] Using Base URL (Test): ${url}`);
    return url;
  }

  // Dev server: same-origin /api so Vite proxies to the backend (vite.config.js).
  if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
    const url = '/api';
    console.log(`[API] Using Base URL (Dev Proxy): ${url}`);
    return url;
  }

  // Production fallback
  const productionUrl = 'https://job-portal-tracker-backend.onrender.com/api';
  
  // If we are in production and the current configured URL is localhost, override it
  if (import.meta.env.PROD && typeof configuredBaseUrl === 'string' && configuredBaseUrl.includes('localhost')) {
    console.warn(`[API] Production build detected but VITE_API_BASE_URL is set to localhost. Overriding with production URL: ${productionUrl}`);
    return productionUrl;
  }

  const url = configuredBaseUrl || productionUrl;
  console.log(`[API] Using Base URL: ${url}`);
  return url;
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
