import React, { useState, useEffect } from 'react';
import { Layout, Avatar, Dropdown, Input } from 'antd';
import { 
  UserOutlined,
  HeartOutlined,
  LogoutOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const { Header: AntHeader } = Layout;

const Header = () => {
  const navigate = useNavigate();
  const { Search } = Input;

  // 登录状态（从本地存储读取）
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  

  useEffect(() => {
    try {
      const raw = localStorage.getItem('authUser');
      if (raw) {
        setIsLoggedIn(true);
        setUser(JSON.parse(raw));
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (e) {
      setIsLoggedIn(false);
      setUser(null);
    }
  }, []);

  
  const handleSearch = (value) => {
    const keyword = (value || '').trim();
    if (!keyword) {
      navigate('/products');
      return;
    }
    const params = new URLSearchParams({ keyword }).toString();
    navigate(`/products?${params}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('adminVerified');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile')
    },
    {
      key: 'orders',
      icon: <ShoppingOutlined />,
      label: '我的订单',
      onClick: () => navigate('/orders')
    },
    {
      key: 'wishlist',
      icon: <HeartOutlined />,
      label: '心愿单',
      onClick: () => navigate('/wishlist')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];



  return (
    <AntHeader className="app-header">
      <div className="header-content">
        {/* Logo */}
        <div className="logo" onClick={() => navigate('/')}>
          <span className="logo-text">中易</span>
          <span className="logo-subtitle">校园二手交易</span>
        </div>

        {/* 搜索 */}
        <div className="header-search">
          <Search
            placeholder="搜索商品、分类或卖家"
            allowClear
            enterButton="搜索"
            onSearch={handleSearch}
            size="middle"
          />
        </div>

        

        {/* 右侧操作区 */}
        <div className="header-actions">
          {isLoggedIn ? (
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <div className="user-avatar">
                <Avatar 
                  size="large" 
                  icon={<UserOutlined />}
                  src={user?.avatar}
                />
                <span className="username">{user?.name || '用户'}</span>
              </div>
            </Dropdown>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </AntHeader>
  );
};

export default Header;