import client from './client';

// 搜索商品列表
export async function searchProducts({ keyword, category, condition, priceRange, location, sortBy, page = 1, pageSize = 12 }) {
  const params = {
    keyword: keyword || undefined,
    category: category || undefined,
    condition: condition || undefined,
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
  // 兼容后端返回两种形态：{items,total} 或直接返回数组
  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }
  return { items: data.items || [], total: data.total || 0 };
}

// 获取商品详情
export async function getProduct(id) {
  const { data } = await client.get(`/products/${id}`);
  return data;
}

// 获取关联商品
export async function getRelatedProducts(id) {
  const { data } = await client.get(`/products/${id}/related`);
  return Array.isArray(data) ? data : (data.items || []);
}