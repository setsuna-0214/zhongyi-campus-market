import client from './client';

// 获取心愿单列表
export async function getWishlist() {
  const { data } = await client.get('/wishlist');
  return Array.isArray(data) ? data : (data.items || []);
}

// 添加到心愿单
export async function addToWishlist(productId) {
  const { data } = await client.post('/wishlist', { productId });
  return data;
}

// 从心愿单移除
export async function removeFromWishlist(itemId) {
  const { data } = await client.delete(`/wishlist/${itemId}`);
  return data;
}