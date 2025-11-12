import client from './client';

export async function getFavorites() {
  const { data } = await client.get('/favorites');
  return Array.isArray(data) ? data : (data.items || []);
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

