import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import 'moment/locale/zh-cn';

// 导入组件
import Header from './components/Layout/Header';
// 页面组件
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ProductList from './pages/Products';
import ProductDetail from './pages/Products/Detail';
import PublishProduct from './pages/Products/Publish';
import UserProfile from './pages/User/Profile';
import Chat from './pages/Chat';
import AdminDashboard from './pages/Admin/Dashboard';
import FloatingButtons from './components/FloatingButtons';
import AdminGuard from './pages/Admin/Guard';

import './App.css';
import './components/ProductCard/index.css';

const { Content } = Layout;

function App() {
  return (
    <Layout className="app-layout">
      <Header />
      <Content className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/publish" element={<PublishProduct />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/favorites" element={<Navigate to="/profile?tab=favorites" replace />} />
          <Route path="/wishlist" element={<Navigate to="/profile?tab=favorites" replace />} />
          <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Content>
      <FloatingButtons />
    </Layout>
  );
}

export default App;
