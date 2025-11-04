import client from './client';
import { initialOrders, ensureMockState, isMockEnabled } from './mockData';

// 获取订单列表
export async function listOrders(params = {}) {
  if (isMockEnabled()) {
    ensureMockState();
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem('mock_orders') || '[]'); } catch {}
    const { status, keyword, startDate, endDate } = params || {};
    let filtered = [...orders];
    if (status) filtered = filtered.filter(o => o.status === status);
    if (keyword) filtered = filtered.filter(o => (o.product?.title || '').toLowerCase().includes(String(keyword).toLowerCase()));
    if (startDate) filtered = filtered.filter(o => new Date(o.orderTime) >= new Date(startDate));
    if (endDate) filtered = filtered.filter(o => new Date(o.orderTime) <= new Date(endDate));
    return filtered;
  }
  const { data } = await client.get('/orders', { params });
  return Array.isArray(data) ? data : (data.items || []);
}

// 获取订单统计
export async function getOrderStats() {
  if (isMockEnabled()) {
    ensureMockState();
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem('mock_orders') || '[]'); } catch {}
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };
  }
  const { data } = await client.get('/orders/stats');
  return data;
}

// 确认收货
export async function confirmReceived(orderId) {
  if (isMockEnabled()) {
    ensureMockState();
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem('mock_orders') || '[]'); } catch {}
    orders = orders.map(o => o.id === orderId ? { ...o, status: 'completed' } : o);
    try { localStorage.setItem('mock_orders', JSON.stringify(orders)); } catch {}
    return { success: true };
  }
  const { data } = await client.post(`/orders/${orderId}/confirm`);
  return data;
}

// 取消订单
export async function cancelOrder(orderId) {
  if (isMockEnabled()) {
    ensureMockState();
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem('mock_orders') || '[]'); } catch {}
    orders = orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o);
    try { localStorage.setItem('mock_orders', JSON.stringify(orders)); } catch {}
    return { success: true };
  }
  const { data } = await client.post(`/orders/${orderId}/cancel`);
  return data;
}

// 提交评价
export async function submitReview(orderId, { rating, comment }) {
  if (isMockEnabled()) {
    ensureMockState();
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem('mock_orders') || '[]'); } catch {}
    orders = orders.map(o => o.id === orderId ? { ...o, hasReviewed: true } : o);
    try { localStorage.setItem('mock_orders', JSON.stringify(orders)); } catch {}
    return { success: true };
  }
  const { data } = await client.post(`/orders/${orderId}/review`, { rating, comment });
  return data;
}