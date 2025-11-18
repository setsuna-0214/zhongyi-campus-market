import client from './client';

export async function listOrders(params = {}) {
  const { data } = await client.get('/orders', { params });
  return Array.isArray(data) ? data : (data.items || []);
}

export async function getOrderStats() {
  const { data } = await client.get('/orders/stats');
  return data;
}

export async function confirmReceived(orderId) {
  const { data } = await client.post(`/orders/${orderId}/confirm`);
  return data;
}

export async function cancelOrder(orderId) {
  const { data } = await client.post(`/orders/${orderId}/cancel`);
  return data;
}

export async function submitReview(orderId, { rating, comment }) {
  const { data } = await client.post(`/orders/${orderId}/review`, { rating, comment });
  return data;
}

export async function createOrder({ productId, quantity = 1 }) {
  const { data } = await client.post('/orders', { productId, quantity });
  return data;
}

