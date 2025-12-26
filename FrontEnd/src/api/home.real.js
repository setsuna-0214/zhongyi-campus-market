import client from './client';

/**
 * 从后端 Result 对象中提取数据
 * 后端返回格式: { code: 200, message: "success", data: ... }
 */
function extractData(response) {
  const data = response;
  // 如果是 Result 包装对象，提取 data 字段
  if (data && typeof data === 'object' && 'code' in data && 'data' in data) {
    return data.data;
  }
  return data;
}

// 标准化商品数据，确保字段一致
function normalizeProduct(item) {
  const coverImage = item.image || item.coverImage;
  const images = item.images || (coverImage ? [coverImage] : []);
  return {
    ...item,
    image: coverImage,
    images,
  };
}

export async function getHotProducts(page = 1, pageSize = 12) {
  // 排除已售出商品，支持分页
  const { data } = await client.get('/home/hot', { 
    params: { excludeSold: 'true', page, pageSize } 
  });
  const result = extractData(data);
  // 兼容不同返回格式
  if (Array.isArray(result)) {
    return { items: result.map(normalizeProduct), hasMore: result.length >= pageSize };
  }
  return { 
    items: (result?.items || []).map(normalizeProduct), 
    hasMore: result?.hasMore ?? (result?.items?.length >= pageSize),
    total: result?.total
  };
}

export async function getLatestProducts(page = 1, pageSize = 12) {
  // 排除已售出商品，支持分页
  const { data } = await client.get('/home/latest', { 
    params: { excludeSold: 'true', page, pageSize } 
  });
  const result = extractData(data);
  // 兼容不同返回格式
  if (Array.isArray(result)) {
    return { items: result.map(normalizeProduct), hasMore: result.length >= pageSize };
  }
  return { 
    items: (result?.items || []).map(normalizeProduct), 
    hasMore: result?.hasMore ?? (result?.items?.length >= pageSize),
    total: result?.total
  };
}