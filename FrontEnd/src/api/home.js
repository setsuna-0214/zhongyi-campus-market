import client from './client';

// 获取首页统计数据（总商品数、用户数、交易数、金额、分类计数等）
export async function getHomeStats() {
  const { data } = await client.get('/home/stats');
  return data;
}

// 获取首页热门商品列表
export async function getHotProducts() {
  const { data } = await client.get('/home/hot');
  return Array.isArray(data) ? data : (data.items || []);
}

// 获取首页最新发布商品列表
export async function getLatestProducts() {
  const { data } = await client.get('/home/latest');
  return Array.isArray(data) ? data : (data.items || []);
}