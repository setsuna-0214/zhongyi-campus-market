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

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Content>
      <FloatingButtons />
    </Layout>
  );
}

export default App;
