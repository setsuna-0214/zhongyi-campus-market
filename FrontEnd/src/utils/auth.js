/**
 * 认证工具函数
 * 统一管理登录状态检查和用户信息获取
 */

const AUTH_USER_KEY = 'authUser';
const AUTH_TOKEN_KEY = 'authToken';

/**
 * 获取当前登录用户信息
 * @returns {Object|null} 用户对象或null
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // 解析失败时清除无效数据
    localStorage.removeItem(AUTH_USER_KEY);
  }
  return null;
}

/**
 * 获取当前登录用户ID
 * @returns {string|number|null} 用户ID或null
 */
export function getCurrentUserId() {
  const user = getCurrentUser();
  return user?.id || null;
}

/**
 * 检查用户是否已登录
 * @returns {boolean}
 */
export function isLoggedIn() {
  return !!getCurrentUser();
}

/**
 * 获取认证Token
 * @returns {string|null}
 */
export function getAuthToken() {
  // 优先使用独立存储的token
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) return token;
  
  // 其次从authUser中获取
  const user = getCurrentUser();
  return user?.token || null;
}

/**
 * 检查用户角色
 * @param {string|string[]} roles - 允许的角色或角色数组
 * @returns {boolean}
 */
export function hasRole(roles) {
  const user = getCurrentUser();
  if (!user?.role) return false;
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.includes(user.role);
}

/**
 * 检查是否是管理员
 * @returns {boolean}
 */
export function isAdmin() {
  return hasRole(['admin', 'ADMIN']);
}

/**
 * 设置登录用户信息
 * @param {Object} user - 用户对象
 * @param {string} [token] - 可选的独立token
 */
export function setAuthUser(user, token) {
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

/**
 * 更新当前用户的部分信息
 * @param {Object} updates - 要更新的字段
 */
export function updateAuthUser(updates) {
  const user = getCurrentUser();
  if (user && updates) {
    const updated = { ...user, ...updates };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
    // 触发自定义事件通知其他组件
    window.dispatchEvent(new CustomEvent('userUpdated', { detail: updated }));
  }
}

/**
 * 清除登录状态
 */
export function clearAuth() {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * 需要登录的操作检查
 * @param {Object} options - 配置选项
 * @param {Function} options.navigate - 路由导航函数
 * @param {Function} [options.onUnauthorized] - 未登录时的回调
 * @param {string} [options.message] - 提示消息
 * @param {string} [options.redirectTo] - 重定向路径，默认'/login'
 * @returns {boolean} 是否已登录
 */
export function requireAuth({ navigate, onUnauthorized, message: msg, redirectTo = '/login' }) {
  if (isLoggedIn()) {
    return true;
  }
  
  if (onUnauthorized) {
    onUnauthorized(msg || '请先登录');
  }
  
  if (navigate) {
    navigate(redirectTo);
  }
  
  return false;
}

/**
 * 检查是否是当前用户自己
 * @param {string|number} userId - 要检查的用户ID
 * @returns {boolean}
 */
export function isSelf(userId) {
  const currentId = getCurrentUserId();
  return currentId && String(currentId) === String(userId);
}
