import client from './client';

export async function listConversations() {
  const { data } = await client.get('/chat/conversations');
  return Array.isArray(data) ? data : (data.items || []);
}

export async function listMessages(conversationId) {
  const { data } = await client.get(`/chat/conversations/${conversationId}/messages`);
  return Array.isArray(data) ? data : (data.items || []);
}

export async function sendMessage(conversationId, payload) {
  const { data } = await client.post(`/chat/conversations/${conversationId}/messages`, payload);
  return data;
}

