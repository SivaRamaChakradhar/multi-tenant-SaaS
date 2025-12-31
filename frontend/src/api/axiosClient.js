import axios from "axios";

// Always use localhost:5000 when running in browser
// The frontend runs in browser, not in Docker, so it needs to call localhost
const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Debug: Log the API URL
console.log('Axios baseURL configured to: http://localhost:5000/api');

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
