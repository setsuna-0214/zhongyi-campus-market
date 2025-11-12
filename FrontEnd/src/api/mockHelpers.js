import { initialFavorites, mockProducts } from './mockData';
import { resolveImageSrc } from '../utils/images';

function readLocalStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    return JSON.parse(raw);
  } catch (_error) {
    return undefined;
  }
}

function writeLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_error) {
    // ignore quota errors in mock mode
  }
}

export function readMockList(key, fallback = []) {
  const value = readLocalStorage(key);
  return Array.isArray(value) ? value : Array.isArray(fallback) ? fallback : [];
}

export function writeMockList(key, list) {
  if (Array.isArray(list)) {
    writeLocalStorage(key, list);
  }
}

export function normalizeMockFavorite(item) {
  const productId = String(item?.productId || item?.product?.id || '').trim();
  const product = mockProducts.find((p) => String(p.id) === productId);
  const imageSrc = resolveImageSrc({ item, product });
  const currentPrice = item?.currentPrice ?? product?.price ?? 0;
  return {
    ...item,
    productId: productId || item?.productId,
    productName: item?.productName || product?.title || productId || '商品',
    category: item?.category || product?.category || 'other',
    productImage: imageSrc,
    coverImage: item?.coverImage || imageSrc,
    currentPrice,
    publishedAt:
      item?.publishedAt || product?.publishTime || product?.publishedAt || product?.createdAt,
    tags: item?.tags || product?.tags || [],
    seller: item?.seller || product?.seller || { name: '卖家', rating: 4.6 },
    location: item?.location || product?.location || '校园',
    sales:
      typeof item?.sales === 'number'
        ? item.sales
        : Math.max(0, Math.floor((product?.views || 0) / 3)),
    status: item?.status || (item?.isAvailable ? '在售' : '已下架') || product?.status || '在售',
    isAvailable: item?.isAvailable ?? (item?.status ? item.status === '在售' : true),
  };
}

export function normalizeMockPurchase(order) {
  const productId = String(order?.product?.id || order?.productId || '').trim();
  const product = mockProducts.find((p) => String(p.id) === productId);
  const imageSrc = resolveImageSrc({ item: order?.product, product });
  return {
    id: productId || order?.product?.id || order?.id,
    title: order?.product?.title || product?.title || productId || '商品',
    price: order?.product?.price ?? product?.price ?? 0,
    category: order?.product?.category || product?.category || 'other',
    status: order?.product?.status || product?.status || '在售',
    location: order?.product?.location || product?.location || '校园',
    seller: order?.seller || product?.seller || { name: '卖家', rating: 4.6 },
    publishTime: product?.publishTime || product?.publishedAt || product?.createdAt,
    views: product?.views ?? order?.product?.views ?? 0,
    productImage: imageSrc,
    images: product?.images || (order?.product?.coverImage ? [order.product.coverImage] : undefined),
    image: order?.product?.coverImage || imageSrc,
  };
}

export function ensureFavoritesInitialized() {
  if (readLocalStorage('mock_favorites') === undefined) {
    writeMockList('mock_favorites', initialFavorites);
  }
}

export function createMockFavorite(productId) {
  const product = mockProducts.find((p) => String(p.id) === String(productId));
  const imageSrc = resolveImageSrc({ product });
  const now = new Date().toISOString();
  const base = {
    id: `f_${Date.now()}`,
    productId,
    productName: product?.title || String(productId),
    category: product?.category || 'other',
    coverImage: imageSrc,
    productImage: imageSrc,
    currentPrice: product?.price ?? 0,
    addTime: now,
    isAvailable: (product?.status || '在售') === '在售',
    publishedAt: product?.publishTime || product?.publishedAt || product?.createdAt,
    tags: product?.tags || [],
    seller: product?.seller || { name: '卖家', rating: 4.6 },
    location: product?.location || '校园',
    sales: Math.max(0, Math.floor((product?.views || 0) / 3)),
    status: product?.status || '在售',
  };
  return normalizeMockFavorite(base);
}

export function removeFavoriteById(list, favoriteId) {
  return Array.isArray(list) ? list.filter((item) => item.id !== favoriteId) : [];
}

export function removeFavoriteByProduct(list, productId) {
  return Array.isArray(list)
    ? list.filter((item) => String(item.productId) !== String(productId))
    : [];
}

export function upsertFavorite(list, favorite) {
  const normalized = normalizeMockFavorite(favorite);
  const next = Array.isArray(list) ? list.filter((item) => item.productId !== normalized.productId) : [];
  return [normalized, ...next];
}

export function normalizeFavorites(list) {
  return Array.isArray(list) ? list.map(normalizeMockFavorite) : [];
}

export function normalizePurchases(list) {
  return Array.isArray(list) ? list.map(normalizeMockPurchase) : [];
}

export function safeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

const mockHelpers = {
  readMockList,
  writeMockList,
  normalizeMockFavorite,
  normalizeMockPurchase,
  ensureFavoritesInitialized,
  createMockFavorite,
  removeFavoriteById,
  removeFavoriteByProduct,
  upsertFavorite,
  normalizeFavorites,
  normalizePurchases,
  safeNumber,
};

export default mockHelpers;
