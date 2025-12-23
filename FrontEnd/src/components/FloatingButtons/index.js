import React, { useState, useEffect, useCallback } from 'react';
import { Button, Badge, Tooltip } from 'antd';
import { 
  PlusOutlined, 
  MessageOutlined, 
  QuestionCircleOutlined 
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { listConversations } from '../../api/chat';
import './index.css';

const FloatingButtons = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [messageCount, setMessageCount] = useState(0);
  const isLoggedIn = !!localStorage.getItem('authUser');

  // 获取未读消息总数
  const fetchUnreadCount = useCallback(async () => {
    if (!isLoggedIn) {
      setMessageCount(0);
      return;
    }
    try {
      const conversations = await listConversations();
      const total = (conversations || []).reduce((sum, conv) => {
        return sum + (conv.unreadCount || 0);
      }, 0);
      setMessageCount(total);
    } catch (err) {
      // 获取失败时不更新，保持当前值
      console.warn('获取未读消息数失败:', err);
    }
  }, [isLoggedIn]);

  // 初始加载和定时刷新
  useEffect(() => {
    if (!isLoggedIn) return;

    // 初始加载
    fetchUnreadCount();

    // 每30秒刷新一次未读消息数
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [isLoggedIn, fetchUnreadCount]);

  // 当从聊天页面返回时，刷新未读消息数
  useEffect(() => {
    if (isLoggedIn && location.pathname !== '/chat') {
      fetchUnreadCount();
    }
  }, [location.pathname, isLoggedIn, fetchUnreadCount]);

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
        {isLoggedIn && (
          <>
            <Tooltip 
              title="发布商品" 
              placement="left"
              mouseEnterDelay={0.5}
              mouseLeaveDelay={0.1}
              classNames={{ root: 'floating-tooltip' }}
              destroyOnHidden
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
              title={`消息${messageCount > 0 ? `(${messageCount})` : ''}`} 
              placement="left"
              mouseEnterDelay={0.5}
              mouseLeaveDelay={0.1}
              classNames={{ root: 'floating-tooltip' }}
              destroyOnHidden
            >
              <Button
                icon={
                  <Badge count={messageCount} size="small" offset={[8, -8]}>
                    <MessageOutlined />
                  </Badge>
                }
                onClick={handleChat}
                shape="circle"
                size="large"
                className="floating-button message-btn"
              />
            </Tooltip>
          </>
        )}
        
        <Tooltip 
          title="帮助与反馈" 
          placement="left"
          mouseEnterDelay={0.5}
          mouseLeaveDelay={0.1}
          classNames={{ root: 'floating-tooltip' }}
          destroyOnHidden
        >
          <Button
            icon={<QuestionCircleOutlined />}
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
