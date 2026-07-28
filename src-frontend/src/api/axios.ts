import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically inject the bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("gpo_access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry / unauthenticated responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthenticated request. Terminating session...");
      localStorage.removeItem("gpo_access_token");
      localStorage.removeItem("gpo_user");
      if (window.location.hash !== "#/login") {
        window.location.hash = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
