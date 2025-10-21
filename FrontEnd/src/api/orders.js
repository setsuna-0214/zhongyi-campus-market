import client from './client';

// 获取订单列表
export async function listOrders(params = {}) {
  const { data } = await client.get('/orders', { params });
  return Array.isArray(data) ? data : (data.items || []);
}

// 获取订单统计
export async function getOrderStats() {
  const { data } = await client.get('/orders/stats');
  return data;
}

// 确认收货
export async function confirmReceived(orderId) {
  const { data } = await client.post(`/orders/${orderId}/confirm`);
  return data;
}

// 取消订单
export async function cancelOrder(orderId) {
  const { data } = await client.post(`/orders/${orderId}/cancel`);
  return data;
}

// 提交评价
export async function submitReview(orderId, { rating, comment }) {
  const { data } = await client.post(`/orders/${orderId}/review`, { rating, comment });
  return data;
}