/**
 * 首页 API - 真实后端实现
 * 调用后端 REST API 获取热门商品和最新商品
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
  const coverImage = item.image || item.coverImage;
  const images = item.images || (coverImage ? [coverImage] : []);
  return {
    ...item,
    image: coverImage,
    images,
  };
}

// 获取热门商品
export async function getHotProducts(page = 1, pageSize = 12) {
  const { data } = await client.get('/home/hot', {
    params: { excludeSold: 'true', page, pageSize }
  });
  const result = extractData(data);
  if (Array.isArray(result)) {
    return { items: result.map(normalizeProduct), hasMore: result.length >= pageSize };
  }
  return {
    items: (result?.items || []).map(normalizeProduct),
    hasMore: result?.hasMore ?? (result?.items?.length >= pageSize),
    total: result?.total
  };
}

// 获取最新商品
export async function getLatestProducts(page = 1, pageSize = 12) {
  const { data } = await client.get('/home/latest', {
    params: { excludeSold: 'true', page, pageSize }
  });
  const result = extractData(data);
  if (Array.isArray(result)) {
    return { items: result.map(normalizeProduct), hasMore: result.length >= pageSize };
  }
  return {
    items: (result?.items || []).map(normalizeProduct),
    hasMore: result?.hasMore ?? (result?.items?.length >= pageSize),
    total: result?.total
  };
}