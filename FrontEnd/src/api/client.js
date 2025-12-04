import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const client = axios.create({
  baseURL,
  timeout: 10000,
});

client.interceptors.request.use((config) => {
  // 优先使用独立存储的 token，其次从 authUser 中取
  const token = localStorage.getItem('authToken');
  if (!token) {
    try {
      const authUserRaw = localStorage.getItem('authUser');
      if (authUserRaw) {
        const authUser = JSON.parse(authUserRaw);
        if (authUser && authUser.token) {
          config.headers.Authorization = `Bearer ${authUser.token}`;
        }
      }
    } catch {}
  } else {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error?.response?.data?.message || error.message || '网络错误';
    return Promise.reject(new Error(msg));
  }
);

export default client;