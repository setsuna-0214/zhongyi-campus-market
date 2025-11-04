import client from './client';
import { mockHomeStats, mockProducts, isMockEnabled } from './mockData';

// 获取首页统计数据（总商品数、用户数、交易数、金额、分类计数等）
export async function getHomeStats() {
  if (isMockEnabled()) {
    // 映射为页面期望的字段名
    const { totalProducts, totalUsers, totalDeals, transactionAmount, categoryCounts, topSellers } = mockHomeStats;
    const sellers = (topSellers || []).map(s => ({
      name: s.name,
      avatar: s.avatar,
      badge: '金牌卖家',
      sales: s.dealCount,
      rating: s.rating
    }));
    return {
      totalProducts,
      totalUsers,
      totalTransactions: totalDeals,
      totalAmount: transactionAmount,
      categoryCounts,
      topSellers: sellers
    };
  }
  const { data } = await client.get('/home/stats');
  return data;
}

// 获取首页热门商品列表
export async function getHotProducts() {
  if (isMockEnabled()) {
    // 按浏览量排序作为热门
    const hot = [...mockProducts].sort((a, b) => b.views - a.views).slice(0, 12).map(p => ({
      id: p.id,
      title: p.title,
      image: p.images?.[0] || '/images/products/product-1.svg',
      views: p.views,
      price: p.price,
      publishedAt: new Date(p.publishTime).toLocaleDateString(),
      seller: p.seller?.name || '卖家',
      location: p.location,
      category: p.category,
      status: p.status || '在售'
    }));
    return hot;
  }
  const { data } = await client.get('/home/hot');
  return Array.isArray(data) ? data : (data.items || []);
}

// 获取首页最新发布商品列表
export async function getLatestProducts() {
  if (isMockEnabled()) {
    const latest = [...mockProducts]
      .sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime))
      .slice(0, 12)
      .map(p => ({
        id: p.id,
        title: p.title,
        image: p.images?.[0] || '/images/products/product-1.svg',
        publishTime: p.publishTime,
        price: p.price,
        publishedAt: new Date(p.publishTime).toLocaleDateString(),
        seller: p.seller?.name || '卖家',
        location: p.location,
        category: p.category,
        status: p.status || '在售'
      }));
    return latest;
  }
  const { data } = await client.get('/home/latest');
  return Array.isArray(data) ? data : (data.items || []);
}