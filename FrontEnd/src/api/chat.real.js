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

export async function listConversations() {
  const response = await client.get('/chat/conversations');
  const result = extractData(response);
  const arr = Array.isArray(result) ? result : (result?.items || []);
  // 去重：按 partnerId + orderId 去重
  const seen = new Set();
  const out = [];
  for (const c of arr) {
    const key = `${String(c.partnerId)}|${c.orderId ?? ''}`;
    if (!seen.has(key)) { seen.add(key); out.push(c); }
  }
  return out;
}

export async function listMessages(conversationId) {
  if (!conversationId) {
    console.warn('listMessages: conversationId is undefined');
    return [];
  }
  const response = await client.get(`/chat/conversations/${conversationId}/messages`);
  const result = extractData(response);
  return Array.isArray(result) ? result : (result?.items || []);
}

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

export async function createConversation(payload) {
  const response = await client.post('/chat/conversations', payload);
  return extractData(response);
}

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
