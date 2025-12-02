import React, { useState, useEffect } from 'react';
import { Layout, Avatar, Dropdown, Input, Button, Space } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import { getCurrentUser } from '../../api/user';

const { Header: AntHeader } = Layout;

const Header = () => {
  const navigate = useNavigate();

  // 登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [headerKeyword, setHeaderKeyword] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = localStorage.getItem('authUser');
        if (!raw) {
          setIsLoggedIn(false);
          setUser(null);
          return;
        }
        setIsLoggedIn(true);
        // 通过统一的用户接口获取合并后的完整用户信息（包含昵称等）
        const merged = await getCurrentUser();
        if (!cancelled) {
          setUser(merged);
        }
      } catch (e) {
        // 失败时退回到本地存储的原始数据
        try {
          const raw = localStorage.getItem('authUser');
          if (raw && !cancelled) {
            setIsLoggedIn(true);
            setUser(JSON.parse(raw));
          }
        } catch {
          if (!cancelled) {
            setIsLoggedIn(false);
            setUser(null);
          }
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);


  const handleSearch = (value) => {
    const keyword = (value || '').trim();
    if (!keyword) {
      navigate('/search');
      return;
    }
    const params = new URLSearchParams({ keyword }).toString();
    navigate(`/search?${params}`);
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
          <img src="/images/logo.png" alt="Logo" className="logo-icon" />
          <span className="logo-text">中易</span>
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


        {/* 右侧操作区 */}
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
              </button>
            </Dropdown>
          ) : (
            <button
              type="button"
              className="user-entry user-entry--guest"
              aria-label="登录"
              onClick={() => navigate('/login')}
            >
              <Avatar size="large" icon={<UserOutlined />} />
            </button>
          )}
        </div>
      </div>
    </AntHeader>
  );
};

export default Header;
