/**
 * WebSocket 服务 - 用于实时聊天消息推送
 */

let ws = null;
let reconnectTimer = null;
let heartbeatTimer = null;
const listeners = new Map();

// WebSocket 服务器地址
const getWsUrl = () => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  
  // 根据当前环境确定 WebSocket 地址
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = import.meta.env.VITE_API_BASE_URL 
    ? new URL(import.meta.env.VITE_API_BASE_URL).host 
    : 'localhost:8080';
  
  return `${protocol}//${host}/ws/chat?token=${token}`;
};

/**
 * 连接 WebSocket
 */
export function connect() {
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
      console.log('WebSocket 已连接');
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
          } catch (e) {
            console.error('WebSocket 消息处理错误:', e);
          }
        });
      } catch (e) {
        // 可能是 pong 响应
        if (event.data !== 'pong') {
          console.warn('WebSocket 消息解析失败:', event.data);
        }
      }
    };
    
    ws.onclose = (event) => {
      console.log('WebSocket 已断开:', event.code, event.reason);
      stopHeartbeat();
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
    console.log('WebSocket 尝试重连...');
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
