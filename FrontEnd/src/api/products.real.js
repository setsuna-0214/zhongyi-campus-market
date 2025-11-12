import client from './client';

export async function searchProducts({ keyword, category, priceRange, location, sortBy, status, page = 1, pageSize = 12 }) {
  const params = {
    keyword: keyword || undefined,
    category: category || undefined,
    location: location || undefined,
    sort: sortBy || undefined,
    status: status || undefined,
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

