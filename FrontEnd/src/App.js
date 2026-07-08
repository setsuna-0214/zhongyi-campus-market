/**
 * 应用根组件
 * 定义全局布局和路由配置
 */

import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Spin } from 'antd';

import Header from './components/Layout/Header';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import FloatingButtons from './components/FloatingButtons';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// 路由级代码分割：减少首屏包体（首页/登录等保留同步加载，避免首屏 Suspense 闪烁）
const ProductDetail = lazy(() => import('./pages/Products/Detail'));
const SearchPage = lazy(() => import('./pages/Search'));
const UserProfile = lazy(() => import('./pages/User/Profile'));
const SellerProfile = lazy(() => import('./pages/User/SellerProfile'));
const Chat = lazy(() => import('./pages/Chat'));
const OrderProcess = lazy(() => import('./pages/Orders/OrderProcess'));
const Help = lazy(() => import('./pages/Help'));

// 统一发布页（商品 + 帖子切换）
const UnifiedPublish = lazy(() => import('./pages/Publish'));

// 独立编辑路由（保持原样）
const PublishProduct = lazy(() => import('./pages/Products/Publish'));

// 论坛模块（独立路由，懒加载）
const ForumHome = lazy(() => import('./pages/Forum/ForumHome'));
const PostDetail = lazy(() => import('./pages/Forum/PostDetail'));
const ForumSearch = lazy(() => import('./pages/Forum/ForumSearch'));
const PublishPost = lazy(() => import('./pages/Forum/PublishPost'));

// 求购模块（阶段四重点创新）
const WantsHome = lazy(() => import('./pages/Want/WantHome'));
const PublishWant = lazy(() => import('./pages/Want/PublishWant'));
const WantDetail = lazy(() => import('./pages/Want/WantDetail'));

// 管理员后台模块（懒加载，由 ProtectedRoute 限制仅 admin 角色可访问）
const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/Admin/Users'));
const AdminProducts = lazy(() => import('./pages/Admin/Products'));
const AdminOrders = lazy(() => import('./pages/Admin/Orders'));
const AdminPosts = lazy(() => import('./pages/Admin/Posts'));
const AdminWants = lazy(() => import('./pages/Admin/Wants'));
const AdminSystem = lazy(() => import('./pages/Admin/System'));

import './App.css';
import './components/ProductCard/index.css';

const { Content } = Layout;

function App() {
  return (
    <Layout className="app-layout">
      <Header />
      <Content className="app-content">
        <Suspense
          fallback={(
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
              <Spin size="large" />
            </div>
          )}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/products/:id/edit" element={<ProtectedRoute><PublishProduct /></ProtectedRoute>} />
            <Route path="/search" element={<SearchPage />} />
            {/* 统一发布页：?tab=product（默认） | ?tab=post */}
            <Route path="/publish" element={<ProtectedRoute><UnifiedPublish /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/users/:id" element={<SellerProfile />} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderProcess /></ProtectedRoute>} />
            <Route path="/help" element={<Help />} />

            {/* ======= 论坛路由 ======= */}
            <Route path="/forum" element={<ForumHome />} />
            <Route path="/forum/posts/:id" element={<PostDetail />} />
            <Route path="/forum/search" element={<ForumSearch />} />
            {/* 论坛帖子编辑（保持独立路由） */}
            <Route path="/publish-post/:id/edit" element={<ProtectedRoute><PublishPost /></ProtectedRoute>} />

            {/* ======= 求购路由 ======= */}
            <Route path="/wants" element={<WantsHome />} />
            <Route path="/wants/new" element={<ProtectedRoute><PublishWant /></ProtectedRoute>} />
            <Route path="/wants/:id" element={<WantDetail />} />

            {/* ======= 管理员后台路由 ======= */}
            <Route
              path="/admin"
              element={<ProtectedRoute allowRoles={['admin']}><AdminLayout /></ProtectedRoute>}
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="posts" element={<AdminPosts />} />
              <Route path="wants" element={<AdminWants />} />
              <Route path="system" element={<AdminSystem />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Content>
      <FloatingButtons />
    </Layout>
  );
}

export default App;
