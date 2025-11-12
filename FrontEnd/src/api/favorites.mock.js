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

export async function getFavorites() {
  ensureMockState();
  ensureFavoritesInitialized();
  const items = readMockList('mock_favorites');
  return normalizeFavorites(items);
}

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

export async function removeFromFavorites(itemId) {
  ensureMockState();
  ensureFavoritesInitialized();
  const remaining = removeFavoriteById(readMockList('mock_favorites'), itemId);
  writeMockList('mock_favorites', remaining);
  return { success: true };
}

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

