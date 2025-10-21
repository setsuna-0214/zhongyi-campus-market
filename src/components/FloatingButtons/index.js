import React, { useState } from 'react';
import { Button, Badge, Tooltip } from 'antd';
import { 
  PlusOutlined, 
  MessageOutlined, 
  CustomerServiceOutlined,
  QuestionCircleOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index.css';

const FloatingButtons = () => {
  const navigate = useNavigate();
  const [messageCount] = useState(5); // 模拟未读消息数
  const isLoggedIn = !!localStorage.getItem('authUser');

  const handlePublish = () => {
    navigate('/publish');
  };

  const handleChat = () => {
    navigate('/chat');
  };

  const handleHelp = () => {
    // 可以打开帮助文档或客服
    console.log('打开帮助');
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
              overlayClassName="floating-tooltip"
              destroyTooltipOnHide={true}
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
              overlayClassName="floating-tooltip"
              destroyTooltipOnHide={true}
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
          overlayClassName="floating-tooltip"
          destroyTooltipOnHide={true}
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