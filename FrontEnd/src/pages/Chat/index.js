import React, { useState, useEffect, useRef } from 'react';
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
  Tooltip,
  Empty
} from 'antd';
import { 
  SendOutlined, 
  PictureOutlined, 
  SmileOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  MoreOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import './index.css';
import { listConversations, listMessages, sendMessage } from '../../api/chat';

const { TextArea } = Input;
const { Text, Title } = Typography;

const Chat = () => {
  
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef(null);
  
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // 从后端拉取会话与消息

  // 初始化数据
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const convs = await listConversations();
        setConversations(Array.isArray(convs) ? convs : []);
        const sellerId = searchParams.get('sellerId');
        const orderId = searchParams.get('orderId');
        if (sellerId || orderId) {
          const target = (convs || []).find(conv => 
            conv.userId?.toString() === sellerId || conv.orderId === orderId
          );
          if (target) {
            setCurrentConversation(target);
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
    
    // 标记为已读
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversation.id 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
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
      const serverMsg = await sendMessage(currentConversation.id, {
        type: 'text',
        content: outgoing.content
      });
      if (serverMsg) {
        setMessages(prev => [...prev, { ...serverMsg, isOwn: true }]);
        setConversations(prev => 
          prev.map(conv => 
            conv.id === currentConversation.id
              ? { 
                  ...conv, 
                  lastMessage: serverMsg.content,
                  lastMessageTime: serverMsg.timestamp
                }
              : conv
          )
        );
      }
    } catch (err) {
      message.error(err?.message || '发送消息失败');
    }
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
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageMessage = {
        id: Date.now(),
        senderId: 'current',
        senderName: '我',
        content: e.target.result,
        type: 'image',
        timestamp: new Date().toLocaleString(),
        isOwn: true
      };
      setMessages(prev => [...prev, imageMessage]);
      try {
        const serverMsg = await sendMessage(currentConversation.id, {
          type: 'image',
          content: e.target.result
        });
        if (serverMsg) {
          setMessages(prev => [...prev, { ...serverMsg, isOwn: true }]);
        }
      } catch (err) {
        message.error(err?.message || '发送图片失败');
      }
    };
    reader.readAsDataURL(file);
    return false; // 阻止默认上传行为
  };

  // 预览图片
  const handleImagePreview = (src) => {
    setImagePreview(src);
  };

  // 渲染消息
  const renderMessage = (message) => {
    const isOwn = message.isOwn;
    
    return (
      <div key={message.id} className={`message ${isOwn ? 'own' : 'other'}`}>
        {!isOwn && (
          <Avatar 
            src={currentConversation?.userAvatar} 
            size={32}
            className="message-avatar"
          />
        )}
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
        {isOwn && (
          <Avatar 
            style={{ backgroundColor: '#1890ff' }}
            size={32}
            className="message-avatar"
          >
            我
          </Avatar>
        )}
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
                      {conversation.lastMessage}
                    </Text>
                  </div>
                  
                  {conversation.productName && (
                    <div className="product-info">
                      <Image
                        src={conversation.productImage}
                        alt={conversation.productName}
                        width={20}
                        height={20}
                        preview={false}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                        {conversation.productName}
                      </Text>
                    </div>
                  )}
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
                  {currentConversation.productName && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      关于：{currentConversation.productName}
                    </Text>
                  )}
                </div>
              </div>
              
              <Space>
                <Tooltip title="语音通话">
                  <Button type="text" icon={<PhoneOutlined />} />
                </Tooltip>
                <Tooltip title="视频通话">
                  <Button type="text" icon={<VideoCameraOutlined />} />
                </Tooltip>
                <Tooltip title="更多">
                  <Button type="text" icon={<MoreOutlined />} />
                </Tooltip>
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