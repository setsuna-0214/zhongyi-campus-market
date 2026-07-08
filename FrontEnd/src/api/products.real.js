/**
 * 商品 API - 真实后端实现
 * 调用后端 REST API 处理商品操作
 */

import client from './client';

// 从 Result 对象中提取数据
function extractData(response) {
  const data = response;
  if (data && typeof data === 'object' && 'code' in data && 'data' in data) {
    return data.data;
  }
  return data;
}

// 标准化商品数据
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

// 搜索商品
export async function searchProducts({ keyword, category, priceRange, location, sortBy, status, page = 1, pageSize = 12 }) {
  const params = {
    keyword: keyword || undefined,
    category: category || undefined,
    location: location || undefined,
    sort: sortBy || undefined,
    status: status || undefined,
    excludeSold: status !== '已售出' ? 'true' : undefined,
    page,
    pageSize,
  };
  if (Array.isArray(priceRange) && priceRange.length === 2) {
    params.priceMin = priceRange[0];
    params.priceMax = priceRange[1];
  }
  const { data } = await client.get('/products', { params });
  const result = extractData(data);
  if (Array.isArray(result)) {
    return { items: result.map(normalizeProduct), total: result.length };
  }
  return { items: (result?.items || []).map(normalizeProduct), total: result?.total || 0 };
}

// 获取商品详情
export async function getProduct(id) {
  const { data } = await client.get(`/products/${id}`);
  const result = extractData(data);
  return normalizeProduct(result);
}

// 获取相关商品
export async function getRelatedProducts(id) {
  const { data } = await client.get(`/products/${id}/related`);
  const result = extractData(data);
  const items = Array.isArray(result) ? result : (result?.items || []);
  return items.map(normalizeProduct);
}

// 获取与当前商品相关的求购信息
export async function getRelatedWants(id) {
  const { data } = await client.get(`/products/${id}/related-wants`);
  return extractData(data);
}

// 发布商品
export async function createProduct(formData) {
  const { data } = await client.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

// 更新商品
export async function updateProduct(id, formData) {
  const { data } = await client.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

// 更新商品状态
export async function updateProductStatus(id, status) {
  const { data } = await client.patch(`/products/${id}/status`, { status });
  return data;
}