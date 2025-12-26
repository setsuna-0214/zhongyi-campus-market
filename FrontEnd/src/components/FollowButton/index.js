import React, { useState, useEffect, useRef } from 'react';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import './index.css';

/**
 * 关注按钮组件 - 使用多层背景实现平滑过渡
 * 
 * 状态流转：
 * - idle-follow: 未关注，等待点击
 * - idle-unfollow: 已关注，等待点击取关
 * - success: 刚关注成功
 * - removed: 刚取关成功
 * - transition-to-unfollow: 从成功过渡到取关状态
 * - transition-to-follow: 从取关过渡到关注状态
 */
const FollowButton = ({ 
  isFollowing = false, 
  onClick, 
  size = 'default',
  disabled = false,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [state, setState] = useState(isFollowing ? 'idle-unfollow' : 'idle-follow');
  const timerRef = useRef(null);

  // 同步外部状态（仅在空闲状态时）
  useEffect(() => {
    if (state === 'idle-follow' || state === 'idle-unfollow') {
      setState(isFollowing ? 'idle-unfollow' : 'idle-follow');
    }
  }, [isFollowing]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleMouseLeave = () => {
    setIsHovered(false);
    
    if (timerRef.current) clearTimeout(timerRef.current);

    // 从临时状态过渡到最终状态
    if (state === 'success') {
      setState('transition-to-unfollow');
      timerRef.current = setTimeout(() => {
        setState('idle-unfollow');
      }, 500);
    } else if (state === 'removed') {
      setState('transition-to-follow');
      timerRef.current = setTimeout(() => {
        setState('idle-follow');
      }, 500);
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (disabled) return;
    
    if (timerRef.current) clearTimeout(timerRef.current);

    // 根据当前显示状态决定下一个状态
    const currentlyFollowing = state === 'idle-unfollow' || state === 'success' || state === 'transition-to-unfollow';
    
    if (currentlyFollowing) {
      setState('removed');
    } else {
      setState('success');
    }

    if (onClick) onClick(e);
  };

  const sizeClass = size === 'small' ? 'sm' : size === 'large' ? 'lg' : 'md';

  // 获取当前应该显示的文字 - 统一使用2个字保持宽度一致
  const getText = () => {
    switch (state) {
      case 'success': return '已关';
      case 'removed': return '已取';
      case 'idle-unfollow':
      case 'transition-to-unfollow': return '取关';
      default: return '关注';
    }
  };

  // 获取图标类型
  const getIconType = () => {
    switch (state) {
      case 'success': return 'success';
      case 'removed': return 'removed';
      case 'idle-unfollow': return 'unfollow';
      case 'transition-to-unfollow': return 'morph-to-unfollow';
      case 'transition-to-follow': return 'morph-to-follow';
      default: return 'follow';
    }
  };

  const renderIcon = () => {
    const iconType = getIconType();
    
    switch (iconType) {
      case 'success':
        return (
          <span className="icon-container icon-success">
            <HeartFilled />
          </span>
        );
      case 'removed':
        return (
          <span className="icon-container icon-removed">
            <HeartOutlined />
          </span>
        );
      case 'unfollow':
        return (
          <span className="icon-container icon-break">
            <HeartFilled className="heart-half-left" />
            <HeartFilled className="heart-half-right" />
          </span>
        );
      case 'morph-to-unfollow':
        return (
          <span className="icon-container icon-morph-out">
            <HeartFilled />
          </span>
        );
      case 'morph-to-follow':
        return (
          <span className="icon-container icon-morph-in">
            <HeartOutlined />
          </span>
        );
      default:
        return (
          <span className="icon-container icon-beat">
            <HeartOutlined className="heart-outline" />
            <HeartFilled className="heart-filled" />
          </span>
        );
    }
  };

  return (
    <button
      className={`follow-btn follow-btn-${sizeClass} ${className}`}
      data-state={state}
      data-hovered={isHovered}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
    >
      {/* 背景层 - 使用opacity过渡实现平滑切换 */}
      <span className="bg-layer bg-follow" />
      <span className="bg-layer bg-unfollow" />
      <span className="bg-layer bg-success" />
      <span className="bg-layer bg-removed" />
      
      {/* 内容层 */}
      <span className="btn-content">
        <span className="btn-icon">{renderIcon()}</span>
        <span className="btn-text">{getText()}</span>
      </span>
    </button>
  );
};

export default FollowButton;
