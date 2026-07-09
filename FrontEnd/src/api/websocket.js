/**
 * WebSocket 服务 - 用于实时聊天消息推送
 */

let ws = null;
let reconnectTimer = null;
let heartbeatTimer = null;
const listeners = new Map();

const USE_MOCK = String(import.meta.env.VITE_USE_MOCK || 'false') === 'true';

// WebSocket 服务器地址（不在 URL 中传递 token，改用连接后发送认证消息）
const getWsUrl = () => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  // 根据当前环境确定 WebSocket 地址
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  // 处理 API 地址，支持相对路径和绝对路径
  let host = window.location.host; // 默认使用当前页面的 host
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (apiBaseUrl && !apiBaseUrl.startsWith('/')) {
    // 如果是完整 URL，提取 host
    try {
      host = new URL(apiBaseUrl).host;
    } catch {
      console.warn('Invalid VITE_API_BASE_URL, using current host');
    }
  }
  // 如果是相对路径（如 /api），使用当前页面的 host

  // 注意：为了安全，token 不应该放在 URL 中（避免出现在日志/历史记录等）
  return `${protocol}//${host}/ws/chat`;
};

/**
 * 连接 WebSocket
 */
export function connect() {
  // Mock 模式不连接后端 WebSocket，避免本地无后端时 Vite proxy 报 ECONNREFUSED
  if (USE_MOCK) return;

  const url = getWsUrl();
  if (!url) {
    console.warn('WebSocket: 未登录，无法连接');
    return;
  }

  // 如果已连接，不重复连接
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return;
  }

  try {
    ws = new WebSocket(url);

    ws.onopen = () => {
      console.warn('WebSocket 已连接');

      // 连接建立后发送认证消息（避免 token 出现在 URL）
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          ws.send(JSON.stringify({ type: 'auth', token }));
        }
      } catch (e) {
        console.warn('WebSocket 认证消息发送失败:', e);
      }

      // 清除重连定时器
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      // 启动心跳
      startHeartbeat();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // 通知所有监听器
        listeners.forEach((callback) => {
          try {
            callback(data);
          } catch {
            console.error('WebSocket 消息处理错误');
          }
        });
      } catch {
        // 可能是 pong 响应
        if (event.data !== 'pong') {
          console.warn('WebSocket 消息解析失败:', event.data);
        }
      }
    };

    ws.onclose = (event) => {
      console.warn('WebSocket 已断开:', event.code, event.reason);
      stopHeartbeat();

      // 认证失败等场景不重连，避免无限重试
      if (event.code === 1003 || event.code === 1008) {
        console.warn('WebSocket 关闭：认证失败或请求不可接受，将停止重连');
        return;
      }

      // 非正常关闭时尝试重连
      if (event.code !== 1000) {
        scheduleReconnect();
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
    };
  } catch (e) {
    console.error('WebSocket 连接失败:', e);
    scheduleReconnect();
  }
}

/**
 * 断开 WebSocket
 */
export function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  stopHeartbeat();
  if (ws) {
    ws.close(1000, 'User disconnect');
    ws = null;
  }
}

/**
 * 添加消息监听器
 * @param {string} id - 监听器ID
 * @param {function} callback - 回调函数
 */
export function addListener(id, callback) {
  listeners.set(id, callback);
}

/**
 * 移除消息监听器
 * @param {string} id - 监听器ID
 */
export function removeListener(id) {
  listeners.delete(id);
}

/**
 * 检查是否已连接
 */
export function isConnected() {
  return ws && ws.readyState === WebSocket.OPEN;
}

/**
 * 安排重连
 */
function scheduleReconnect() {
  if (reconnectTimer) return;

  // 5秒后重连
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    console.warn('WebSocket 尝试重连...');
    connect();
  }, 5000);
}

/**
 * 启动心跳
 */
function startHeartbeat() {
  stopHeartbeat();
  // 每30秒发送一次心跳
  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send('ping');
    }
  }, 30000);
}

/**
 * 停止心跳
 */
function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// 页面卸载时断开连接
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', disconnect);
}
