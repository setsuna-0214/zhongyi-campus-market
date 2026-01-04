/**
 * HTTP 客户端
 * 基于 Axios 封装，处理认证、错误拦截、调试日志
 */

import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const DEBUG = import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true';

const client = axios.create({
  baseURL,
  timeout: 10000,
});

// 请求拦截：添加认证 Token
client.interceptors.request.use((config) => {
  if (DEBUG) {
    console.log(
      `%c[API Request] ${config.method?.toUpperCase()} ${config.url}`,
      'color: #2196F3; font-weight: bold;',
      config.data || ''
    );
  }

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
    } catch { }
  } else {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截：处理错误和认证失败
client.interceptors.response.use(
  (response) => {
    if (DEBUG) {
      console.log(
        `%c[API Response] ${response.status} ${response.config.url}`,
        'color: #4CAF50; font-weight: bold;',
        response.data
      );
    }
    return response;
  },
  (error) => {
    if (DEBUG) {
      const status = error.response?.status || 'Network Error';
      const url = error.config?.url || 'unknown';
      console.log(
        `%c[API Error] ${status} ${url}`,
        'color: #F44336; font-weight: bold;',
        {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          hint: getErrorHint(error),
        }
      );
    }

    // 处理 401 认证失败
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      if (!window.location.pathname.includes('/login')) {
        alert('登录已过期，请重新登录');
        window.location.href = '/login';
      }
    }

    const msg = error?.response?.data?.message || error.message || '网络错误';
    return Promise.reject(new Error(msg));
  }
);

// 根据错误类型返回调试提示
function getErrorHint(error) {
  if (!error.response) {
    if (error.message?.includes('Network Error')) {
      return '🔴 后端服务可能未启动，请检查 http://localhost:8080 是否可访问';
    }
    if (error.message?.includes('timeout')) {
      return '🟡 请求超时，后端响应过慢或服务卡死';
    }
    return '🔴 网络连接问题';
  }

  switch (error.response.status) {
    case 400:
      return '🟡 请求参数错误，检查请求体格式和必需字段';
    case 401:
      return '🟡 认证失败，Token 可能无效或过期，尝试重新登录';
    case 403:
      return '🟡 权限不足或 CORS 问题，检查后端 SecurityConfig';
    case 404:
      return '🟡 接口不存在，检查 API 路径和请求方法';
    case 500:
      return '🔴 服务器内部错误，查看后端控制台日志获取详细信息';
    default:
      return `🟡 HTTP ${error.response.status} 错误`;
  }
}

export default client;