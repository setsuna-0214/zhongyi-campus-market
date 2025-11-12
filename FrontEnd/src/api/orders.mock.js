import { ensureMockState } from './mockData';
import { readMockList, writeMockList } from './mockHelpers';

export async function listOrders(params = {}) {
  ensureMockState();
  const orders = readMockList('mock_orders');
  const { status, keyword, startDate, endDate } = params || {};
  let filtered = [...orders];
  if (status) filtered = filtered.filter(o => o.status === status);
  if (keyword) filtered = filtered.filter(o => (o.product?.title || '').toLowerCase().includes(String(keyword).toLowerCase()));
  if (startDate) filtered = filtered.filter(o => new Date(o.orderTime) >= new Date(startDate));
  if (endDate) filtered = filtered.filter(o => new Date(o.orderTime) <= new Date(endDate));
  return filtered;
}

export async function getOrderStats() {
  ensureMockState();
  const orders = readMockList('mock_orders');
  return {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };
}

export async function confirmReceived(orderId) {
  ensureMockState();
  const orders = readMockList('mock_orders').map(o => o.id === orderId ? { ...o, status: 'completed' } : o);
  writeMockList('mock_orders', orders);
  return { success: true };
}

export async function cancelOrder(orderId) {
  ensureMockState();
  const orders = readMockList('mock_orders').map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o);
  writeMockList('mock_orders', orders);
  return { success: true };
}

export async function submitReview(orderId) {
  ensureMockState();
  const orders = readMockList('mock_orders').map(o => o.id === orderId ? { ...o, hasReviewed: true } : o);
  writeMockList('mock_orders', orders);
  return { success: true };
}

