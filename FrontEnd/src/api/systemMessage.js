import client from './client';
import { isLoggedIn } from '../utils/auth';

/**
 * 系统消息 API
 * 用于获取和管理系统通知消息
 */

const USE_MOCK = String(import.meta.env.VITE_USE_MOCK || 'false') === 'true';
const MOCK_MESSAGES_KEY = 'mock_system_messages';
const MOCK_SETTINGS_KEY = 'mock_notification_settings';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// 系统消息类型 - 与实际业务流程对应
export const SYSTEM_MESSAGE_TYPES = {
  // 商品相关
  PRODUCT_PUBLISHED: 'product_published',      // 商品发布成功
  PRODUCT_SOLD: 'product_sold',                // 商品被购买（卖家收到）
  PRODUCT_UNLOCKED: 'product_unlocked',        // 商品已解锁（订单取消后）
  
  // 订单相关 - 买家视角
  ORDER_CREATED: 'order_created',              // 订单创建成功（买家收到）
  ORDER_PROCESSED: 'order_processed',          // 卖家已处理订单（买家收到）
  ORDER_COMPLETED: 'order_completed',          // 订单已完成
  ORDER_CANCELLED: 'order_cancelled',          // 订单已取消
  
  // 订单相关 - 卖家视角
  NEW_ORDER: 'new_order',                      // 收到新订单（卖家收到）
  BUYER_CONFIRMED: 'buyer_confirmed',          // 买家已确认收货（卖家收到）
  BUYER_CANCELLED: 'buyer_cancelled',          // 买家取消订单（卖家收到）
  
  // 社交相关
  NEW_FOLLOWER: 'new_follower',                // 新粉丝
  PRODUCT_FAVORITED: 'product_favorited',      // 商品被收藏
};

// 系统消息图标映射
export const SYSTEM_MESSAGE_ICONS = {
  // 商品相关
  [SYSTEM_MESSAGE_TYPES.PRODUCT_PUBLISHED]: '📦',
  [SYSTEM_MESSAGE_TYPES.PRODUCT_SOLD]: '🎉',
  [SYSTEM_MESSAGE_TYPES.PRODUCT_UNLOCKED]: '🔓',
  
  // 订单相关 - 买家视角
  [SYSTEM_MESSAGE_TYPES.ORDER_CREATED]: '🛒',
  [SYSTEM_MESSAGE_TYPES.ORDER_PROCESSED]: '📬',
  [SYSTEM_MESSAGE_TYPES.ORDER_COMPLETED]: '✅',
  [SYSTEM_MESSAGE_TYPES.ORDER_CANCELLED]: '❌',
  
  // 订单相关 - 卖家视角
  [SYSTEM_MESSAGE_TYPES.NEW_ORDER]: '🔔',
  [SYSTEM_MESSAGE_TYPES.BUYER_CONFIRMED]: '🤝',
  [SYSTEM_MESSAGE_TYPES.BUYER_CANCELLED]: '↩️',
  
  // 社交相关
  [SYSTEM_MESSAGE_TYPES.NEW_FOLLOWER]: '👤',
  [SYSTEM_MESSAGE_TYPES.PRODUCT_FAVORITED]: '❤️',
};

/**
 * 从后端 Result 对象中提取数据
 */
function extractData(response) {
  const data = response?.data;
  if (data && typeof data === 'object' && 'code' in data && 'data' in data) {
    return data.data;
  }
  return data;
}

// 缓存配置
const CACHE_TTL = 30 * 1000; // 缓存有效期 30 秒
let systemMessagesCache = null;
let cacheTimestamp = 0;

/**
 * 获取系统消息列表（带缓存）
 * @param {boolean} forceRefresh - 是否强制刷新缓存
 * @returns {Promise<Array>} 系统消息列表
 */
export async function listSystemMessages(forceRefresh = false) {
  // 未登录时直接返回空数组
  if (!isLoggedIn()) {
    return [];
  }

  // Mock 模式：不请求后端，避免本地无后端时 Vite proxy 报 ECONNREFUSED
  if (USE_MOCK) {
    if (!forceRefresh && systemMessagesCache) return systemMessagesCache;
    const list = readJson(MOCK_MESSAGES_KEY, []);
    const messages = Array.isArray(list) ? list : [];
    systemMessagesCache = messages;
    cacheTimestamp = Date.now();
    return messages;
  }
  
  const now = Date.now();
  
  // 使用缓存（未过期且非强制刷新）
  if (!forceRefresh && systemMessagesCache && (now - cacheTimestamp) < CACHE_TTL) {
    return systemMessagesCache;
  }
  
  try {
    const response = await client.get('/system-messages');
    const result = extractData(response);
    const messages = Array.isArray(result) ? result : (result?.items || []);
    
    // 更新缓存
    systemMessagesCache = messages;
    cacheTimestamp = now;
    
    return messages;
  } catch (error) {
    console.error('获取系统消息失败:', error);
    // API失败时返回空数组
    return [];
  }
}

