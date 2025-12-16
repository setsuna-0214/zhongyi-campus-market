import client from './client';

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
  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }
  return { items: data.items || [], total: data.total || 0 };
}

export async function getProduct(id) {
  const { data } = await client.get(`/products/${id}`);
  const normalized = { ...data };
  if (normalized.status == null && normalized.saleStatus != null) {
    normalized.status = normalized.saleStatus;
  }
  return normalized;
}

export async function getRelatedProducts(id) {
  const { data } = await client.get(`/products/${id}/related`);
  return Array.isArray(data) ? data : (data.items || []);
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

