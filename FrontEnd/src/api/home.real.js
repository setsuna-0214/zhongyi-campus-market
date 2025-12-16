import client from './client';

export async function getHotProducts() {
  // 排除已售出商品
  const { data } = await client.get('/home/hot', { params: { excludeSold: 'true' } });
  return Array.isArray(data) ? data : (data.items || []);
}

export async function getLatestProducts() {
  // 排除已售出商品
  const { data } = await client.get('/home/latest', { params: { excludeSold: 'true' } });
  return Array.isArray(data) ? data : (data.items || []);
}

