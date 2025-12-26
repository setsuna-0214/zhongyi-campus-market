import client from './client';

/**
 * 从后端 Result 对象中提取数据
 * 后端返回格式: { code: 200, message: "success", data: ... }
 */
function extractData(response) {
  const data = response?.data;
  // 如果是 Result 包装对象，提取 data 字段
  if (data && typeof data === 'object' && 'code' in data && 'data' in data) {
    return data.data;
  }
  return data;
}

/**
 * 标准化会话数据，确保字段一致
 * partnerId 统一转为字符串，与 mock 版本保持一致
 */
function normalizeConversation(conv) {
  if (!conv) return conv;
  
  // 尝试从多种可能的字段名获取用户信息
  const rawPartnerId = conv.partnerId || conv.userId || conv.targetUserId || conv.otherUserId;
  const partnerId = rawPartnerId != null ? String(rawPartnerId) : '';
  const partnerName = conv.partnerName || conv.userName || conv.targetUserName || conv.otherUserName || conv.nickname || '用户';
  const partnerAvatar = conv.partnerAvatar || conv.userAvatar || conv.targetUserAvatar || conv.otherUserAvatar || conv.avatar || '';
  
  return {
    ...conv,
    partnerId: partnerId,
    userId: partnerId,
    userName: partnerName,
    partnerName: partnerName,
    userAvatar: partnerAvatar,
    partnerAvatar: partnerAvatar,
  };
}

// 会话列表缓存
const CONV_CACHE_TTL = 15 * 1000; // 15 秒缓存
let conversationsCache = null;
let convCacheTimestamp = 0;

/**
 * 获取会话列表（带缓存）
 * 返回的列表已按 partnerId 去重
 * @param {boolean} forceRefresh - 是否强制刷新
 */
export async function listConversations(forceRefresh = false) {
  const now = Date.now();
  
  // 使用缓存
  if (!forceRefresh && conversationsCache && (now - convCacheTimestamp) < CONV_CACHE_TTL) {
    return conversationsCache;
  }
  
  const response = await client.get('/chat/conversations');
  const result = extractData(response);
  const arr = Array.isArray(result) ? result : (result?.items || []);
  
  // 按 partnerId 去重，同一用户只保留一个会话
  const seen = new Set();
  const out = [];
  for (const c of arr) {
    const normalized = normalizeConversation(c);
    const key = normalized.partnerId;
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(normalized);
    }
  }
  
  // 更新缓存
  conversationsCache = out;
  convCacheTimestamp = now;
  
  return out;
}

/**
 * 清除会话列表缓存
 */
export function clearConversationsCache() {
  conversationsCache = null;
  convCacheTimestamp = 0;
}

/**
 * 获取会话消息列表
 */
export async function listMessages(conversationId) {
  if (!conversationId) {
    console.warn('listMessages: conversationId is undefined');
    return [];
  }
  const response = await client.get(`/chat/conversations/${conversationId}/messages`);
  const result = extractData(response);
  return Array.isArray(result) ? result : (result?.items || []);
}

/**
 * 发送消息
 */
export async function sendMessage(conversationId, payload) {
  if (!conversationId) {
    throw new Error('conversationId is required');
  }
  // 如果 content 是对象（如商品卡片），需要序列化为 JSON 字符串
  const requestPayload = {
    ...payload,
    content: typeof payload.content === 'object' 
      ? JSON.stringify(payload.content) 
      : payload.content
  };
  const response = await client.post(`/chat/conversations/${conversationId}/messages`, requestPayload);
  return extractData(response);
}

/**
 * 创建会话或获取已存在的会话
 * 后端应该实现：如果与该用户的会话已存在，返回已存在的会话而不是创建新的
 */
export async function createConversation(payload) {
  const requestPayload = {
    userId: payload.userId,
    productId: payload.productId,
    orderId: payload.orderId,
  };
  
  const response = await client.post('/chat/conversations', requestPayload);
  const result = extractData(response);
  
  if (!result) {
    throw new Error('创建会话失败');
  }
  
  // 标准化返回数据
  const normalized = normalizeConversation(result);
  
  // 补充前端传入的用户信息（如果后端没有返回完整信息）
  if (payload.partnerName && (!normalized.userName || normalized.userName === '用户')) {
    normalized.userName = payload.partnerName;
    normalized.partnerName = payload.partnerName;
  }
  if (payload.partnerAvatar && !normalized.userAvatar) {
    normalized.userAvatar = payload.partnerAvatar;
    normalized.partnerAvatar = payload.partnerAvatar;
  }
  
  return normalized;
}

/**
 * 删除会话
 */
export async function deleteConversation(conversationId) {
  if (!conversationId) {
    throw new Error('conversationId is required');
  }
  const response = await client.delete(`/chat/conversations/${conversationId}`);
  return extractData(response);
}

/**
 * 上传聊天图片
 * @param {File} file - 图片文件
 * @returns {Promise<string>} - 图片URL
 */
export async function uploadChatImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await client.post('/chat/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  const result = extractData(response);
  return result?.url || result;
}

/**
 * 标记会话为已读
 * @param {string} conversationId - 会话ID
 * @returns {Promise<{success: boolean}>}
 */
export async function markConversationAsRead(conversationId) {
  if (!conversationId) {
    throw new Error('conversationId is required');
  }
  const response = await client.put(`/chat/conversations/${conversationId}/read`);
  return extractData(response);
}
