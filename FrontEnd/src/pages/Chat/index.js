/**
 * 聊天页面
 * 提供即时通讯功能，包括会话列表、消息收发、图片上传、商品卡片发送等
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Input,
  Button,
  Avatar,
  Typography,
  Space,
  Badge,
  Divider,
  Upload,
  Modal,
  message,
  Empty,
  Dropdown,
  Popover,
  Switch
} from 'antd';
import {
  SendOutlined,
  PictureOutlined,
  SmileOutlined,
  MoreOutlined,
  ArrowLeftOutlined,
  NotificationOutlined,
  RightOutlined,
  DeleteOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import './index.css';
import { listConversations, listMessages, sendMessage, createConversation, deleteConversation, uploadChatImage, markConversationAsRead, clearConversationsCache } from '../../api/chat';
import { listSystemMessages, markSystemMessageAsRead, SYSTEM_MESSAGE_ICONS, clearSystemMessagesCache, getNotificationSettings, updateNotificationSettings } from '../../api/systemMessage';
import { getCurrentUser as getProfileUser } from '../../api/user';
import { getProduct } from '../../api/products';
import { resolveImageSrc, resolveAvatar, sanitizeImageUrl } from '../../utils/images';
import { getCurrentUser as getLocalUser, updateAuthUser } from '../../utils/auth';
import ProductCard from '../../components/ProductCard';
import * as websocket from '../../api/websocket';

const { TextArea } = Input;
const { Text, Title } = Typography;

// 系统消息会话的特殊 ID
const SYSTEM_CONVERSATION_ID = 'system';

// 时间间隔阈值（5分钟）
const TIME_GAP_THRESHOLD = 5 * 60 * 1000;

// 用于判断“纯 emoji”消息的正则（预编译，避免每次渲染重复创建）
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{FE0F}]|\s/gu;

// 解析时间戳字符串为 Date 对象
const parseTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  // 尝试解析常见格式
  const date = new Date(timestamp);
  if (!isNaN(date.getTime())) return date;
  // 尝试解析 "YYYY/MM/DD HH:mm:ss" 格式
  const parts = timestamp.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{1,2}):?(\d{1,2})?/);
  if (parts) {
    return new Date(parts[1], parts[2] - 1, parts[3], parts[4], parts[5], parts[6] || 0);
  }
  return null;
};

// 格式化时间显示
const formatMessageTime = (timestamp) => {
  const date = parseTimestamp(timestamp);
  if (!date) return '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  if (isToday) {
    return `${hours}:${minutes}`;
  } else if (isThisYear) {
    return `${month}月${day}日 ${hours}:${minutes}`;
  } else {
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  }
};

// 判断是否为纯 emoji 消息
const isEmojiOnly = (text) => {
  if (!text) return false;
  // 移除所有 emoji 后检查是否还有其他字符
  const withoutEmoji = text.replace(EMOJI_REGEX, '');
  return withoutEmoji.trim().length === 0 && text.trim().length > 0;
};

// 判断是否需要显示时间戳
const shouldShowTimestamp = (currentMsg, prevMsg) => {
  if (!prevMsg) return true; // 第一条消息始终显示

  const currentTime = parseTimestamp(currentMsg.timestamp);
  const prevTime = parseTimestamp(prevMsg.timestamp);

  if (!currentTime || !prevTime) return true;

  return currentTime.getTime() - prevTime.getTime() > TIME_GAP_THRESHOLD;
};

// 标准化会话数据
const normalizeConversation = (conv) => {
  if (!conv) return conv;
  const partnerId = String(conv.partnerId || conv.userId || conv.targetUserId || '');
  const partnerName = conv.partnerName || conv.userName || conv.targetUserName || conv.nickname || '用户';
  const partnerAvatar = conv.partnerAvatar || conv.userAvatar || conv.targetUserAvatar || conv.avatar || '';
  return {
    ...conv,
    partnerId,
    userId: partnerId,
    userName: partnerName,
    partnerName: partnerName,
    userAvatar: partnerAvatar,
    partnerAvatar: partnerAvatar,
  };
};

// 按 partnerId 去重会话列表
const deduplicateConversations = (conversations) => {
  if (!Array.isArray(conversations)) return [];
  const seen = new Set();
  const result = [];
  for (const conv of conversations) {
    const normalized = normalizeConversation(conv);
    const key = normalized.partnerId;
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  }
  return result;
};

const Chat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const forceScrollRef = useRef(true);
  const currentConversationRef = useRef(null);
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversationState] = useState(null);

  // 包装函数：同时更新 state 和 ref
  const setCurrentConversation = useCallback((conv) => {
    currentConversationRef.current = conv;
    setCurrentConversationState(conv);
  }, []);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageDrag, setImageDrag] = useState({ isDragging: false, startX: 0, startY: 0, translateX: 0, translateY: 0 });
  const [sharedProduct, setSharedProduct] = useState(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState('smileys');
  const [systemMessages, setSystemMessages] = useState([]);
  const [systemUnreadCount, setSystemUnreadCount] = useState(0);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    product: true,      // 商品相关通知
    order: true,        // 订单相关通知
    social: true,       // 社交相关通知
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // 获取当前用户信息
  const [currentUser, setCurrentUser] = useState(() => getLocalUser());
  const currentUserId = currentUser?.id;
  const currentUserAvatar = currentUser?.avatar;
  const currentUserNickname = currentUser?.nickname;
  const currentUserUsername = currentUser?.username;

  // 监听用户信息更新事件
  useEffect(() => {
    const handleUserUpdated = (event) => {
      if (event.detail) {
        setCurrentUser(event.detail);
      }
    };
    window.addEventListener('userUpdated', handleUserUpdated);
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdated);
    };
  }, []);

  // 补齐本地用户信息（头像/昵称等），避免仅登录态信息导致聊天头像一直为默认值
  useEffect(() => {
    if (!currentUserId) return;
    if (currentUserAvatar && (currentUserNickname || currentUserUsername)) return;

    let cancelled = false;
    (async () => {
      try {
        const profile = await getProfileUser();
        if (cancelled || !profile) return;
        updateAuthUser(profile);
      } catch {
        // 忽略：用户信息加载失败不应阻塞聊天功能
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, currentUserAvatar, currentUserNickname, currentUserUsername]);

  // 判断当前是否为系统消息会话
  const isSystemConversation = currentConversation?.id === SYSTEM_CONVERSATION_ID;

  const emojiCategoryMeta = {
    smileys: { icon: '😀', name: '表情' },
    gestures: { icon: '👋', name: '手势' },
    animals: { icon: '🐱', name: '动物' },
    food: { icon: '🍔', name: '食物' },
    activities: { icon: '⚽', name: '活动' },
    travel: { icon: '🚗', name: '旅行' },
    symbols: { icon: '❤️', name: '符号' },
    objects: { icon: '💡', name: '物品' },
  };

  const [emojiCategories, setEmojiCategories] = useState(null);

  // emoji 数据按需加载，避免影响聊天页首屏解析/包体
  useEffect(() => {
    if (!emojiPickerOpen || emojiCategories) return;

    let cancelled = false;
    import('./emojiCategories')
      .then((mod) => {
        if (!cancelled) {
          setEmojiCategories(mod.default || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          message.error('表情加载失败');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [emojiPickerOpen, emojiCategories]);

  // 插入 emoji
  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
  };

  // WebSocket 消息处理
  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === 'new_message') {
      const newMsg = data.message;
      newMsg.isOwn = false;

      // 使用 ref 检查是否正在查看该会话（避免闭包问题）
      const current = currentConversationRef.current;
      const isViewingConversation = current &&
        (current.id === data.conversationId || current.id === newMsg.conversationId);

      if (isViewingConversation) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }

      setConversations(prev => prev.map(conv => {
        if (conv.id === data.conversationId || conv.partnerId === String(newMsg.senderId)) {
          return {
            ...conv,
            lastMessage: newMsg.type === 'image' ? '[图片]' : newMsg.content,
            lastMessageTime: newMsg.timestamp || new Date().toLocaleString(),
            // 只有在没有查看该会话时才增加未读数
            unreadCount: isViewingConversation ? 0 : (conv.unreadCount || 0) + 1
          };
        }
        return conv;
      }));
    }
  }, []);

  // 连接 WebSocket
  useEffect(() => {
    websocket.connect();
    websocket.addListener('chat-page', handleWebSocketMessage);
    return () => { websocket.removeListener('chat-page'); };
  }, [handleWebSocketMessage]);

  // 初始化数据 - 只在组件挂载或关键参数变化时执行
  const initializedRef = useRef(false);
  const lastParamsRef = useRef('');

  useEffect(() => {
    // 计算关键参数的签名（不包括 c 参数，因为 c 只是用于恢复选择）
    const sellerId = searchParams.get('sid') || searchParams.get('sellerId');
    const productId = searchParams.get('pid') || searchParams.get('productId');
    const orderId = searchParams.get('oid') || searchParams.get('orderId');
    const paramsSignature = `${sellerId || ''}-${productId || ''}-${orderId || ''}`;

    // 如果只是 c 参数变化（用户选择会话），不重新初始化
    if (initializedRef.current && paramsSignature === lastParamsRef.current) {
      return;
    }
    lastParamsRef.current = paramsSignature;

    const initChat = async () => {
      setLoading(true);
      try {
        // 支持新旧参数名
        const sellerName = searchParams.get('sname') || searchParams.get('sellerName') || searchParams.get('partnerName');
        const sellerAvatar = searchParams.get('savatar') || searchParams.get('sellerAvatar') || searchParams.get('partnerAvatar');
        // 恢复之前选中的会话
        const savedConversationId = searchParams.get('c');

        // 构建并行加载任务
        const loadTasks = [
          // 加载系统消息（带缓存）
          listSystemMessages().catch(() => []),
          // 获取会话列表
          listConversations().catch(() => []),
          // 如果有 sellerId，同时创建/获取会话
          sellerId ? createConversation({
            userId: parseInt(sellerId, 10),
            productId: productId ? parseInt(productId, 10) : null,
            orderId: orderId ? parseInt(orderId, 10) : null,
            partnerName: sellerName || '卖家',
            partnerAvatar: sellerAvatar || ''
          }).catch(() => null) : Promise.resolve(null),
          // 仅在需要时加载商品信息
          productId ? getProduct(productId).catch(() => null) : Promise.resolve(null)
        ];

        // 并行执行所有加载任务
        const [systemResult, convListResult, createdConv, productResult] = await Promise.all(loadTasks);

        // 设置商品信息
        if (productResult) {
          setSharedProduct(productResult);
        }

        // 设置系统消息
        const sysMsgs = Array.isArray(systemResult) ? systemResult : [];
        setSystemMessages(sysMsgs);
        setSystemUnreadCount(sysMsgs.filter(m => !m.isRead).length);

        // 处理会话列表
        const normalizedList = deduplicateConversations(convListResult);

        let targetConversation = null;

        // 如果创建/获取了会话
        if (createdConv && createdConv.id) {
          targetConversation = normalizeConversation(createdConv);
          // 更新列表中的信息
          const idx = normalizedList.findIndex(c => c.partnerId === targetConversation.partnerId);
          if (idx >= 0) {
            normalizedList[idx] = {
              ...normalizedList[idx],
              userName: sellerName || normalizedList[idx].userName,
              partnerName: sellerName || normalizedList[idx].partnerName,
              userAvatar: sellerAvatar || normalizedList[idx].userAvatar,
              partnerAvatar: sellerAvatar || normalizedList[idx].partnerAvatar,
            };
            targetConversation = normalizedList[idx];
          } else {
            // 新会话添加到列表开头
            normalizedList.unshift(targetConversation);
          }
        }

        // 确定要加载消息的会话
        let conversationToLoad = targetConversation;
        let isSystemConv = false;

        if (!conversationToLoad && savedConversationId) {
          if (savedConversationId === 'system') {
            isSystemConv = true;
          } else {
            conversationToLoad = normalizedList.find(c => c.partnerId === savedConversationId);
          }
        }

        // 如果没有指定会话，自动选中排序后的第一个会话
        if (!conversationToLoad && !isSystemConv && !sellerId) {
          // 构建系统消息会话对象用于排序比较
          const systemConvForSort = {
            id: SYSTEM_CONVERSATION_ID,
            isSystem: true,
            unreadCount: sysMsgs.filter(m => !m.isRead).length,
            lastMessageTime: sysMsgs[0]?.timestamp || ''
          };

          // 合并并排序所有会话
          const allConversations = [systemConvForSort, ...normalizedList];
          const sortedConversations = allConversations.sort((a, b) => {
            const aUnread = (a.unreadCount || 0) > 0;
            const bUnread = (b.unreadCount || 0) > 0;
            if (aUnread && !bUnread) return -1;
            if (!aUnread && bUnread) return 1;
            const aTime = parseTimestamp(a.lastMessageTime);
            const bTime = parseTimestamp(b.lastMessageTime);
            if (aTime && bTime) return bTime.getTime() - aTime.getTime();
            if (aTime) return -1;
            if (bTime) return 1;
            return 0;
          });

          // 选中排序后的第一个会话
          const firstConv = sortedConversations[0];
          if (firstConv) {
            if (firstConv.isSystem) {
              isSystemConv = true;
            } else {
              conversationToLoad = firstConv;
            }
          }
        }

        // 开始加载消息（不等待完成）
        let messagesPromise = null;
        if (conversationToLoad) {
          messagesPromise = listMessages(conversationToLoad.id).catch(() => []);
        }

        // 立即设置会话列表和当前会话，结束加载状态
        setConversations(normalizedList);

        if (isSystemConv) {
          const systemConv = {
            id: SYSTEM_CONVERSATION_ID,
            userName: '系统通知',
            partnerName: '系统通知',
            userAvatar: '',
            partnerAvatar: '',
            lastMessage: sysMsgs[0]?.content || '',
            lastMessageTime: sysMsgs[0]?.timestamp || '',
            unreadCount: sysMsgs.filter(m => !m.isRead).length
          };
          setCurrentConversation(systemConv);
        } else if (conversationToLoad) {
          setCurrentConversation(conversationToLoad);
        }

        setLoading(false);
        initializedRef.current = true;

        // 等待消息加载完成
        if (messagesPromise) {
          const msgs = await messagesPromise;
          setMessages(Array.isArray(msgs) ? msgs : []);
        }
      } catch (err) {
        message.error(err?.message || '获取聊天数据失败');
        setLoading(false);
      }
    };
    initChat();
  }, [searchParams, setCurrentConversation]);

  // 消息列表滚动：仅当用户在底部附近/强制时自动滚动（避免阅读历史消息时被拉回底部）
  const handleMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceToBottom < 120;
  }, []);

  useEffect(() => {
    if (!currentConversation || isSystemConversation) return;
    if (!messagesEndRef.current) return;
    if (!shouldAutoScrollRef.current && !forceScrollRef.current) return;

    const behavior = forceScrollRef.current ? 'auto' : 'smooth';
    forceScrollRef.current = false;
    messagesEndRef.current.scrollIntoView({ behavior });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentConversation?.id, isSystemConversation]);

  // 选择对话
  const handleSelectConversation = async (conversation) => {
    forceScrollRef.current = true;
    shouldAutoScrollRef.current = true;
    setCurrentConversation(conversation);

    // 更新 URL 参数以保存当前选中的会话
    const newParams = new URLSearchParams();
    if (conversation.id === SYSTEM_CONVERSATION_ID) {
      newParams.set('c', 'system');
    } else if (conversation.partnerId) {
      newParams.set('c', conversation.partnerId);
    }
    setSearchParams(newParams, { replace: true });

    // 如果是系统消息会话
    if (conversation.id === SYSTEM_CONVERSATION_ID) {
      // 系统消息不使用 messages 状态
      // 标记所有系统消息为已读
      try {
        await markSystemMessageAsRead('all');
        setSystemMessages(prev => prev.map(m => ({ ...m, isRead: true })));
        setSystemUnreadCount(0);
        // 清除缓存并通知悬浮按钮刷新
        clearSystemMessagesCache();
        window.dispatchEvent(new CustomEvent('unreadCountChanged'));
      } catch (err) {
        message.warning(err?.message || '标记系统消息已读失败');
      }
      return;
    }

    try {
      const msgs = await listMessages(conversation.id);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      message.error(err?.message || '获取消息失败');
    }
    // 只有当会话有未读消息时才更新
    const hasUnread = (conversation.unreadCount || 0) > 0;
    setConversations(prev => prev.map(conv =>
      conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
    ));
    try {
      await markConversationAsRead(conversation.id);
      // 清除缓存并通知悬浮按钮刷新
      if (hasUnread) {
        clearConversationsCache();
        window.dispatchEvent(new CustomEvent('unreadCountChanged'));
      }
    } catch (err) {
      message.warning(err?.message || '标记会话已读失败');
    }
  };

  // 选择系统消息会话
  const handleSelectSystemConversation = () => {
    const systemConv = {
      id: SYSTEM_CONVERSATION_ID,
      userName: '系统消息',
      partnerName: '系统消息',
      userAvatar: null,
      isSystem: true
    };
    handleSelectConversation(systemConv);
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation) return;
    forceScrollRef.current = true;
    shouldAutoScrollRef.current = true;
    const outgoing = {
      id: Date.now(),
      senderId: 'current',
      senderName: '我',
      content: newMessage.trim(),
      type: 'text',
      timestamp: new Date().toLocaleString(),
      isOwn: true
    };
    setMessages(prev => [...prev, outgoing]);
    setNewMessage('');
    setConversations(prev => prev.map(conv =>
      conv.id === currentConversation.id
        ? { ...conv, lastMessage: outgoing.content, lastMessageTime: outgoing.timestamp }
        : conv
    ));
    try {
      await sendMessage(currentConversation.id, { type: 'text', content: outgoing.content });
    } catch (err) {
      message.error(err?.message || '发送消息失败');
    }
  };

  // 发送商品卡片
  const handleSendProductCard = async () => {
    if (!currentConversation || !sharedProduct) return;
    forceScrollRef.current = true;
    shouldAutoScrollRef.current = true;
    const p = sharedProduct;
    const content = {
      id: p.id, title: p.title, price: p.price, category: p.category,
      status: p.status, location: p.location,
      sellerName: typeof p.seller === 'string' ? p.seller : (p.seller?.nickname || p.seller?.username || '卖家'),
      publishedAt: p.publishTime || p.publishedAt || p.createdAt,
      views: p.views, imageSrc: resolveImageSrc({ product: p }),
      overlayType: 'views-left', dateFormat: 'ymd'
    };
    const msg = {
      id: Date.now(), senderId: 'current', senderName: '我',
      content, type: 'product', timestamp: new Date().toLocaleString(), isOwn: true
    };
    setMessages(prev => [...prev, msg]);
    setConversations(prev => prev.map(conv => (
      conv.id === currentConversation.id
        ? { ...conv, lastMessage: `分享了商品卡片：${p.title || ''}`.trim(), lastMessageTime: msg.timestamp }
        : conv
    )));
    try {
      await sendMessage(currentConversation.id, { type: 'product', content });
    } catch (err) {
      message.error(err?.message || '发送商品卡片失败');
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  // 上传图片
  const handleImageUpload = async (file) => {
    if (!currentConversation) { message.error('请先选择一个对话'); return false; }
    forceScrollRef.current = true;
    shouldAutoScrollRef.current = true;
    const tempId = Date.now();
    const tempMsg = { id: tempId, senderId: 'current', senderName: '我', content: '', type: 'image', timestamp: new Date().toLocaleString(), isOwn: true, uploading: true };
    setMessages(prev => [...prev, tempMsg]);
    try {
      const imageUrl = await uploadChatImage(file);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: imageUrl, uploading: false } : m));
      await sendMessage(currentConversation.id, { type: 'image', content: imageUrl });
      setConversations(prev => prev.map(conv => conv.id === currentConversation.id ? { ...conv, lastMessage: '[图片]', lastMessageTime: new Date().toLocaleString() } : conv));
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      message.error(err?.message || '发送图片失败');
    }
    return false;
  };

  const handleImagePreview = (src) => {
    const safeSrc = sanitizeImageUrl(src);
    if (!safeSrc) {
      message.error('图片地址无效');
      return;
    }
    setImagePreview(safeSrc);
    setImageZoom(1);
    setImageDrag({ isDragging: false, startX: 0, startY: 0, translateX: 0, translateY: 0 });
  };

  const handleImageZoom = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setImageZoom(prev => {
      const newZoom = Math.min(Math.max(prev + delta, 0.5), 3);
      // 缩小到 1 倍以下时重置位置
      if (newZoom <= 1) {
        setImageDrag(d => ({ ...d, translateX: 0, translateY: 0 }));
      }
      return newZoom;
    });
  };

  const closeImagePreview = () => {
    setImagePreview(null);
    setImageZoom(1);
    setImageDrag({ isDragging: false, startX: 0, startY: 0, translateX: 0, translateY: 0 });
  };

  // 图片拖动开始
  const handleImageDragStart = (e) => {
    if (imageZoom <= 1) return; // 未放大时不允许拖动
    e.preventDefault();
    setImageDrag(prev => ({
      ...prev,
      isDragging: true,
      startX: e.clientX - prev.translateX,
      startY: e.clientY - prev.translateY
    }));
  };

  // 图片拖动中
  const handleImageDragMove = (e) => {
    if (!imageDrag.isDragging || imageZoom <= 1) return;
    e.preventDefault();
    setImageDrag(prev => ({
      ...prev,
      translateX: e.clientX - prev.startX,
      translateY: e.clientY - prev.startY
    }));
  };

  // 图片拖动结束
  const handleImageDragEnd = () => {
    setImageDrag(prev => ({ ...prev, isDragging: false }));
  };

  // 渲染系统消息
  const renderSystemMessage = (msg) => {
    const icon = SYSTEM_MESSAGE_ICONS[msg.type] || '📢';
    return (
      <div key={msg.id} className={`system-message-item ${msg.isRead ? 'read' : 'unread'}`}>
        <div className="system-message-icon">{icon}</div>
        <div className="system-message-content">
          <div className="system-message-header">
            <Text strong className="system-message-title">{msg.title}</Text>
            <Text type="secondary" className="system-message-time">{formatMessageTime(msg.timestamp)}</Text>
          </div>
          <Text className="system-message-text">{msg.content}</Text>
          {msg.link && (
            <Link to={msg.link} className="system-message-link">
              {msg.linkText || '查看详情'} <RightOutlined />
            </Link>
          )}
        </div>
      </div>
    );
  };

  // 渲染消息
  const renderMessage = (msg, index, allMessages) => {
    const isOwn = msg.isOwn;
    const prevMsg = index > 0 ? allMessages[index - 1] : null;
    const showTimestamp = shouldShowTimestamp(msg, prevMsg);

    // 判断是否需要显示头像（每条消息都显示头像）
    const showAvatar = true;

    if (msg.type === 'product') {
      const item = msg.content || {};
      return (
        <div key={msg.id}>
          {showTimestamp && (
            <div className="message-timestamp">
              <span>{formatMessageTime(msg.timestamp)}</span>
            </div>
          )}
          <div className={`message ${isOwn ? 'own' : 'other'}`}>
            <div className="message-avatar">
              {showAvatar ? (
                <Avatar src={resolveAvatar(isOwn ? currentUser?.avatar : currentConversation?.userAvatar)} size={36} />
              ) : (
                <div className="avatar-placeholder" />
              )}
            </div>
            <div className="message-content">
              <ProductCard imageSrc={item.imageSrc} title={item.title} price={item.price} category={item.category} status={item.status} location={item.location} sellerName={item.sellerName} publishedAt={item.publishedAt} views={item.views} overlayType={item.overlayType || 'views-left'} dateFormat={item.dateFormat || 'ymd'} onClick={() => item.id && navigate(`/products/${item.id}`)} imageHeight={160} />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div key={msg.id}>
        {showTimestamp && (
          <div className="message-timestamp">
            <span>{formatMessageTime(msg.timestamp)}</span>
          </div>
        )}
        <div className={`message ${isOwn ? 'own' : 'other'}`}>
          <div className="message-avatar">
            {showAvatar ? (
              <Avatar src={resolveAvatar(isOwn ? currentUser?.avatar : currentConversation?.userAvatar)} size={36} />
            ) : (
              <div className="avatar-placeholder" />
            )}
          </div>
          <div className="message-content">
            {msg.type === 'text' ? (
              <div className={`message-bubble ${isOwn ? 'own' : 'other'} ${isEmojiOnly(msg.content) ? 'emoji-only' : ''}`}><Text>{msg.content}</Text></div>
            ) : (
              <div className={`message-image-wrapper ${isOwn ? 'own' : 'other'} ${msg.uploading ? 'uploading' : ''}`}>
                {msg.uploading ? (<div className="image-uploading-placeholder"><div className="upload-spinner"></div><Text type="secondary">发送中...</Text></div>) : (
                  (() => {
                    const safeSrc = sanitizeImageUrl(msg.content);
                    if (!safeSrc) {
                      return (
                        <div className="image-uploading-placeholder">
                          <Text type="secondary">图片不可用</Text>
                        </div>
                      );
                    }
                    return (
                      <img
                        src={safeSrc}
                        alt="聊天图片"
                        className="chat-image-thumbnail"
                        onClick={() => handleImagePreview(safeSrc)}
                      />
                    );
                  })()
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container">
      <div className="chat-container-inner">
        <div className="conversation-list">
          <div className="conversation-header">
            <Title level={4}>消息通知</Title>
            {loading && <div className="header-loading-spinner"></div>}
          </div>
          <div className="conversation-items">
            {/* 会话列表 - 包含系统消息，按未读消息和时间统一排序 */}
            {(() => {
              // 构建系统消息会话对象
              const systemConvItem = {
                id: SYSTEM_CONVERSATION_ID,
                isSystem: true,
                unreadCount: systemUnreadCount,
                lastMessageTime: systemMessages[0]?.timestamp || '',
                userName: '系统消息',
                lastMessage: systemMessages[0]?.title || '暂无系统消息'
              };

              // 合并并排序所有会话
              const allConversations = [systemConvItem, ...conversations];

              return allConversations.sort((a, b) => {
                // 有未读消息的排在前面
                const aUnread = (a.unreadCount || 0) > 0;
                const bUnread = (b.unreadCount || 0) > 0;
                if (aUnread && !bUnread) return -1;
                if (!aUnread && bUnread) return 1;
                // 同为有未读或无未读时，按最后消息时间排序（最新的在前）
                const aTime = parseTimestamp(a.lastMessageTime);
                const bTime = parseTimestamp(b.lastMessageTime);
                if (aTime && bTime) return bTime.getTime() - aTime.getTime();
                if (aTime) return -1;
                if (bTime) return 1;
                return 0;
              }).map(conv => {
                // 系统消息会话
                if (conv.isSystem) {
                  return (
                    <div
                      key={SYSTEM_CONVERSATION_ID}
                      className={`conversation-item system-conversation ${currentConversation?.id === SYSTEM_CONVERSATION_ID ? 'active' : ''}`}
                      onClick={handleSelectSystemConversation}
                    >
                      <Badge count={systemUnreadCount} size="small">
                        <div className="system-avatar">
                          <NotificationOutlined />
                        </div>
                      </Badge>
                      <div className="conversation-info">
                        <div className="conversation-top">
                          <Text strong className="user-name system-name">系统消息</Text>
                          <Text type="secondary" className="last-time">
                            {systemMessages[0]?.timestamp ? formatMessageTime(systemMessages[0].timestamp).split(' ')[0] : ''}
                          </Text>
                        </div>
                        <div className="conversation-bottom">
                          <Text type="secondary" className="last-message" ellipsis>
                            {systemMessages[0]?.title || '暂无系统消息'}
                          </Text>
                        </div>
                      </div>
                    </div>
                  );
                }

                // 普通会话
                return (
                  <div key={conv.id} className={`conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}`} onClick={() => handleSelectConversation(conv)}>
                    <Badge count={conv.unreadCount} size="small"><Avatar src={resolveAvatar(conv.userAvatar)} size={48} /></Badge>
                    <div className="conversation-info">
                      <div className="conversation-top">
                        <Text strong className="user-name">{conv.userName}</Text>
                        <Text type="secondary" className="last-time">{((conv.lastMessageTime || '').split(' ')[1]) || conv.lastMessageTime || ''}</Text>
                      </div>
                      <div className="conversation-bottom">
                        <Text type="secondary" className="last-message" ellipsis>
                          {(() => { const lm = conv.lastMessage; if (!lm) return ''; if (typeof lm === 'string') return lm; if (typeof lm === 'object') { if (lm.type === 'text' && lm.content) return String(lm.content); if (lm.type === 'image') return '[图片]'; if (lm.type === 'product') return `分享了商品卡片：${lm.title || ''}`.trim(); if (lm.title) return `分享了商品卡片：${lm.title}`; return '[新消息]'; } try { return String(lm); } catch { return '[新消息]'; } })()}
                        </Text>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div className="chat-area">
          {currentConversation ? (
            <>
              <div className="chat-header">
                <div className="chat-user-info">
                  <Button type="text" icon={<ArrowLeftOutlined />} className="back-button" onClick={() => { setCurrentConversation(null); setSearchParams({}, { replace: true }); }} />
                  {isSystemConversation ? (
                    <div className="system-avatar header-avatar"><NotificationOutlined /></div>
                  ) : (
                    <Avatar src={resolveAvatar(currentConversation.userAvatar)} size={40} />
                  )}
                  <div className="user-details"><Text strong>{currentConversation.userName}</Text></div>
                </div>
                <Space>
                  {isSystemConversation ? (
                    /* 系统消息 - 显示通知设置按钮 */
                    <Button
                      type="text"
                      icon={<SettingOutlined />}
                      onClick={async () => {
                        setNotificationSettingsOpen(true);
                        // 加载当前通知设置
                        try {
                          const settings = await getNotificationSettings();
                          setNotificationSettings(settings);
                        } catch (err) {
                          console.error('加载通知设置失败:', err);
                        }
                      }}
                      className="notification-settings-btn"
                    >
                      通知设置
                    </Button>
                  ) : (
                    /* 普通聊天 - 显示删除按钮 */
                    <Dropdown menu={{ items: [{ key: 'delete', label: '删除该聊天', danger: true }], onClick: async ({ key }) => { if (key === 'delete' && currentConversation) { Modal.confirm({ title: '确定删除该聊天？', content: '删除后将无法恢复聊天记录', icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />, okText: '删除', okButtonProps: { danger: true }, cancelText: '取消', centered: true, className: 'delete-chat-confirm-modal', onOk: async () => { try { await deleteConversation(currentConversation.id); setConversations(prev => prev.filter(c => c.id !== currentConversation.id)); setMessages([]); setCurrentConversation(null); message.success('已删除该聊天'); } catch (err) { message.error(err?.message || '删除失败'); } } }); } } }}>
                      <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>
                  )}
                </Space>
              </div>
              <Divider style={{ margin: 0 }} />

              {/* 系统消息展示区域 */}
              {isSystemConversation ? (
                <div className="system-messages-container">
                  {systemMessages.length > 0 ? (
                    systemMessages.map(msg => renderSystemMessage(msg))
                  ) : (
                    <Empty description="暂无系统消息" />
                  )}
                </div>
              ) : (
                <>
                  <div className="messages-container" ref={messagesContainerRef} onScroll={handleMessagesScroll}>
                    {messages.length > 0 ? messages.map((msg, index, arr) => renderMessage(msg, index, arr)) : <Empty description="开始聊天吧" />}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="input-area">
                    <div className="input-toolbar">
                      <Space>
                        <Upload beforeUpload={handleImageUpload} showUploadList={false} accept="image/*"><Button type="text" icon={<PictureOutlined />} /></Upload>
                        <Popover
                          content={
                            <div className="emoji-picker-container">
                              <div className="emoji-grid">
                                {emojiCategories ? (
                                  (emojiCategories[emojiCategory]?.emojis || []).map((emoji, index) => (
                                    <span
                                      key={index}
                                      className="emoji-item"
                                      onClick={() => handleEmojiSelect(emoji)}
                                    >
                                      {emoji}
                                    </span>
                                  ))
                                ) : (
                                  <div style={{ padding: 8 }}>
                                    <Text type="secondary">加载中...</Text>
                                  </div>
                                )}
                              </div>
                              <div className="emoji-category-tabs">
                                {Object.entries(emojiCategoryMeta).map(([key, category]) => (
                                  <span
                                    key={key}
                                    className={`emoji-category-tab ${emojiCategory === key ? 'active' : ''}`}
                                    onClick={() => setEmojiCategory(key)}
                                    title={category.name}
                                  >
                                    {category.icon}
                                  </span>
                                ))}
                              </div>
                            </div>
                          }
                          trigger="click"
                          open={emojiPickerOpen}
                          onOpenChange={setEmojiPickerOpen}
                          placement="topLeft"
                        >
                          <Button type="text" icon={<SmileOutlined />} />
                        </Popover>
                        {currentConversation && sharedProduct && <Button type="default" onClick={handleSendProductCard}>发送商品卡片</Button>}
                      </Space>
                    </div>
                    <div className="input-box">
                      <TextArea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="输入消息..." autoSize={{ minRows: 1, maxRows: 4 }} bordered={false} />
                      <Button type="primary" icon={<SendOutlined />} onClick={handleSendMessage} disabled={!newMessage.trim()} className="send-button">发送</Button>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : <div className="no-conversation"><Empty description="选择一个对话开始聊天" image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>}
        </div>

        <Modal
          open={!!imagePreview}
          footer={null}
          onCancel={closeImagePreview}
          centered
          width="100vw"
          className="image-preview-modal"
          closable={false}
          maskClosable={true}
        >
          <div
            className="image-preview-overlay"
            onClick={closeImagePreview}
            onMouseMove={handleImageDragMove}
            onMouseUp={handleImageDragEnd}
            onMouseLeave={handleImageDragEnd}
          >
            <div
              className={`image-preview-container ${imageDrag.isDragging ? 'dragging' : ''}`}
              onClick={(e) => e.stopPropagation()}
              onWheel={handleImageZoom}
              onMouseDown={handleImageDragStart}
            >
              <img
                src={imagePreview}
                alt="预览"
                className={`preview-image ${imageZoom > 1 ? 'zoomable' : ''}`}
                style={{
                  transform: `scale(${imageZoom}) translate(${imageDrag.translateX / imageZoom}px, ${imageDrag.translateY / imageZoom}px)`,
                  cursor: imageZoom > 1 ? (imageDrag.isDragging ? 'grabbing' : 'grab') : 'zoom-in'
                }}
                draggable={false}
              />
            </div>
            {imageZoom !== 1 && (
              <div className="zoom-indicator">
                {Math.round(imageZoom * 100)}%
              </div>
            )}
          </div>
        </Modal>

        {/* 通知设置弹窗 */}
        <Modal
          open={notificationSettingsOpen}
          onCancel={() => setNotificationSettingsOpen(false)}
          footer={null}
          centered
          className="notification-settings-modal"
          title={
            <div className="notification-settings-title">
              <SettingOutlined />
              <span>通知设置</span>
            </div>
          }
          width={400}
        >
          <div className="notification-settings-content">
            <div className="notification-settings-desc">
              选择您希望接收的通知类型
            </div>

            <div className="notification-setting-item">
              <div className="setting-info">
                <span className="setting-icon">📦</span>
                <div className="setting-text">
                  <div className="setting-label">商品通知</div>
                  <div className="setting-hint">商品发布、售出、解锁等通知</div>
                </div>
              </div>
              <Switch
                checked={notificationSettings.product}
                onChange={(checked) => setNotificationSettings(prev => ({ ...prev, product: checked }))}
              />
            </div>

            <div className="notification-setting-item">
              <div className="setting-info">
                <span className="setting-icon">🛒</span>
                <div className="setting-text">
                  <div className="setting-label">订单通知</div>
                  <div className="setting-hint">订单创建、处理、完成、取消等通知</div>
                </div>
              </div>
              <Switch
                checked={notificationSettings.order}
                onChange={(checked) => setNotificationSettings(prev => ({ ...prev, order: checked }))}
              />
            </div>

            <div className="notification-setting-item">
              <div className="setting-info">
                <span className="setting-icon">👤</span>
                <div className="setting-text">
                  <div className="setting-label">社交通知</div>
                  <div className="setting-hint">新粉丝、商品被收藏等通知</div>
                </div>
              </div>
              <Switch
                checked={notificationSettings.social}
                onChange={(checked) => setNotificationSettings(prev => ({ ...prev, social: checked }))}
              />
            </div>

            <div className="notification-settings-footer">
              <Button
                type="primary"
                block
                loading={settingsLoading}
                onClick={async () => {
                  setSettingsLoading(true);
                  try {
                    await updateNotificationSettings(notificationSettings);
                    message.success('通知设置已保存');
                    setNotificationSettingsOpen(false);
                  } catch {
                    message.error('保存失败，请重试');
                  } finally {
                    setSettingsLoading(false);
                  }
                }}
                className="save-settings-btn"
              >
                保存设置
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Chat;
