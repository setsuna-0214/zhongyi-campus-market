import client from './client';
import { isMockEnabled } from './mockData';

export async function addToCart(productId, quantity = 1) {
  if (isMockEnabled()) {
    return { success: true };
  }
  const { data } = await client.post('/cart', { productId, quantity });
  return data;
}

export async function batchAddToCart(items) {
  // items: [{ productId, quantity }]
  if (isMockEnabled()) {
    return { success: true, count: Array.isArray(items) ? items.length : 0 };
  }
  const { data } = await client.post('/cart/batch', { items });
  return data;
}