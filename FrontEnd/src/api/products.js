import client from './client';
import { mockProducts, isMockEnabled } from './mockData';

// 搜索商品列表
export async function searchProducts({ keyword, category, priceRange, location, sortBy, page = 1, pageSize = 12 }) {
  if (isMockEnabled()) {
    let items = [...mockProducts];
    // 过滤
    if (keyword) {
      const kw = String(keyword).toLowerCase();
      items = items.filter(p => p.title.toLowerCase().includes(kw) || p.description.toLowerCase().includes(kw));
    }
    if (category) {
      items = items.filter(p => p.category === category);
    }
    // 成色筛选已移除
    if (location) {
      items = items.filter(p => (p.location || '').includes(location));
    }
    if (Array.isArray(priceRange) && priceRange.length === 2) {
      const [min, max] = priceRange;
      items = items.filter(p => p.price >= min && p.price <= max);
    }
    // 排序
    switch (sortBy) {
      case 'price-low':
        items.sort((a, b) => a.price - b.price); break;
      case 'price-high':
        items.sort((a, b) => b.price - a.price); break;
      case 'popular':
        items.sort((a, b) => b.views - a.views); break;
      case 'latest':
      default:
        items.sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime));
    }
    // 分页
    const total = items.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return { items: items.slice(start, end), total };
  }
  const params = {
    keyword: keyword || undefined,
    category: category || undefined,
    location: location || undefined,
    sort: sortBy || undefined,
    page,
    pageSize,
  };
  if (Array.isArray(priceRange) && priceRange.length === 2) {
    params.priceMin = priceRange[0];
    params.priceMax = priceRange[1];
  }
  const { data } = await client.get('/products', { params });
  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }
  return { items: data.items || [], total: data.total || 0 };
}

// 获取商品详情
export async function getProduct(id) {
  if (isMockEnabled()) {
    const found = mockProducts.find(p => p.id === id) || mockProducts[0];
    // 规范化字段，仅保留状态映射
    return {
      ...found,
      status: found.status || found.saleStatus || found.state || '在售'
    };
  }
  const { data } = await client.get(`/products/${id}`);
  // 规范化后端可能使用的不同字段名
  const normalized = { ...data };
  if (normalized.status == null && normalized.saleStatus != null) {
    normalized.status = normalized.saleStatus;
  }
  return normalized;
}

// 获取关联商品
export async function getRelatedProducts(id) {
  if (isMockEnabled()) {
    const base = mockProducts.find(p => p.id === id);
    const sameCategory = mockProducts.filter(p => !base || (p.category === base.category && p.id !== id));
    return sameCategory.slice(0, 4);
  }
  const { data } = await client.get(`/products/${id}/related`);
  return Array.isArray(data) ? data : (data.items || []);
}