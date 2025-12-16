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
  return data;
}

export async function getMyPublished() {
  const { data } = await client.get('/user/published');
  // 后端返回格式: { code: 200, message: "成功", data: [...] }
  const items = data?.data || data;
  return Array.isArray(items) ? items : (items?.items || []);
}

export async function getMyPurchases() {
  const { data } = await client.get('/user/purchases');
  // 后端返回格式: { code: 200, message: "成功", data: [...] }
  const items = data?.data || data;
  return Array.isArray(items) ? items : (items?.items || []);
}

export async function getUser(id) {
  const { data } = await client.get(`/users/${id}`);
  return data;
}

export async function getUserPublished(userId) {
  const { data } = await client.get(`/users/${userId}/published`);
  return Array.isArray(data) ? data : (data.items || []);
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

export async function checkIsFollowing(sellerId) {
  const { data } = await client.get(`/user/follows/${sellerId}/check`);
  return !!data.isFollowing;
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
  const { data } = await client.get('/users/search', { params });
  // 后端返回格式: { code: 200, message: "搜索成功", data: { items: [...], total: 10 } }
  const result = data?.data || data;
  return {
    items: result?.items || [],
    total: result?.total || 0
  };
}