import React, { useState, useEffect } from 'react';
import { Layout, Avatar, Dropdown, Input, Button, Space } from 'antd';
import { 
  UserOutlined,
  HeartOutlined,
  LogoutOutlined,
  ShoppingOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const { Header: AntHeader } = Layout;

const Header = () => {
  const navigate = useNavigate();
  

  // 登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [headerKeyword, setHeaderKeyword] = useState('');
  

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
      key: 'favorites',
      icon: <HeartOutlined />,
      label: '我的收藏',
      onClick: () => navigate('/favorites')
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
          <span className="logo-subtitle">🤣🥰🤯😱</span>
        </div>

        {/* 搜索 */}
        <div className="header-search">
          <Space.Compact>
            <Input
              placeholder="搜索商品、分类或卖家"
              size="large"
              value={headerKeyword}
              onChange={(e) => setHeaderKeyword(e.target.value)}
              onPressEnter={() => handleSearch(headerKeyword)}
            />
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              onClick={() => handleSearch(headerKeyword)}
            >
              搜索
            </Button>
          </Space.Compact>
        </div>

        

        {/* 右侧操作区（重新设计） */}
        <div className="header-actions">
          {isLoggedIn ? (
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <button type="button" className="user-entry" aria-label="用户菜单">
                <Avatar 
                  size="large" 
                  icon={<UserOutlined />}
                  src={user?.avatar}
                />
                <span className="username">{user?.name || '用户'}</span>
              </button>
            </Dropdown>
          ) : (
            <Space>
              <Button className="auth-button" type="primary" onClick={() => navigate('/login')}>登录</Button>
              <Button className="auth-button" onClick={() => navigate('/register')}>注册</Button>
            </Space>
          )}
        </div>
      </div>
    </AntHeader>
  );
};

export default Header;