/**
 * 清除系统消息缓存
 */
export function clearSystemMessagesCache() {
  systemMessagesCache = null;
  cacheTimestamp = 0;
}

/**
 * 获取未读系统消息数量
 * @returns {Promise<number>} 未读数量
 */
export async function getUnreadSystemMessageCount() {
  if (USE_MOCK) {
    const list = readJson(MOCK_MESSAGES_KEY, []);
    const messages = Array.isArray(list) ? list : [];
    return messages.filter(m => !m?.isRead).length;
  }
  try {
    const response = await client.get('/system-messages/unread-count');
    const result = extractData(response);
    return typeof result === 'number' ? result : (result?.count || 0);
  } catch (error) {
    console.error('获取未读系统消息数量失败:', error);
    return 0;
  }
}

/**
 * 标记系统消息为已读
 * @param {string|number} messageId - 消息ID，传 'all' 标记全部已读
 * @returns {Promise<{success: boolean}>}
 */
export async function markSystemMessageAsRead(messageId) {
  if (USE_MOCK) {
    const list = readJson(MOCK_MESSAGES_KEY, []);
    const messages = Array.isArray(list) ? list : [];
    const updated = messageId === 'all'
      ? messages.map(m => ({ ...m, isRead: true }))
      : messages.map(m => (String(m?.id) === String(messageId) ? { ...m, isRead: true } : m));
    writeJson(MOCK_MESSAGES_KEY, updated);
    systemMessagesCache = updated;
    cacheTimestamp = Date.now();
    return { success: true };
  }
  try {
    if (messageId === 'all') {
      const response = await client.put('/system-messages/read-all');
      // 更新缓存中的已读状态
      if (systemMessagesCache) {
        systemMessagesCache = systemMessagesCache.map(m => ({ ...m, isRead: true }));
      }
      return extractData(response);
    }
    const response = await client.put(`/system-messages/${messageId}/read`);
    // 更新缓存中的已读状态
    if (systemMessagesCache) {
      systemMessagesCache = systemMessagesCache.map(m => 
        m.id === messageId ? { ...m, isRead: true } : m
      );
    }
    return extractData(response);
  } catch (error) {
    console.error('标记系统消息已读失败:', error);
    return { success: false };
  }
}

/**
 * 删除系统消息
 * @param {string|number} messageId - 消息ID
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteSystemMessage(messageId) {
  if (USE_MOCK) {
    const list = readJson(MOCK_MESSAGES_KEY, []);
    const messages = Array.isArray(list) ? list : [];
    const updated = messages.filter(m => String(m?.id) !== String(messageId));
    writeJson(MOCK_MESSAGES_KEY, updated);
    systemMessagesCache = updated;
    cacheTimestamp = Date.now();
    return { success: true };
  }
  try {
    const response = await client.delete(`/system-messages/${messageId}`);
    return extractData(response);
  } catch (error) {
    console.error('删除系统消息失败:', error);
    return { success: false };
  }
}

/**
 * 清空所有系统消息
 * @returns {Promise<{success: boolean}>}
 */
export async function clearAllSystemMessages() {
  if (USE_MOCK) {
    writeJson(MOCK_MESSAGES_KEY, []);
    systemMessagesCache = [];
    cacheTimestamp = Date.now();
    return { success: true };
  }
  try {
    const response = await client.delete('/system-messages/all');
    return extractData(response);
  } catch (error) {
    console.error('清空系统消息失败:', error);
    return { success: false };
  }
}

/**
 * 获取通知设置
 * @returns {Promise<{product: boolean, order: boolean, social: boolean}>}
 */
export async function getNotificationSettings() {
  if (USE_MOCK) {
    const result = readJson(MOCK_SETTINGS_KEY, null);
    return {
      product: result?.product !== false,
      order: result?.order !== false,
      social: result?.social !== false,
    };
  }
  try {
    const response = await client.get('/system-messages/settings');
    const result = extractData(response);
    return {
      product: result?.product !== false,
      order: result?.order !== false,
      social: result?.social !== false
    };
  } catch (error) {
    console.error('获取通知设置失败:', error);
    return { product: true, order: true, social: true };
  }
}

/**
 * 更新通知设置
 * @param {Object} settings - 通知设置
 * @param {boolean} settings.product - 商品通知
 * @param {boolean} settings.order - 订单通知
 * @param {boolean} settings.social - 社交通知
 * @returns {Promise<{success: boolean}>}
 */
export async function updateNotificationSettings(settings) {
  if (USE_MOCK) {
    const next = {
      product: settings?.product !== false,
      order: settings?.order !== false,
      social: settings?.social !== false,
    };
    writeJson(MOCK_SETTINGS_KEY, next);
    return { success: true };
  }
  try {
    const response = await client.put('/system-messages/settings', settings);
    return extractData(response);
  } catch (error) {
    console.error('更新通知设置失败:', error);
    return { success: false };
  }
}
