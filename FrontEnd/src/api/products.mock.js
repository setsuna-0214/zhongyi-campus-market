import { mockProducts } from './mockData';
import { getStatusLabel } from '../utils/labels';

export async function searchProducts({ keyword, category, priceRange, location, sortBy, status, page = 1, pageSize = 12 }) {
  let items = [...mockProducts];
  
  // 默认过滤掉已售出的商品（除非明确搜索已售出）
  const normalizeStatus = (p) => p.status || p.saleStatus || p.state || '';
  if (status !== '已售出') {
    items = items.filter(p => getStatusLabel(normalizeStatus(p)) !== '已售出');
  }
  
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    items = items.filter(p => (p.title || '').toLowerCase().includes(kw) || (p.description || '').toLowerCase().includes(kw));
  }
  if (category) {
    items = items.filter(p => p.category === category);
  }
  if (location) {
    items = items.filter(p => (p.location || '').includes(location));
  }
  if (status && status !== '全部') {
    items = items.filter(p => getStatusLabel(normalizeStatus(p)) === status);
  }
  if (Array.isArray(priceRange) && priceRange.length === 2) {
    const [min, max] = priceRange;
    items = items.filter(p => p.price >= min && p.price <= max);
  }
  switch (sortBy) {
    case 'price-low':
      items.sort((a, b) => a.price - b.price); break;
    case 'price-high':
      items.sort((a, b) => b.price - a.price); break;
    case 'popular':
      items.sort((a, b) => (b.views || 0) - (a.views || 0)); break;
    case 'latest':
    default:
      items.sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime));
  }
  const total = items.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return { items: items.slice(start, end), total };
}

export async function getProduct(id) {
  const found = mockProducts.find(p => p.id === id) || mockProducts[0];
  return { ...found, status: found.status || found.saleStatus || found.state || '在售' };
}

export async function getRelatedProducts(id) {
  const base = mockProducts.find(p => p.id === id);
  const sameCategory = mockProducts.filter(p => !base || (p.category === base.category && p.id !== id));
  return sameCategory.slice(0, 4);
}

export async function createProduct(_formData) {
  // Mock: 模拟创建商品，返回假的商品ID
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { code: 200, message: '商品发布成功', data: 'mock-product-id' };
}

export async function updateProduct(id, _formData) {
  // Mock: 模拟更新商品
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { code: 200, message: '商品更新成功', data: { id } };
}

export async function updateProductStatus(id, status) {
  // Mock: 模拟更新商品状态
  await new Promise(resolve => setTimeout(resolve, 500));
  // 在mock数据中更新状态（仅影响当前会话）
  const product = mockProducts.find(p => p.id === id);
  if (product) {
    product.status = status;
  }
  return { code: 200, message: status === '在售' ? '商品已重新上架' : '商品已下架', data: { id, status } };
}

