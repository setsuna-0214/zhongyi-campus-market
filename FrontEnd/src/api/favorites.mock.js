/**
 * 收藏 API - Mock 实现
 * 使用 localStorage 模拟收藏数据的增删查
 */

import { ensureMockState } from './mockData';
import {
  createMockFavorite,
  ensureFavoritesInitialized,
  normalizeFavorites,
  readMockList,
  removeFavoriteById,
  removeFavoriteByProduct,
  upsertFavorite,
  writeMockList,
} from './mockHelpers';

// 获取收藏列表
export async function getFavorites() {
  ensureMockState();
  ensureFavoritesInitialized();
  const items = readMockList('mock_favorites');
  return normalizeFavorites(items);
}

// 添加收藏
export async function addToFavorites(productId) {
  ensureMockState();
  ensureFavoritesInitialized();
  const existing = readMockList('mock_favorites').find((item) => String(item.productId) === String(productId));
  if (existing) {
    return normalizeFavorites([existing])[0];
  }
  const next = upsertFavorite(readMockList('mock_favorites'), createMockFavorite(productId));
  writeMockList('mock_favorites', next);
  return next[0];
}

// 根据收藏 ID 移除
export async function removeFromFavorites(itemId) {
  ensureMockState();
  ensureFavoritesInitialized();
  const remaining = removeFavoriteById(readMockList('mock_favorites'), itemId);
  writeMockList('mock_favorites', remaining);
  return { success: true };
}

// 根据商品 ID 移除收藏
export async function removeFavoriteByProductId(productId) {
  ensureMockState();
  ensureFavoritesInitialized();
  const items = readMockList('mock_favorites');
  if (!items.some((i) => String(i.productId) === String(productId))) {
    return { success: true };
  }
  writeMockList('mock_favorites', removeFavoriteByProduct(items, productId));
  return { success: true };
}
