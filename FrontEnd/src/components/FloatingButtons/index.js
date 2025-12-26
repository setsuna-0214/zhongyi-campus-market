import { useState, useEffect, useCallback } from 'react';
import { Button, Badge, Tooltip } from 'antd';
import { 
  PlusOutlined,
  CommentOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { listConversations } from '../../api/chat';
import { listSystemMessages } from '../../api/systemMessage';
import { isLoggedIn as checkIsLoggedIn } from '../../utils/auth';
import './index.css';

const FloatingButtons = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [messageCount, setMessageCount] = useState(0);
  const loggedIn = checkIsLoggedIn();

  // 获取未读消息总数（包括普通会话和系统消息）
  const fetchUnreadCount = useCallback(async () => {
    if (!loggedIn) {
      setMessageCount(0);
      return;
    }
    try {
      // 并行获取普通会话和系统消息
      const [conversations, systemMessages] = await Promise.all([
        listConversations(),
        listSystemMessages()
      ]);
      
      // 普通会话未读数
      const chatUnread = (conversations || []).reduce((sum, conv) => {
        return sum + (conv.unreadCount || 0);
      }, 0);
      
      // 系统消息未读数
      const systemUnread = (systemMessages || []).filter(m => !m.isRead).length;
      
      setMessageCount(chatUnread + systemUnread);
    } catch (err) {
      // 获取失败时不更新，保持当前值
      console.warn('获取未读消息数失败:', err);
    }
  }, [loggedIn]);

  // 初始加载和定时刷新
  useEffect(() => {
    if (!loggedIn) return;

    // 初始加载
    fetchUnreadCount();

    // 每30秒刷新一次未读消息数
    const interval = setInterval(fetchUnreadCount, 30000);

    // 监听未读数变化事件（从聊天页面触发）
    const handleUnreadCountChanged = () => {
      fetchUnreadCount();
    };
    window.addEventListener('unreadCountChanged', handleUnreadCountChanged);

    return () => {
      clearInterval(interval);
      window.removeEventListener('unreadCountChanged', handleUnreadCountChanged);
    };
  }, [loggedIn, fetchUnreadCount]);

  // 当从聊天页面返回时，刷新未读消息数
  useEffect(() => {
    if (loggedIn && location.pathname !== '/chat') {
      fetchUnreadCount();
    }
  }, [location.pathname, loggedIn, fetchUnreadCount]);

  const handlePublish = () => {
    navigate('/publish');
  };

  const handleChat = () => {
    navigate('/chat');
  };

  const handleHelp = () => {
    navigate('/help');
  };

  return (
    <div className="floating-buttons">
      <div className="floating-buttons-container">
        {loggedIn && (
          <>
            <Tooltip 
              title="发布商品" 
              placement="left"
              mouseEnterDelay={0.15}
              mouseLeaveDelay={0.1}
              overlayClassName="floating-tooltip"
            >
              <Button
                icon={<PlusOutlined />}
                onClick={handlePublish}
                type="primary"
                shape="circle"
                size="large"
                className="floating-button publish-btn"
              />
            </Tooltip>
            
            <Tooltip 
              title={`消息通知${messageCount > 0 ? `(${messageCount})` : ''}`} 
              placement="left"
              mouseEnterDelay={0.15}
              mouseLeaveDelay={0.1}
              overlayClassName="floating-tooltip"
            >
              <Badge count={messageCount} size="small" className="message-badge">
                <Button
                  icon={<CommentOutlined />}
                  onClick={handleChat}
                  shape="circle"
                  size="large"
                  className="floating-button message-btn"
                />
              </Badge>
            </Tooltip>
          </>
        )}
        
        <Tooltip 
          title="帮助与反馈" 
          placement="left"
          mouseEnterDelay={0.15}
          mouseLeaveDelay={0.1}
          overlayClassName="floating-tooltip"
        >
          <Button
            icon={<BulbOutlined />}
            onClick={handleHelp}
            shape="circle"
            size="large"
            className="floating-button help-btn"
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default FloatingButtons;
