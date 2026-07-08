/**
 * 管理员后台布局
 * 左侧导航 + 顶部标题栏 + 内容区（Outlet 渲染子路由）
 * 复用 antd Layout 与项目主题色，文案全部中文。
 */

import { useMemo } from 'react';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  ProfileOutlined,
  MessageOutlined,
  BulbOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { isAdmin } from '../../utils/auth';

const { Sider, Header, Content } = Layout;
const { Title } = Typography;

/** 左侧导航菜单项 */
const menuItems = [
  { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '统计首页' },
  { key: '/admin/users', icon: <UserOutlined />, label: '用户管理' },
  { key: '/admin/products', icon: <ShoppingOutlined />, label: '商品管理' },
  { key: '/admin/orders', icon: <ProfileOutlined />, label: '订单管理' },
  { key: '/admin/posts', icon: <MessageOutlined />, label: '论坛管理' },
  { key: '/admin/wants', icon: <BulbOutlined />, label: '求购管理' },
  { key: '/admin/system', icon: <DesktopOutlined />, label: '系统状态' },
];

// 各页面对应的中文标题
const pageTitleMap = {
  '/admin/dashboard': '统计首页',
  '/admin/users': '用户管理',
  '/admin/products': '商品管理',
  '/admin/orders': '订单管理',
  '/admin/posts': '论坛管理',
  '/admin/wants': '求购管理',
  '/admin/system': '系统状态',
};

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // 非管理员不应进入后台，由路由守卫拦截，此处再做一层兜底
  const adminOk = isAdmin();

  // 当前选中的菜单项（取路径前缀匹配）
  const selectedKey = useMemo(() => {
    const match = menuItems.find((item) => location.pathname.startsWith(item.key));
    return match ? match.key : '/admin/dashboard';
  }, [location.pathname]);

  const currentTitle = pageTitleMap[selectedKey] || '管理后台';

  if (!adminOk) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#888' }}>
        权限不足，仅管理员可访问后台。
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: 'calc(100vh - 64px)' }}>
      <Sider
        width={208}
        breakpoint="md"
        collapsedWidth={0}
        style={{ background: '#fff' }}
      >
        <div style={{ padding: '16px 20px', fontWeight: 700, fontSize: 16 }}>
          中易校园集市 · 管理后台
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
          items={menuItems}
        />
        <div style={{ padding: '12px 20px', color: '#aaa', fontSize: 12 }}>
          <Link to="/">返回前台首页</Link>
        </div>
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            {currentTitle}
          </Title>
        </Header>
        <Content style={{ padding: 24, background: '#f5f7fa' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}