import client from './client';

// 获取会话列表
export async function listConversations() {
  const { data } = await client.get('/chat/conversations');
  return Array.isArray(data) ? data : (data.items || []);
}

// 获取某个会话的消息
export async function listMessages(conversationId) {
  const { data } = await client.get(`/chat/conversations/${conversationId}/messages`);
  return Array.isArray(data) ? data : (data.items || []);
}

// 发送消息
export async function sendMessage(conversationId, payload) {
  const { data } = await client.post(`/chat/conversations/${conversationId}/messages`, payload);
  return data;
}