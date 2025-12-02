import client from './client';

export async function getCurrentUser() {
  const { data } = await client.get('/user/me');
  const normalized = { ...(data || {}) };
  delete normalized.adress;
  delete normalized.location;
  if ('verified' in normalized) delete normalized.verified;
  return normalized;
}

export async function updateCurrentUser(payload) {
  const { data } = await client.put('/user/me', payload);
  const normalized = { ...(data || {}) };
  if ('verified' in normalized) delete normalized.verified;
  if ('adress' in normalized) delete normalized.adress;
  if ('location' in normalized) delete normalized.location;
  return normalized;
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
  return Array.isArray(data) ? data : (data.items || []);
}

export async function getMyPurchases() {
  const { data } = await client.get('/user/purchases');
  return Array.isArray(data) ? data : (data.items || []);
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

// 关注功能 (API 假设)
export async function getFollows() {
  const { data } = await client.get('/user/follows');
  return Array.isArray(data) ? data : [];
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
  return data;
}