/**
 * 收藏 API - 真实后端实现
 * 调用后端 REST API 处理收藏操作
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

// 标准化收藏数据
function normalizeFavoriteItem(item) {
  const product = item.product || {};

  let seller = product.seller || item.seller;
  if (!seller && (product.sellerId || item.sellerId)) {
    seller = { id: product.sellerId || item.sellerId };
  }
  if (typeof seller === 'string') {
    seller = { nickname: seller };
  }

  const sellerName = seller?.nickname || seller?.username || seller?.name || product.sellerName || item.sellerName || '';
  const coverImage = product.image || item.productImage || item.coverImage;
  const images = product.images || item.images || (coverImage ? [coverImage] : []);

  return {
    id: item.id,
    productId: item.productId || product.id,
    productName: product.title || item.productName || '商品',
    currentPrice: product.price ?? item.currentPrice ?? 0,
    productImage: coverImage,
    coverImage: coverImage,
    images: images,
    category: product.category || item.category || 'other',
    status: product.status || item.status || '在售',
    isAvailable: product.status ? product.status === '在售' : (item.isAvailable ?? true),
    addTime: item.createdAt || item.addTime,
    location: product.location || item.location || '',
    seller: seller,
    sellerId: seller?.id || product.sellerId || item.sellerId,
    sellerName: sellerName,
    tags: product.tags || item.tags || [],
    publishedAt: product.publishTime || product.publishedAt || product.createdAt || item.publishedAt,
    sales: product.views ?? item.sales ?? 0,
  };
}

// 获取收藏列表
export async function getFavorites() {
  const { data } = await client.get('/favorites');
  const result = extractData(data);
  const items = Array.isArray(result) ? result : (result?.items || []);
  return items.map(normalizeFavoriteItem);
}

// 添加收藏
export async function addToFavorites(productId) {
  const { data } = await client.post('/favorites', { productId });
  return data;
}

// 根据收藏 ID 移除
export async function removeFromFavorites(itemId) {
  const { data } = await client.delete(`/favorites/${itemId}`);
  return data;
}

// 根据商品 ID 移除收藏
export async function removeFavoriteByProductId(productId) {
  try {
    const { data } = await client.delete(`/favorites/by-product/${productId}`);
    return data;
  } catch {
    return { success: false };
  }
}