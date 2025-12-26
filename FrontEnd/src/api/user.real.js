import client from './client';

export async function getCurrentUser() {
  const { data } = await client.get('/user/me');
  // 后端返回格式: { code: 200, message: "成功", data: userInfo }
  // 需要提取 data.data 才是真正的用户信息
  const userInfo = data?.data || data;
  // 直接返回后端数据，由前端统一处理字段过滤
  return userInfo || {};
}

export async function updateCurrentUser(payload) {
  const { data } = await client.put('/user/me', payload);
  // 后端返回格式: { code: 200, message: "修改完成", data: updatedUserInfo }
  const userInfo = data?.data || data;
  // 直接返回后端数据，由前端统一处理字段过滤
  return userInfo || {};
}

export async function getUserCollections() {
  const { data } = await client.get('/user/collections');
  return data;
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);
  const { data } = await client.post('/user/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  // 同步更新 localStorage 中的用户头像
  const avatarUrl = data?.data?.avatarUrl || data?.avatarUrl;
  if (avatarUrl) {
    try {
      const raw = localStorage.getItem('authUser');
      if (raw) {
        const user = JSON.parse(raw);
        user.avatar = avatarUrl;
        localStorage.setItem('authUser', JSON.stringify(user));
      }
    } catch {}
  }
  
  return data?.data || data;
}

// 标准化商品数据，确保字段一致
function normalizeProduct(item) {
  if (!item) return item;
  const coverImage = item.image || item.coverImage;
  const images = item.images || (coverImage ? [coverImage] : []);
  return {
    ...item,
    image: coverImage,
    images,
    status: item.status ?? item.saleStatus ?? '在售',
  };
}

export async function getMyPublished() {
  const { data } = await client.get('/user/published');
  // 后端返回格式: { code: 200, message: "成功", data: [...] }
  const items = data?.data || data;
  const arr = Array.isArray(items) ? items : (items?.items || []);
  return arr.map(normalizeProduct);
}

export async function getMyPurchases() {
  const { data } = await client.get('/user/purchases');
  // 后端返回格式: { code: 200, message: "成功", data: [...] }
  // 注意：此接口应只返回已完成的订单商品
  const items = data?.data || data;
  const arr = Array.isArray(items) ? items : (items?.items || []);
  return arr.map(normalizeProduct);
}

export async function getUser(id) {
  const { data } = await client.get(`/user/${id}`);
  // 后端返回格式: { code: 200, message: "成功", data: userInfo }
  const userInfo = data?.data || data;
  return userInfo || {};
}

export async function getUserPublished(userId) {
  const { data } = await client.get(`/user/${userId}/published`);
  // 后端返回格式: { code: 200, message: "成功", data: [...] }
  const items = data?.data || data;
  const arr = Array.isArray(items) ? items : (items?.items || []);
  return arr.map(normalizeProduct);
}

export async function requestEmailChange({ newEmail }) {
  const { data } = await client.post('/user/me/email/change-request', { newEmail });
  return data;
}

export async function confirmEmailChange({ newEmail, verificationCode }) {
  const { data } = await client.post('/user/me/email/change-confirm', { newEmail, verificationCode });
  return data;
}

export async function changePassword({ currentPassword, newPassword, verificationCode }) {
  const { data } = await client.post('/user/me/password', { currentPassword, newPassword, verificationCode });
  return data;
}

// 关注功能
export async function getFollows() {
  const { data } = await client.get('/user/follows');
  // 后端返回格式: { code: 200, message: "成功", data: [...] }
  const items = data?.data || data;
  return Array.isArray(items) ? items : [];
}

export async function getFollowers() {
  const { data } = await client.get('/user/followers');
  // 后端返回格式: { code: 200, message: "成功", data: [...] }
  const items = data?.data || data;
  return Array.isArray(items) ? items : [];
}

export async function checkIsFollowing(sellerId) {
  const { data } = await client.get(`/user/follows/${sellerId}/check`);
  // 后端返回格式: { code: 200, data: { isFollowing: true } } 或 { isFollowing: true }
  const result = data?.data || data;
  return !!(result?.isFollowing);
}

export async function followUser(sellerId) {
  const { data } = await client.post(`/user/follows/${sellerId}`);
  return data;
}

export async function unfollowUser(sellerId) {
  const { data } = await client.delete(`/user/follows/${sellerId}`);
  return data;
}

export async function searchUsers(params) {
  const { data } = await client.get('/user/search', { params });
  // 后端返回格式: { code: 200, message: "搜索成功", data: { items: [...], total: 10 } }
  const result = data?.data || data;
  return {
    items: result?.items || [],
    total: result?.total || 0
  };
}


// 账号注销
export async function deleteAccount({ verificationCode }) {
  const { data } = await client.post('/user/me/delete', { verificationCode });
  return data;
}
