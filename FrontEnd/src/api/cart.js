import client from './client';

export async function addToCart(productId, quantity = 1) {
  const { data } = await client.post('/cart', { productId, quantity });
  return data;
}

export async function batchAddToCart(items) {
  // items: [{ productId, quantity }]
  const { data } = await client.post('/cart/batch', { items });
  return data;
}