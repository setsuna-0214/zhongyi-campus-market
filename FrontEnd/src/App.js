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
import ProductDetail from './pages/Products/Detail';
import PublishProduct from './pages/Products/Publish';
import SearchPage from './pages/Search';
import UserProfile from './pages/User/Profile';
import SellerProfile from './pages/User/SellerProfile';
import Chat from './pages/Chat';
import AdminDashboard from './pages/Admin/Dashboard';
import FloatingButtons from './components/FloatingButtons';
import AdminGuard from './pages/Admin/Guard';
import OrderProcess from './pages/Orders/OrderProcess';

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
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/:id/edit" element={<PublishProduct />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/publish" element={<PublishProduct />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/users/:id" element={<SellerProfile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/orders/:id" element={<OrderProcess />} />
          <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Content>
      <FloatingButtons />
    </Layout>
  );
}

export default App;
