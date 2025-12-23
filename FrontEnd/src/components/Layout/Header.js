import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, Avatar, Dropdown, Input, Button, Space } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
  ShopOutlined,
  HeartOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';
import { getCurrentUser } from '../../api/user';

const { Header: AntHeader } = Layout;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [headerKeyword, setHeaderKeyword] = useState('');
  
  // 首页展开状态跟踪
  const [homeExpanded, setHomeExpanded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionDirectionRef = useRef(null);
  
  // 判断是否在首页
  const isHomePage = location.pathname === '/';
  
  // 计算是否应该显示透明模式
  const shouldBeTransparent = isHomePage && !homeExpanded && !isTransitioning;

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

  // 监听首页展开状态变化
  const handleHomeExpandChange = useCallback((event) => {
    const { isExpanded, isTransitioning: transitioning, transitionDirection } = event.detail;
    
    if (isHomePage) {
      setHomeExpanded(isExpanded);
      setIsTransitioning(transitioning);
      transitionDirectionRef.current = transitionDirection;
    }
  }, [isHomePage]);

  // 监听自定义事件
  useEffect(() => {
    window.addEventListener('homeExpandChange', handleHomeExpandChange);
    return () => {
      window.removeEventListener('homeExpandChange', handleHomeExpandChange);
    };
  }, [handleHomeExpandChange]);

  // 首页初始化时设置状态
  useEffect(() => {
    if (isHomePage) {
      // 检查是否已登录（登录用户默认展开）
      const authUser = localStorage.getItem('authUser');
      setHomeExpanded(!!authUser);
    } else {
      setHomeExpanded(true); // 非首页视为展开状态
    }
  }, [isHomePage]);


  const handleSearch = (value) => {
    const keyword = (value || '').trim();
    if (!keyword) {
      navigate('/search?type=products');
      return;
    }
    const params = new URLSearchParams({ 
      type: 'products',
      keyword 
    }).toString();
    navigate(`/search?${params}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('adminVerified');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  // 下拉菜单展开状态
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const userMenuItems = [
    {
      key: 'user-header',
      type: 'group',
      label: (
        <div className="user-menu-header">
          <div className="user-menu-info">
            <div className="user-menu-name">{user?.nickname || user?.username || '用户'}</div>
            <div className="user-menu-welcome">欢迎回来 👋</div>
          </div>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <span className="menu-label">个人中心<RightOutlined className="menu-arrow" /></span>,
      onClick: () => navigate('/profile')
    },
    {
      key: 'publish',
      icon: <ShopOutlined />,
      label: <span className="menu-label">发布商品<RightOutlined className="menu-arrow" /></span>,
      onClick: () => navigate('/publish')
    },
    {
      key: 'favorites',
      icon: <HeartOutlined />,
      label: <span className="menu-label">我的收藏<RightOutlined className="menu-arrow" /></span>,
      onClick: () => navigate('/profile?tab=favorites')
    },
    {
      key: 'messages',
      icon: <MessageOutlined />,
      label: <span className="menu-label">我的消息<RightOutlined className="menu-arrow" /></span>,
      onClick: () => navigate('/chat')
    },
    { type: 'divider' },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <span className="menu-label">账号设置<RightOutlined className="menu-arrow" /></span>,
      onClick: () => navigate('/profile?tab=account')
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: <span className="menu-label">帮助中心<RightOutlined className="menu-arrow" /></span>,
      onClick: () => navigate('/help')
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: <span className="menu-label">退出登录<RightOutlined className="menu-arrow" /></span>,
      onClick: handleLogout,
      danger: true
    }
  ];



  // 计算动态样式和类名
  const headerClassName = `app-header ${shouldBeTransparent ? 'header-transparent' : ''} ${isTransitioning ? 'header-transitioning' : ''}`;

  return (
    <AntHeader className={headerClassName}>
      <div className="header-content">
        {/* Logo */}
        <div className="logo" onClick={() => navigate('/')}>
          <span className="logo-text">中易</span>
        </div>

        {/* 搜索 */}
        <div className="header-search">
          <Space.Compact>
            <Input
              placeholder="搜索商品或卖家"
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
              menu={{ items: userMenuItems, className: 'user-dropdown-menu' }}
              placement="bottomRight"
              trigger={['hover']}
              overlayClassName="user-dropdown-overlay"
              onOpenChange={setDropdownOpen}
              getPopupContainer={(trigger) => trigger.parentElement}
            >
              <div className={`user-avatar-wrapper ${dropdownOpen ? 'active' : ''}`}>
                <Avatar
                  size={40}
                  icon={<UserOutlined />}
                  src={user?.avatar}
                  className="header-avatar"
                />
              </div>
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
