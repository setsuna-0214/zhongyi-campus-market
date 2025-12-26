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

export async function searchProducts({ keyword, category, priceRange, location, sortBy, status, page = 1, pageSize = 12 }) {
  const params = {
    keyword: keyword || undefined,
    category: category || undefined,
    location: location || undefined,
    sort: sortBy || undefined,
    status: status || undefined,
    // 默认排除已售出商品（除非明确搜索已售出）
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

export async function getProduct(id) {
  const { data } = await client.get(`/products/${id}`);
  const result = extractData(data);
  return normalizeProduct(result);
}

export async function getRelatedProducts(id) {
  const { data } = await client.get(`/products/${id}/related`);
  const result = extractData(data);
  const items = Array.isArray(result) ? result : (result?.items || []);
  return items.map(normalizeProduct);
}

export async function createProduct(formData) {
  const { data } = await client.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function updateProduct(id, formData) {
  const { data } = await client.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function updateProductStatus(id, status) {
  const { data } = await client.patch(`/products/${id}/status`, { status });
  return data;
}