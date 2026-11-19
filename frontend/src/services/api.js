import axios from 'axios';

const defaultBaseUrls = import.meta.env.VITE_API_URL
  ? [import.meta.env.VITE_API_URL]
  : [
      'http://localhost:5000/api',
      'http://localhost:5001/api',
      'http://localhost:5002/api',
      'http://localhost:5003/api'
    ];

let activeBaseUrlIndex = 0;
const api = axios.create({ baseURL: defaultBaseUrls[activeBaseUrlIndex] });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('r2c_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.baseURL = defaultBaseUrls[activeBaseUrlIndex];
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const isConnectionFailure = !error.response && (
      error.code === 'ERR_NETWORK' ||
      error.message === 'Network Error' ||
      error.message.includes('Failed to fetch')
    );

    if (isConnectionFailure && activeBaseUrlIndex < defaultBaseUrls.length - 1) {
      activeBaseUrlIndex += 1;
      api.defaults.baseURL = defaultBaseUrls[activeBaseUrlIndex];
      if (error.config) {
        error.config.baseURL = defaultBaseUrls[activeBaseUrlIndex];
        return api.request(error.config);
      }
    }

    return Promise.reject(error.response?.data || { message: error.message });
  }
);

export default api;
