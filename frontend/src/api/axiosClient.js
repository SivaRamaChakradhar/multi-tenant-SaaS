import axios from "axios";

// Use Vite environment variable when available (supports docker and local)
const DEFAULT_API = 'http://localhost:5001/api';
const apiBase = import.meta.env.VITE_API_URL || DEFAULT_API;

const axiosClient = axios.create({
  baseURL: apiBase,
});

// Debug: Log the resolved API URL
console.log('Axios baseURL configured to:', apiBase);

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Making request to:', config.baseURL + config.url, 'with data:', config.data);
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Request failed:', error.message);
    if (error.response) {
      console.error('Response error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
