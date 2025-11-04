import client from './client';
import { initialConversations, initialMessages, ensureMockState, isMockEnabled } from './mockData';

// 获取会话列表
export async function listConversations() {
  if (isMockEnabled()) {
    ensureMockState();
    try {
      const raw = localStorage.getItem('mock_conversations');
      if (raw) return JSON.parse(raw);
    } catch {}
    return initialConversations;
  }
  const { data } = await client.get('/chat/conversations');
  return Array.isArray(data) ? data : (data.items || []);
}

// 获取某个会话的消息
export async function listMessages(conversationId) {
  if (isMockEnabled()) {
    ensureMockState();
    try {
      const raw = localStorage.getItem('mock_messages');
      const all = raw ? JSON.parse(raw) : initialMessages;
      return Array.isArray(all[conversationId]) ? all[conversationId] : [];
    } catch {}
    return [];
  }
  const { data } = await client.get(`/chat/conversations/${conversationId}/messages`);
  return Array.isArray(data) ? data : (data.items || []);
}

// 发送消息
export async function sendMessage(conversationId, payload) {
  if (isMockEnabled()) {
    ensureMockState();
    const message = {
      id: `m_${Date.now()}`,
      senderId: 'current',
      senderName: '我',
      content: payload.content,
      type: payload.type || 'text',
      timestamp: new Date().toLocaleString(),
      isOwn: true
    };
    try {
      const raw = localStorage.getItem('mock_messages');
      const all = raw ? JSON.parse(raw) : initialMessages;
      const list = Array.isArray(all[conversationId]) ? all[conversationId] : [];
      all[conversationId] = [...list, message];
      localStorage.setItem('mock_messages', JSON.stringify(all));
      // 更新会话的最后消息
      const convRaw = localStorage.getItem('mock_conversations');
      const convs = convRaw ? JSON.parse(convRaw) : initialConversations;
      const updated = convs.map(c => c.id === conversationId ? { ...c, lastMessage: message.content, lastMessageTime: message.timestamp } : c);
      localStorage.setItem('mock_conversations', JSON.stringify(updated));
    } catch {}
    return message;
  }
  const { data } = await client.post(`/chat/conversations/${conversationId}/messages`, payload);
  return data;
}