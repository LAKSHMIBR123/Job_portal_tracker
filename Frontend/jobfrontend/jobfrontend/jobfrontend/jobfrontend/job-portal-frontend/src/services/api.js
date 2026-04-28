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
  const isLocalhost = typeof window !== 'undefined' && 
                     (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // 1. If a specific URL is configured in .env, use it (unless it's localhost in production)
  if (typeof configuredBaseUrl === 'string' && configuredBaseUrl.trim()) {
    const url = configuredBaseUrl.trim().replace(/\/+$/, '');
    
    // Safety check: Don't use localhost in production mode
    if (import.meta.env.PROD && (url.includes('localhost') || url.includes('127.0.0.1'))) {
      const productionUrl = 'https://job-portal-tracker-backend.onrender.com/api';
      console.warn(`[API] Production build detected but VITE_API_BASE_URL is set to localhost. Overriding with production URL: ${productionUrl}`);
      return productionUrl;
    }

    console.log(`[API] Using Base URL (Configured): ${url}`);
    return url;
  }

  // 2. Vitest runs in Node; call the backend directly (no Vite proxy).
  if (import.meta.env.MODE === 'test') {
    const url = 'http://localhost:5000/api';
    console.log(`[API] Using Base URL (Test): ${url}`);
    return url;
  }

  // 3. Local development: use same-origin /api so Vite proxies to the backend (vite.config.js).
  // We check for .DEV or if we are literally on localhost to be sure.
  if (import.meta.env.DEV || isLocalhost) {
    const url = '/api';
    console.log(`[API] Using Base URL (Dev Proxy): ${url}`);
    return url;
  }

  // 4. Production fallback
  const productionUrl = 'https://job-portal-tracker-backend.onrender.com/api';
  console.log(`[API] Using Base URL (Production Fallback): ${productionUrl}`);
  return productionUrl;
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
