import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Input, 
  Button, 
  Avatar, 
  Typography, 
  Space, 
  Badge, 
  Divider,
  Image,
  Upload,
  Modal,
  message,
  Empty,
  Dropdown
} from 'antd';
import { 
  SendOutlined, 
  PictureOutlined, 
  SmileOutlined,
  MoreOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './index.css';
import { listConversations, listMessages, sendMessage, createConversation, deleteConversation, uploadChatImage, markConversationAsRead } from '../../api/chat';
import { getProduct } from '../../api/products';
import { resolveImageSrc } from '../../utils/images';
import ProductCard from '../../components/ProductCard';
import * as websocket from '../../api/websocket';

const { TextArea } = Input;
const { Text, Title } = Typography;

const Chat = () => {
  
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [sharedProduct, setSharedProduct] = useState(null);

  // WebSocket 消息处理
  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === 'new_message') {
      const newMsg = data.message;
      // 标记为对方发送的消息
      newMsg.isOwn = false;
      
      // 如果当前正在查看这个会话，添加消息到列表
      setCurrentConversation(current => {
        if (current && (current.id === data.conversationId || current.id === newMsg.conversationId)) {
          setMessages(prev => {
            // 避免重复添加
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
        return current;
      });
      
      // 更新会话列表
      setConversations(prev => prev.map(conv => {
        if (conv.id === data.conversationId || conv.partnerId === newMsg.senderId) {
          return {
            ...conv,
            lastMessage: newMsg.type === 'image' ? '[图片]' : newMsg.content,
            lastMessageTime: newMsg.timestamp || new Date().toLocaleString(),
            unreadCount: (conv.unreadCount || 0) + 1
          };
        }
        return conv;
      }));
      
      // 播放提示音（可选）
      // new Audio('/notification.mp3').play().catch(() => {});
    }
  }, []);

  // 连接 WebSocket
  useEffect(() => {
    websocket.connect();
    websocket.addListener('chat-page', handleWebSocketMessage);
    
    return () => {
      websocket.removeListener('chat-page');
    };
  }, [handleWebSocketMessage]);

  // 从后端拉取会话与消息
  // 初始化数据
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const convs = await listConversations();
        const dedup = (arr) => {
          if (!Array.isArray(arr)) return [];
          const seen = new Set();
          const out = [];
          for (const c of arr) {
            const key = `${String(c.userId)}|${c.orderId ?? ''}`;
            if (!seen.has(key)) { seen.add(key); out.push(c); }
          }
          return out;
        };
        const list = dedup(convs);
        setConversations(list);
        const sellerId = searchParams.get('sellerId');
        const orderId = searchParams.get('orderId');
        const productId = searchParams.get('productId');
        if (productId) {
          try {
            const p = await getProduct(productId);
            setSharedProduct(p);
          } catch {}
        }
        if (sellerId || orderId) {
          // 查找现有会话：partnerId 是对方用户ID，orderId 是订单ID
          let target = (list || []).find(conv => 
            (sellerId && conv.partnerId?.toString() === sellerId) || 
            (orderId && conv.orderId?.toString() === orderId)
          );
          if (!target && sellerId) {
            try {
              // 创建新会话时，userId 参数是对方用户ID
              const conv = await createConversation({ 
                userId: parseInt(sellerId, 10), 
                productId: productId ? parseInt(productId, 10) : null, 
                orderId: orderId ? parseInt(orderId, 10) : null 
              });
              if (conv && conv.id) {
                setConversations(prev => {
                  const exists = prev.some(c => c.id === conv.id);
                  return exists ? prev : [conv, ...prev];
                });
                target = conv;
                const msgs = await listMessages(conv.id);
                setMessages(Array.isArray(msgs) ? msgs : []);
              }
            } catch (err) {
              console.error('创建会话失败:', err);
            }
          }
          if (target && target.id) {
            setCurrentConversation(target);
            // 只有当消息列表为空时才加载消息
            const msgs = await listMessages(target.id);
            setMessages(Array.isArray(msgs) ? msgs : []);
          }
        }
      } catch (err) {
        message.error(err?.message || '获取聊天数据失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 选择对话
  const handleSelectConversation = async (conversation) => {
    setCurrentConversation(conversation);
    try {
      const msgs = await listMessages(conversation.id);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      message.error(err?.message || '获取消息失败');
    }
    
    // 标记为已读（同时更新本地状态和后端/mock数据）
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversation.id 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
    // 调用API标记已读，确保数据持久化
    try {
      await markConversationAsRead(conversation.id);
    } catch {
      // 标记已读失败不影响用户体验
    }
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation) return;
    
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
    
    // 更新对话列表中的最后一条消息
    setConversations(prev => 
      prev.map(conv => 
        conv.id === currentConversation.id
          ? { 
              ...conv, 
              lastMessage: outgoing.content,
              lastMessageTime: outgoing.timestamp
            }
          : conv
      )
    );

    try {
      await sendMessage(currentConversation.id, {
        type: 'text',
        content: outgoing.content
      });
    } catch (err) {
      message.error(err?.message || '发送消息失败');
    }
  };

  const handleSendProductCard = async () => {
    if (!currentConversation || !sharedProduct) return;
    const p = sharedProduct;
    const content = {
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category,
      status: p.status,
      location: p.location,
      sellerName: typeof p.seller === 'string' ? p.seller : (p.seller?.nickname || p.seller?.username || '卖家'),
      publishedAt: p.publishTime || p.publishedAt || p.createdAt,
      views: p.views,
      imageSrc: resolveImageSrc({ product: p }),
      overlayType: 'views-left',
      dateFormat: 'ymd'
    };
    const msg = {
      id: Date.now(),
      senderId: 'current',
      senderName: '我',
      content,
      type: 'product',
      timestamp: new Date().toLocaleString(),
      isOwn: true
    };
    setMessages(prev => [...prev, msg]);
    setConversations(prev => prev.map(conv => (
      conv.id === currentConversation.id
        ? { ...conv, lastMessage: `分享了商品卡片：${p.title || ''}`.trim(), lastMessageTime: msg.timestamp }
        : conv
    )));
    try {
      await sendMessage(currentConversation.id, { type: 'product', content });
    } catch {}
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 上传图片
  const handleImageUpload = async (file) => {
    if (!currentConversation) {
      message.error('请先选择一个对话');
      return false;
    }
    
    // 显示上传中的占位消息
    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      senderId: 'current',
      senderName: '我',
      content: '', // 占位
      type: 'image',
      timestamp: new Date().toLocaleString(),
      isOwn: true,
      uploading: true
    };
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      // 1. 先上传图片获取 URL
      const imageUrl = await uploadChatImage(file);
      
      // 2. 更新本地消息显示
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, content: imageUrl, uploading: false }
          : msg
      ));
      
      // 3. 发送图片消息到服务器
      await sendMessage(currentConversation.id, {
        type: 'image',
        content: imageUrl
      });
      
      // 4. 更新会话列表
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversation.id
          ? { ...conv, lastMessage: '[图片]', lastMessageTime: new Date().toLocaleString() }
          : conv
      ));
    } catch (err) {
      // 上传失败，移除占位消息
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      message.error(err?.message || '发送图片失败');
    }
    
    return false; // 阻止默认上传行为
  };

  // 预览图片
  const handleImagePreview = (src) => {
    setImagePreview(src);
  };

  // 渲染消息
  const renderMessage = (message) => {
    const isOwn = message.isOwn;
    if (message.type === 'product') {
      const item = message.content || {};
      return (
        <div key={message.id} className={`message ${isOwn ? 'own' : 'other'}`}>
          <div className="message-content">
            <ProductCard
              imageSrc={item.imageSrc}
              title={item.title}
              price={item.price}
              category={item.category}
              status={item.status}
              location={item.location}
              sellerName={item.sellerName}
              publishedAt={item.publishedAt}
              views={item.views}
              overlayType={item.overlayType || 'views-left'}
              dateFormat={item.dateFormat || 'ymd'}
              onClick={() => item.id && navigate(`/products/${item.id}`)}
              imageHeight={160}
            />
            <div className="message-time">
              <Text type="secondary" style={{ fontSize: 12 }}>
                {message.timestamp}
              </Text>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div key={message.id} className={`message ${isOwn ? 'own' : 'other'}`}>
        <div className="message-content">
          <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
            {message.type === 'text' ? (
              <Text>{message.content}</Text>
            ) : (
              <Image
                src={message.content}
                alt="聊天图片"
                width={200}
                style={{ borderRadius: 8 }}
                preview={{
                  onVisibleChange: (visible) => {
                    if (!visible) setImagePreview(null);
                  }
                }}
                onClick={() => handleImagePreview(message.content)}
              />
            )}
          </div>
          <div className="message-time">
            <Text type="secondary" style={{ fontSize: 12 }}>
              {message.timestamp}
            </Text>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container chat-container">
      {/* 对话列表 */}
      <div className="conversation-list">
        <div className="conversation-header">
          <Title level={4}>消息</Title>
        </div>
        
        <div className="conversation-items">
          {conversations.length > 0 ? (
            conversations.map(conversation => (
              <div
                key={conversation.id}
                className={`conversation-item ${
                  currentConversation?.id === conversation.id ? 'active' : ''
                }`}
                onClick={() => handleSelectConversation(conversation)}
              >
                <Badge count={conversation.unreadCount} size="small">
                  <Avatar src={conversation.userAvatar} size={48} />
                </Badge>
                
                <div className="conversation-info">
                  <div className="conversation-top">
                    <Text strong className="user-name">
                      {conversation.userName}
                    </Text>
                    <Text type="secondary" className="last-time">
                      {((conversation.lastMessageTime || '').split(' ')[1]) || conversation.lastMessageTime || ''}
                    </Text>
                  </div>
                  
                  <div className="conversation-bottom">
                <Text type="secondary" className="last-message" ellipsis>
                      {(() => {
                        const lm = conversation.lastMessage;
                        if (!lm) return '';
                        if (typeof lm === 'string') return lm;
                        if (typeof lm === 'object') {
                          if (lm.type === 'text' && lm.content) return String(lm.content);
                          if (lm.type === 'image') return '[图片]';
                          if (lm.type === 'product') return `分享了商品卡片：${lm.title || ''}`.trim();
                          if (lm.title) return `分享了商品卡片：${lm.title}`;
                          return '[新消息]';
                        }
                        try { return String(lm); } catch { return '[新消息]'; }
                      })()}
                    </Text>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <Empty description="暂无对话" />
          )}
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="chat-area">
        {currentConversation ? (
          <>
            {/* 聊天头部 */}
            <div className="chat-header">
              <div className="chat-user-info">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  className="back-button"
                  onClick={() => setCurrentConversation(null)}
                />
                <Avatar src={currentConversation.userAvatar} size={40} />
                <div className="user-details">
                  <Text strong>{currentConversation.userName}</Text>
                </div>
              </div>
              
              <Space>
                <Dropdown
                  menu={{
                    items: [{ key: 'delete', label: '删除该聊天' }],
                    onClick: async ({ key }) => {
                      if (key === 'delete' && currentConversation) {
                        Modal.confirm({
                          title: '确定删除该聊天？',
                          onOk: async () => {
                            try {
                              await deleteConversation(currentConversation.id);
                              setConversations(prev => prev.filter(c => c.id !== currentConversation.id));
                              setMessages([]);
                              setCurrentConversation(null);
                              message.success('已删除该聊天');
                            } catch (err) {
                              message.error(err?.message || '删除失败');
                            }
                          }
                        });
                      }
                    }
                  }}
                >
                  <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
              </Space>
            </div>

            <Divider style={{ margin: 0 }} />

            {/* 消息列表 */}
            <div className="messages-container">
              {messages.length > 0 ? (
                messages.map(renderMessage)
              ) : (
                <Empty description="开始聊天吧" />
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="input-area">
              <div className="input-toolbar">
                <Space>
                  <Upload
                    beforeUpload={handleImageUpload}
                    showUploadList={false}
                    accept="image/*"
                  >
                    <Button type="text" icon={<PictureOutlined />} />
                  </Upload>
                  <Button type="text" icon={<SmileOutlined />} />
                  {currentConversation && sharedProduct && (
                    <Button type="default" onClick={handleSendProductCard}>发送商品卡片</Button>
                  )}
                </Space>
              </div>
              
              <div className="input-box">
                <TextArea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入消息..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  bordered={false}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="send-button"
                >
                  发送
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="no-conversation">
            <Empty
              description="选择一个对话开始聊天"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </div>

      {/* 图片预览 */}
      <Modal
        open={!!imagePreview}
        footer={null}
        onCancel={() => setImagePreview(null)}
        centered
        width="auto"
      >
        <Image src={imagePreview} alt="预览" />
      </Modal>
    </div>
  );
};

export default Chat;