import client from './client';

/**
 * 系统消息 API
 * 用于获取和管理系统通知消息
 */

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
    // 返回模拟数据用于开发
    const mockData = getMockSystemMessages();
    systemMessagesCache = mockData;
    cacheTimestamp = now;
    return mockData;
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
  try {
    const response = await client.delete('/system-messages/all');
    return extractData(response);
  } catch (error) {
    console.error('清空系统消息失败:', error);
    return { success: false };
  }
}

/**
 * 模拟系统消息数据（开发用）
 * 根据实际订单流程设计：
 * - 订单状态：pending_seller → pending_buyer → completed (或 cancelled)
 * - 买家操作：创建订单、取消订单、确认收货、提交评价
 * - 卖家操作：处理订单（上传图片、添加留言）
 * 
 * 路由说明：
 * - /products/:id - 商品详情页
 * - /orders/:id - 订单处理页（可查看/处理订单）
 * - /profile?t=orders - 用户中心订单列表
 * - /profile?t=products - 用户中心商品管理
 */
function getMockSystemMessages() {
  const now = new Date();
  return [
    // 商品相关
    {
      id: 1,
      type: SYSTEM_MESSAGE_TYPES.PRODUCT_PUBLISHED,
      title: '商品发布成功',
      content: '您的商品「iPhone 15 Pro Max 256G」已成功发布，快去看看吧！',
      timestamp: new Date(now - 1000 * 60 * 30).toLocaleString(), // 30分钟前
      isRead: false,
      link: '/products/123',
      linkText: '查看商品'
    },
    // 卖家收到新订单（链接到订单处理页）
    {
      id: 2,
      type: SYSTEM_MESSAGE_TYPES.NEW_ORDER,
      title: '收到新订单',
      content: '用户「小明」购买了您的商品「MacBook Pro 14寸」，请尽快处理订单。',
      timestamp: new Date(now - 1000 * 60 * 60 * 2).toLocaleString(), // 2小时前
      isRead: false,
      link: '/orders/456',
      linkText: '处理订单'
    },
    // 买家订单创建成功（链接到订单处理页）
    {
      id: 3,
      type: SYSTEM_MESSAGE_TYPES.ORDER_CREATED,
      title: '订单创建成功',
      content: '您已成功下单购买「AirPods Pro 2」，请等待卖家处理。',
      timestamp: new Date(now - 1000 * 60 * 60 * 5).toLocaleString(), // 5小时前
      isRead: false,
      link: '/orders/457',
      linkText: '查看订单'
    },
    // 买家收到卖家处理通知（链接到订单处理页确认收货）
    {
      id: 4,
      type: SYSTEM_MESSAGE_TYPES.ORDER_PROCESSED,
      title: '卖家已处理订单',
      content: '卖家已处理您购买的「iPad Air 5」订单，请查看详情并确认收货。',
      timestamp: new Date(now - 1000 * 60 * 60 * 24).toLocaleString(), // 1天前
      isRead: true,
      link: '/orders/458',
      linkText: '确认收货'
    },
    // 卖家收到买家确认通知（链接到用户中心订单列表）
    {
      id: 5,
      type: SYSTEM_MESSAGE_TYPES.BUYER_CONFIRMED,
      title: '买家已确认收货',
      content: '买家「小红」已确认收到您的商品「Switch游戏机」，交易完成！',
      timestamp: new Date(now - 1000 * 60 * 60 * 24 * 2).toLocaleString(), // 2天前
      isRead: true,
      link: '/profile?t=orders',
      linkText: '查看详情'
    },
    // 订单完成（链接到订单处理页可评价）
    {
      id: 6,
      type: SYSTEM_MESSAGE_TYPES.ORDER_COMPLETED,
      title: '订单已完成',
      content: '您购买的「机械键盘」订单已完成，感谢您的购买！欢迎对商品进行评价。',
      timestamp: new Date(now - 1000 * 60 * 60 * 24 * 3).toLocaleString(), // 3天前
      isRead: true,
      link: '/orders/460',
      linkText: '去评价'
    },
    // 订单取消（链接到用户中心订单列表）
    {
      id: 7,
      type: SYSTEM_MESSAGE_TYPES.ORDER_CANCELLED,
      title: '订单已取消',
      content: '您购买的「显示器」订单已取消，商品已恢复上架。',
      timestamp: new Date(now - 1000 * 60 * 60 * 24 * 4).toLocaleString(), // 4天前
      isRead: true,
      link: '/profile?t=orders',
      linkText: '查看详情'
    },
    // 商品被收藏
    {
      id: 8,
      type: SYSTEM_MESSAGE_TYPES.PRODUCT_FAVORITED,
      title: '商品被收藏',
      content: '您的商品「二手自行车」被用户收藏了，继续加油！',
      timestamp: new Date(now - 1000 * 60 * 60 * 24 * 5).toLocaleString(), // 5天前
      isRead: true,
      link: '/products/789',
      linkText: '查看商品'
    }
  ];
}
