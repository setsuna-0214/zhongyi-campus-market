import { initialConversations, initialMessages, ensureMockState } from './mockData';

export async function listConversations() {
  ensureMockState();
  try {
    const raw = localStorage.getItem('mock_conversations');
    if (raw) return JSON.parse(raw);
  } catch {}
  return initialConversations;
}

export async function listMessages(conversationId) {
  ensureMockState();
  try {
    const raw = localStorage.getItem('mock_messages');
    const all = raw ? JSON.parse(raw) : initialMessages;
    return Array.isArray(all[conversationId]) ? all[conversationId] : [];
  } catch {}
  return [];
}

export async function sendMessage(conversationId, payload) {
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
    const convRaw = localStorage.getItem('mock_conversations');
    const convs = convRaw ? JSON.parse(convRaw) : initialConversations;
    const updated = convs.map(c => c.id === conversationId ? { ...c, lastMessage: message.content, lastMessageTime: message.timestamp } : c);
    localStorage.setItem('mock_conversations', JSON.stringify(updated));
  } catch {}
  return message;
}

