/**
 * 顶部导航栏组件
 * 包含 Logo、搜索框、用户菜单，支持首页透明模式
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, Avatar, Dropdown, Input, Button, Space } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
  ShoppingOutlined,
  HeartOutlined,
  OrderedListOutlined,
  TeamOutlined,
  SettingOutlined,
  RightOutlined,
  FormOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';
import { getCurrentUser } from '../../api/user';
import { isLoggedIn as checkIsLoggedIn, getCurrentUser as getLocalUser, clearAuth } from '../../utils/auth';

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

  // 判断是否在论坛页面
  const isForumPage = location.pathname.startsWith('/forum') || location.pathname === '/publish-post' || location.pathname.startsWith('/publish-post/');

  // 计算是否应该显示透明模式
  const shouldBeTransparent = isHomePage && !homeExpanded && !isTransitioning;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!checkIsLoggedIn()) {
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
      } catch {
        // 失败时退回到本地存储的原始数据
        if (!cancelled) {
          const localUser = getLocalUser();
          if (localUser) {
            setIsLoggedIn(true);
            setUser(localUser);
          } else {
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
      setHomeExpanded(checkIsLoggedIn());
    } else {
      setHomeExpanded(true); // 非首页视为展开状态
    }
  }, [isHomePage]);

  // 监听用户信息更新事件
  useEffect(() => {
    const handleUserUpdated = (event) => {
      if (event.detail) {
        setUser(event.detail);
      }
    };
    window.addEventListener('userUpdated', handleUserUpdated);
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdated);
    };
  }, []);


  const handleSearch = (value) => {
    const keyword = (value || '').trim();

    // 论坛页面：搜索论坛帖子
    if (isForumPage) {
      const params = new URLSearchParams();
      if (keyword) params.set('q', keyword);
      navigate(params.toString() ? `/forum/search?${params.toString()}` : '/forum/search');
      return;
    }

    // 非论坛页面：搜索商品（原有逻辑）
    const currentParams = new URLSearchParams(location.search);
    const currentType = location.pathname === '/search' ? (currentParams.get('type') || 'products') : 'products';
    const params = new URLSearchParams();
    if (currentType !== 'products') params.set('type', currentType);
    if (keyword) params.set('q', keyword);
    const queryString = params.toString();
    navigate(queryString ? `/search?${queryString}` : '/search');
  };

  const handleLogout = () => {
    clearAuth();
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
      key: 'products',
      icon: <ShoppingOutlined />,
      label: <span className="menu-label">商品管理<RightOutlined className="menu-arrow" /></span>,
      onClick: () => navigate('/profile?t=products')
    },
    {
      key: 'orders',
      icon: <OrderedListOutlined />,
      label: <span className="menu-label">订单管理<RightOutlined className="menu-arrow" /></span>,
      onClick: () => navigate('/profile?t=orders')
    },
    {
      key: 'favorites',
      icon: <HeartOutlined />,
      label: <span className="menu-label">我的收藏<RightOutlined className="menu-arrow" /></span>,
      onClick: () => navigate('/profile?t=favorites')
    },
    {
      key: 'follows',
      icon: <TeamOutlined />,
      label: <span className="menu-label">我的关注<RightOutlined className="menu-arrow" /></span>,
      onClick: () => navigate('/profile?t=follows')
    },
    {
      key: 'my-posts',
      icon: <FormOutlined />,
      label: <span className="menu-label">我的帖子<RightOutlined className="menu-arrow" /></span>,
      onClick: () => navigate('/profile?t=my-posts')
    },
    { type: 'divider' },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <span className="menu-label">账户设置<RightOutlined className="menu-arrow" /></span>,
      onClick: () => navigate('/profile?t=account')
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
        {/* Logo + 模式导航 */}
        <div className="header-left">
          <div className="logo" onClick={() => navigate('/')}>
            <span className="logo-text">中易</span>
          </div>

          {/* 市场 / 论坛 导航标签 */}
          <nav className="header-nav-tabs" aria-label="模式切换">
            <button
              id="nav-tab-market"
              className={`nav-tab ${!isForumPage ? 'active' : ''}`}
              onClick={() => navigate('/')}
              aria-current={!isForumPage ? 'page' : undefined}
            >
              <span className="nav-tab-icon">🛒</span>
              <span className="nav-tab-text">商品</span>
            </button>
            <button
              id="nav-tab-forum"
              className={`nav-tab ${isForumPage ? 'active' : ''}`}
              onClick={() => navigate('/forum')}
              aria-current={isForumPage ? 'page' : undefined}
            >
              <span className="nav-tab-icon">💬</span>
              <span className="nav-tab-text">论坛</span>
            </button>
          </nav>
        </div>

        {/* 搜索 */}
        <div className="header-search">
          <Space.Compact>
            <Input
              placeholder={isForumPage ? '搜索论坛帖子' : '搜索商品'}
              size="large"
              value={headerKeyword}
              onChange={(e) => setHeaderKeyword(e.target.value)}
              onPressEnter={() => handleSearch(headerKeyword)}
              autoComplete="off"
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
              trigger={['hover', 'click']}
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
