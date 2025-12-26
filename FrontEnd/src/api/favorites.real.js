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

// 标准化收藏数据，将后端返回的字段映射为前端组件期望的字段
function normalizeFavoriteItem(item) {
  const product = item.product || {};
  
  // 处理卖家信息 - 支持多种后端返回格式
  let seller = product.seller || item.seller;
  if (!seller && (product.sellerId || item.sellerId)) {
    seller = { id: product.sellerId || item.sellerId };
  }
  // 如果 seller 是字符串（卖家名称），转换为对象
  if (typeof seller === 'string') {
    seller = { nickname: seller };
  }
  
  // 提取卖家名称
  const sellerName = seller?.nickname || seller?.username || seller?.name || product.sellerName || item.sellerName || '';
  
  // 处理图片数组
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

export async function getFavorites() {
  const { data } = await client.get('/favorites');
  const result = extractData(data);
  const items = Array.isArray(result) ? result : (result?.items || []);
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