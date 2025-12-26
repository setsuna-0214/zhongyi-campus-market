import { initialConversations, initialMessages, ensureMockState, mockProducts } from './mockData';
import { resolveImageSrc } from '../utils/images';

/**
 * 标准化会话数据，确保字段一致
 */
function normalizeConversation(conv) {
  if (!conv) return conv;
  // partnerId 是聊天对方的用户ID
  const partnerId = conv.partnerId || conv.userId;
  const partnerName = conv.partnerName || conv.userName || '用户';
  const partnerAvatar = conv.partnerAvatar || conv.userAvatar || '';
  return {
    ...conv,
    partnerId: String(partnerId),
    userId: String(partnerId),
    userName: partnerName,
    partnerName: partnerName,
    userAvatar: partnerAvatar,
    partnerAvatar: partnerAvatar,
  };
}

/**
 * 从 localStorage 获取会话列表（已去重）
 */
function getConversationsFromStorage() {
  try {
    const raw = localStorage.getItem('mock_conversations');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr;
      }
    }
  } catch {}
  return [...initialConversations];
}

/**
 * 保存会话列表到 localStorage（自动去重）
 */
function saveConversationsToStorage(conversations) {
  // 按 partnerId 去重
  const seen = new Set();
  const deduped = [];
  for (const c of conversations) {
    const normalized = normalizeConversation(c);
    const key = normalized.partnerId;
    if (key && !seen.has(key)) {
      seen.add(key);
      deduped.push(normalized);
    }
  }
  try {
    localStorage.setItem('mock_conversations', JSON.stringify(deduped));
  } catch {}
  return deduped;
}

/**
 * 根据 partnerId 查找会话
 */
function findConversationByPartnerId(conversations, partnerId) {
  const targetId = String(partnerId);
  return conversations.find(c => {
    const pId = String(c.partnerId || c.userId);
    return pId === targetId;
  });
}

export async function listConversations() {
  ensureMockState();
  const conversations = getConversationsFromStorage();
  // 标准化并去重后返回
  return saveConversationsToStorage(conversations);
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
    const all = raw ? JSON.parse(raw) : { ...initialMessages };
    const list = Array.isArray(all[conversationId]) ? all[conversationId] : [];
    all[conversationId] = [...list, message];
    localStorage.setItem('mock_messages', JSON.stringify(all));
    
    // 更新会话的最后消息
    const conversations = getConversationsFromStorage();
    const updated = conversations.map(c => 
      c.id === conversationId 
        ? { ...c, lastMessage: message.content, lastMessageTime: message.timestamp } 
        : c
    );
    saveConversationsToStorage(updated);
  } catch {}
  return message;
}

export async function createConversation({ userId, productId, orderId, partnerName, partnerAvatar }) {
  ensureMockState();
  
  const targetUserId = String(userId);
  const conversations = getConversationsFromStorage();
  
  // 查找是否已存在与该用户的会话
  const existing = findConversationByPartnerId(conversations, targetUserId);
  
  if (existing) {
    // 返回已存在的会话（标准化后）
    const normalized = normalizeConversation(existing);
    // 如果传入了更好的用户信息，更新它
    if (partnerName && normalized.userName === '用户') {
      normalized.userName = partnerName;
      normalized.partnerName = partnerName;
    }
    if (partnerAvatar && !normalized.userAvatar) {
      normalized.userAvatar = partnerAvatar;
      normalized.partnerAvatar = partnerAvatar;
    }
    return normalized;
  }
  
  // 创建新会话
  const prod = mockProducts.find(p => String(p.id) === String(productId));
  const image = resolveImageSrc({ product: prod });
  
  const userName = partnerName || prod?.seller?.nickname || prod?.seller?.username || '卖家';
  const userAvatar = partnerAvatar || prod?.seller?.avatar || '/images/avatars/avatar-1.svg';
  
  const newConv = {
    id: `c_${Date.now()}`,
    partnerId: targetUserId,
    userId: targetUserId,
    userName: userName,
    partnerName: userName,
    userAvatar: userAvatar,
    partnerAvatar: userAvatar,
    lastMessage: '',
    lastMessageTime: new Date().toLocaleString(),
    unreadCount: 0,
    orderId: orderId || null,
    productName: prod?.title || undefined,
    productImage: image
  };
  
  // 保存新会话（会自动去重）
  saveConversationsToStorage([newConv, ...conversations]);
  
  // 初始化消息列表
  try {
    const msgsRaw = localStorage.getItem('mock_messages');
    const allMsgs = msgsRaw ? JSON.parse(msgsRaw) : { ...initialMessages };
    if (!allMsgs[newConv.id]) {
      allMsgs[newConv.id] = [];
      localStorage.setItem('mock_messages', JSON.stringify(allMsgs));
    }
  } catch {}
  
  return newConv;
}

export async function deleteConversation(conversationId) {
  ensureMockState();
  try {
    const conversations = getConversationsFromStorage();
    const filtered = conversations.filter(c => c.id !== conversationId);
    saveConversationsToStorage(filtered);
  } catch {}
  try {
    const msgsRaw = localStorage.getItem('mock_messages');
    const allMsgs = msgsRaw ? JSON.parse(msgsRaw) : { ...initialMessages };
    if (allMsgs[conversationId]) {
      delete allMsgs[conversationId];
      localStorage.setItem('mock_messages', JSON.stringify(allMsgs));
    }
  } catch {}
  return { success: true };
}

export async function uploadChatImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

export async function markConversationAsRead(conversationId) {
  ensureMockState();
  try {
    const conversations = getConversationsFromStorage();
    const updated = conversations.map(c => 
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    );
    saveConversationsToStorage(updated);
  } catch {}
  return { success: true };
}

/**
 * 清除会话列表缓存（mock 模式下无缓存，空实现）
 */
export function clearConversationsCache() {
  // mock 模式直接从 localStorage 读取，无需清除缓存
}
