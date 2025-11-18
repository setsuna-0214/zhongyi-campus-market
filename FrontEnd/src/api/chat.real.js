import client from './client';

export async function listConversations() {
  const { data } = await client.get('/chat/conversations');
  const arr = Array.isArray(data) ? data : (data.items || []);
  const seen = new Set();
  const out = [];
  for (const c of arr) {
    const key = `${String(c.userId)}|${c.orderId ?? ''}`;
    if (!seen.has(key)) { seen.add(key); out.push(c); }
  }
  return out;
}

export async function listMessages(conversationId) {
  const { data } = await client.get(`/chat/conversations/${conversationId}/messages`);
  return Array.isArray(data) ? data : (data.items || []);
}

export async function sendMessage(conversationId, payload) {
  const { data } = await client.post(`/chat/conversations/${conversationId}/messages`, payload);
  return data;
}

export async function createConversation(payload) {
  const { data } = await client.post('/chat/conversations', payload);
  return data;
}

export async function deleteConversation(conversationId) {
  const { data } = await client.delete(`/chat/conversations/${conversationId}`);
  return data;
}

