import client from './client';

// 标准化收藏数据，将后端返回的字段映射为前端组件期望的字段
function normalizeFavoriteItem(item) {
  const product = item.product || {};
  return {
    id: item.id,
    productId: item.productId || product.id,
    productName: product.title || item.productName || '商品',
    currentPrice: product.price ?? item.currentPrice ?? 0,
    productImage: product.image || item.productImage || item.coverImage,
    coverImage: product.image || item.coverImage || item.productImage,
    category: product.category || item.category || 'other',
    status: product.status || item.status || '在售',
    isAvailable: product.status ? product.status === '在售' : (item.isAvailable ?? true),
    addTime: item.createdAt || item.addTime,
    location: product.location || item.location || '',
    seller: product.seller || item.seller,
    sellerId: product.sellerId || item.sellerId,
    tags: product.tags || item.tags || [],
    publishedAt: product.publishTime || product.publishedAt || product.createdAt || item.publishedAt,
    sales: product.views ?? item.sales ?? 0,
  };
}

export async function getFavorites() {
  const { data } = await client.get('/favorites');
  const items = Array.isArray(data) ? data : (data.items || []);
  return items.map(normalizeFavoriteItem);
}

export async function addToFavorites(productId) {
  const { data } = await client.post('/favorites', { productId });
  return data;
}

export async function removeFromFavorites(itemId) {
  const { data } = await client.delete(`/favorites/${itemId}`);
  return data;
}

export async function removeFavoriteByProductId(productId) {
  try {
    const { data } = await client.delete(`/favorites/by-product/${productId}`);
    return data;
  } catch {
    return { success: false };
  }
}

