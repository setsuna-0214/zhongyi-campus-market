import { initialConversations, initialMessages, ensureMockState, mockProducts } from './mockData';
import { resolveImageSrc } from '../utils/images';

export async function listConversations() {
  ensureMockState();
  try {
    const raw = localStorage.getItem('mock_conversations');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const seen = new Set();
        const out = [];
        for (const c of arr) {
          const key = `${String(c.userId)}|${c.orderId ?? ''}`;
          if (!seen.has(key)) { seen.add(key); out.push(c); }
        }
        try { localStorage.setItem('mock_conversations', JSON.stringify(out)); } catch {}
        return out;
      }
    }
  } catch {}
  const arr = initialConversations;
  const seen = new Set();
  const out = [];
  for (const c of arr) {
    const key = `${String(c.userId)}|${c.orderId ?? ''}`;
    if (!seen.has(key)) { seen.add(key); out.push(c); }
  }
  return out;
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

export async function createConversation({ userId, productId, orderId, partnerName, partnerAvatar }) {
  ensureMockState();
  const prod = mockProducts.find(p => String(p.id) === String(productId));
  const image = resolveImageSrc({ product: prod });
  const conv = {
    id: `c_${Date.now()}`,
    userId: userId,
    userName: partnerName || prod?.seller?.nickname || '卖家',
    userAvatar: partnerAvatar || prod?.seller?.avatar || '/images/avatars/avatar-1.svg',
    lastMessage: '',
    lastMessageTime: new Date().toLocaleString(),
    unreadCount: 0,
    orderId: orderId || null,
    productName: prod?.title || (productId ? String(productId) : undefined),
    productImage: image
  };
  try {
    const raw = localStorage.getItem('mock_conversations');
    const convs = raw ? JSON.parse(raw) : initialConversations;
    localStorage.setItem('mock_conversations', JSON.stringify([conv, ...convs]));
    const msgsRaw = localStorage.getItem('mock_messages');
    const allMsgs = msgsRaw ? JSON.parse(msgsRaw) : initialMessages;
    allMsgs[conv.id] = Array.isArray(allMsgs[conv.id]) ? allMsgs[conv.id] : [];
    localStorage.setItem('mock_messages', JSON.stringify(allMsgs));
  } catch {}
  return conv;
}

export async function deleteConversation(conversationId) {
  ensureMockState();
  try {
    const raw = localStorage.getItem('mock_conversations');
    const convs = raw ? JSON.parse(raw) : initialConversations;
    const next = Array.isArray(convs) ? convs.filter(c => c.id !== conversationId) : [];
    localStorage.setItem('mock_conversations', JSON.stringify(next));
  } catch {}
  try {
    const msgsRaw = localStorage.getItem('mock_messages');
    const allMsgs = msgsRaw ? JSON.parse(msgsRaw) : initialMessages;
    if (allMsgs && allMsgs[conversationId]) {
      delete allMsgs[conversationId];
      localStorage.setItem('mock_messages', JSON.stringify(allMsgs));
    }
  } catch {}
  return { success: true };
}

/**
 * Mock 图片上传 - 将图片转为 Base64 URL 返回
 * @param {File} file - 图片文件
 * @returns {Promise<string>} - 图片 URL (Base64)
 */
export async function uploadChatImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 标记会话为已读
 * @param {string} conversationId - 会话ID
 * @returns {Promise<{success: boolean}>}
 */
export async function markConversationAsRead(conversationId) {
  ensureMockState();
  try {
    const raw = localStorage.getItem('mock_conversations');
    const convs = raw ? JSON.parse(raw) : initialConversations;
    const updated = convs.map(c => 
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    );
    localStorage.setItem('mock_conversations', JSON.stringify(updated));
  } catch {}
  return { success: true };
}

