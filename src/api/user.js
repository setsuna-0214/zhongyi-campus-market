import client from './client';

// 获取当前用户信息与汇总数据
export async function getCurrentUser() {
  const { data } = await client.get('/user/me');
  return data;
}

// 更新当前用户信息
export async function updateCurrentUser(payload) {
  const { data } = await client.put('/user/me', payload);
  return data;
}

// 获取当前用户的发布、购买、收藏列表
export async function getUserCollections() {
  const { data } = await client.get('/user/collections');
  return data; // { published: [], purchases: [], favorites: [] }
}

// 上传头像
export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);
  const { data } = await client.post('/user/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data; // { avatarUrl }
}