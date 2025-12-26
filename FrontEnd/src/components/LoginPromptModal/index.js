import { Modal } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index.css';

let modalInstance = null;

// 允许的重定向路径白名单（防止开放重定向攻击）
const ALLOWED_REDIRECT_PATHS = ['/login', '/register', '/'];

/**
 * 验证重定向路径是否安全
 * @param {string} path - 重定向路径
 * @returns {string} 安全的重定向路径
 */
function sanitizeRedirectPath(path) {
  // 只允许相对路径，且必须以 / 开头
  if (!path || typeof path !== 'string') {
    return '/login';
  }
  // 防止协议相对 URL (//example.com) 和绝对 URL
  if (path.startsWith('//') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) {
    return '/login';
  }
  // 确保路径以 / 开头
  if (!path.startsWith('/')) {
    return '/login';
  }
  return path;
}

/**
 * 显示登录提示弹窗
 * @param {Object} options - 配置选项
 * @param {string} [options.title] - 弹窗标题
 * @param {string} [options.message] - 提示消息
 * @param {string} [options.redirectTo] - 登录后重定向路径
 * @param {Function} [options.onCancel] - 取消回调
 */
export function showLoginPrompt(options = {}) {
  const {
    title = '需要登录',
    message = '该操作需要登录后才能进行',
    redirectTo = '/login',
    onCancel,
  } = options;

  // 验证重定向路径
  const safeRedirectTo = sanitizeRedirectPath(redirectTo);

  // 避免重复弹窗
  if (modalInstance) {
    modalInstance.destroy();
  }

  modalInstance = Modal.confirm({
    title: null,
    icon: null,
    className: 'login-prompt-modal',
    centered: true,
    content: (
      <div className="login-prompt-content">
        <div className="login-prompt-icon">
          <UserOutlined />
        </div>
        <div className="login-prompt-title">{title}</div>
        <div className="login-prompt-message">{message}</div>
      </div>
    ),
    okText: '去登录',
    cancelText: '稍后再说',
    okButtonProps: {
      className: 'login-prompt-ok-btn',
    },
    cancelButtonProps: {
      className: 'login-prompt-cancel-btn',
    },
    onOk: () => {
      modalInstance = null;
      // 保存当前路径用于登录后跳转回来
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/login' && currentPath !== '/register') {
        sessionStorage.setItem('loginRedirect', currentPath);
      }
      window.location.href = safeRedirectTo;
    },
    onCancel: () => {
      modalInstance = null;
      onCancel?.();
    },
  });

  return modalInstance;
}

/**
 * LoginPromptModal 组件 - 用于在组件内使用 navigate
 */
export function useLoginPrompt() {
  const navigate = useNavigate();

  const showPrompt = (options = {}) => {
    const {
      title = '需要登录',
      message = '该操作需要登录后才能进行',
      redirectTo = '/login',
      onCancel,
    } = options;

    // 验证重定向路径
    const safeRedirectTo = sanitizeRedirectPath(redirectTo);

    if (modalInstance) {
      modalInstance.destroy();
    }

    modalInstance = Modal.confirm({
      title: null,
      icon: null,
      className: 'login-prompt-modal',
      centered: true,
      content: (
        <div className="login-prompt-content">
          <div className="login-prompt-icon">
            <UserOutlined />
          </div>
          <div className="login-prompt-title">{title}</div>
          <div className="login-prompt-message">{message}</div>
        </div>
      ),
      okText: '去登录',
      cancelText: '稍后再说',
      okButtonProps: {
        className: 'login-prompt-ok-btn',
      },
      cancelButtonProps: {
        className: 'login-prompt-cancel-btn',
      },
      onOk: () => {
        modalInstance = null;
        const currentPath = window.location.pathname + window.location.search;
        if (currentPath !== '/login' && currentPath !== '/register') {
          sessionStorage.setItem('loginRedirect', currentPath);
        }
        navigate(safeRedirectTo);
      },
      onCancel: () => {
        modalInstance = null;
        onCancel?.();
      },
    });

    return modalInstance;
  };

  return { showLoginPrompt: showPrompt };
}

export default { showLoginPrompt, useLoginPrompt };
