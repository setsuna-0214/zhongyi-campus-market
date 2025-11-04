import client from './client';
import { mockUserDebug, mockProducts, ensureMockState, isMockEnabled } from './mockData';

// 获取当前用户信息与汇总数据
export async function getCurrentUser() {
  if (isMockEnabled()) {
    try {
      const raw = localStorage.getItem('authUser');
      if (raw) return JSON.parse(raw);
    } catch {}
    return mockUserDebug;
  }
  const { data } = await client.get('/user/me');
  return data;
}

// 更新当前用户信息
export async function updateCurrentUser(payload) {
  if (isMockEnabled()) {
    const updated = { ...mockUserDebug, ...payload };
    try { localStorage.setItem('authUser', JSON.stringify(updated)); } catch {}
    return updated;
  }
  const { data } = await client.put('/user/me', payload);
  return data;
}

// 获取当前用户的发布、购买、收藏列表
export async function getUserCollections() {
  if (isMockEnabled()) {
    ensureMockState();
    let favorites = [];
    let orders = [];
    try {
      favorites = JSON.parse(localStorage.getItem('mock_favorites') || '[]');
      orders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
    } catch {}
    return {
      published: mockProducts.filter(p => p.seller?.id === 's1'),
      purchases: orders.map(o => ({ ...o.product })),
      favorites: favorites.map(w => ({ id: w.productId, title: w.productName, images: [w.coverImage], price: w.currentPrice }))
    };
  }
  const { data } = await client.get('/user/collections');
  return data; // { published: [], purchases: [], favorites: [] }
}

// 上传头像
export async function uploadAvatar(file) {
  if (isMockEnabled()) {
    // 简单返回占位头像地址
    const avatarUrl = '/images/avatars/avatar-1.svg';
    try {
      const raw = localStorage.getItem('authUser');
      const user = raw ? JSON.parse(raw) : mockUserDebug;
      const updated = { ...user, avatar: avatarUrl };
      localStorage.setItem('authUser', JSON.stringify(updated));
    } catch {}
    return { avatarUrl };
  }
  const formData = new FormData();
  formData.append('avatar', file);
  const { data } = await client.post('/user/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data; // { avatarUrl }
}