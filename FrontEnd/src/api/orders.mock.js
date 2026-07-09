/**
 * 订单 API - Mock 实现
 * 使用 localStorage 模拟订单数据的增删改查
 */

import { ensureMockState, mockProducts, mockUserDebug } from './mockData';
import { readMockList, writeMockList } from './mockHelpers';

// 获取订单列表
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

// 获取订单统计
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

// 确认收货
export async function confirmReceived(orderId) {
  ensureMockState();
  const orders = readMockList('mock_orders').map(o => o.id === orderId ? { ...o, status: 'completed' } : o);
  writeMockList('mock_orders', orders);
  return { success: true };
}

// 取消订单
export async function cancelOrder(orderId) {
  ensureMockState();
  const orders = readMockList('mock_orders');
  const orderToCancel = orders.find(o => o.id === orderId);

  const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o);
  writeMockList('mock_orders', updatedOrders);

  // 取消订单后，将商品状态恢复为"在售"
  if (orderToCancel) {
    const productId = orderToCancel.product?.id || orderToCancel.productId;
    if (productId) {
      const product = mockProducts.find(p => String(p.id) === String(productId));
      if (product) {
        product.status = '在售';
      }
    }
  }

  return { success: true };
}

// 提交评价
export async function submitReview(orderId) {
  ensureMockState();
  const orders = readMockList('mock_orders').map(o => o.id === orderId ? { ...o, hasReviewed: true } : o);
  writeMockList('mock_orders', orders);
  return { success: true };
}

// 创建订单
export async function createOrder({ productId, quantity = 1 }) {
  ensureMockState();
  const orders = readMockList('mock_orders');

  // 检查是否存在同一商品的未完成订单
  const existingOrder = orders.find(o => {
    const orderProductId = o.product?.id || o.productId;
    const buyerId = o.buyer?.id || o.buyerId;
    const isActiveOrder = o.status === 'pending' || o.status === 'pending_seller' || o.status === 'pending_buyer';
    return String(orderProductId) === String(productId) &&
      String(buyerId) === String(mockUserDebug.id) &&
      isActiveOrder;
  });

  if (existingOrder) {
    throw new Error('您已对该商品下过订单，请勿重复下单');
  }

  const product = mockProducts.find(p => String(p.id) === String(productId));
  const now = new Date().toISOString();
  const newOrder = {
    id: `o${Date.now()}`,
    status: 'pending',
    hasReviewed: false,
    orderTime: now,
    product: {
      id: product?.id || productId,
      title: product?.title || '商品',
      coverImage: Array.isArray(product?.images) ? product.images[0] : product?.coverImage,
      images: product?.images || [],
      price: product?.price ?? 0,
      quantity,
      category: product?.category,
      location: product?.location
    },
    seller: product?.seller || { id: 'seller', nickname: '卖家' },
    buyer: { id: mockUserDebug.id, nickname: mockUserDebug.nickname || '我' }
  };
  const next = [newOrder, ...orders];
  writeMockList('mock_orders', next);

  // 创建订单成功后，将商品状态更新为"已售出"
  if (product) {
    product.status = '已售出';
  }

  return newOrder;
}

// 获取订单详情
export async function getOrderDetail(orderId) {
  ensureMockState();
  const orders = readMockList('mock_orders');
  const order = orders.find(o => String(o.id) === String(orderId));
  if (!order) throw new Error('订单不存在');
  return order;
}

// 更新订单状态
export async function updateOrderStatus(orderId, data) {
  ensureMockState();
  const orders = readMockList('mock_orders');
  const index = orders.findIndex(o => String(o.id) === String(orderId));
  if (index === -1) throw new Error('订单不存在');

  const updated = {
    ...orders[index],
    status: data.status || orders[index].status,
    sellerMessage: data.sellerMessage || orders[index].sellerMessage,
    sellerImages: data.sellerImages || orders[index].sellerImages
  };
  orders[index] = updated;
  writeMockList('mock_orders', orders);
  return { code: 200, message: '更新成功', data: updated };
}

// 上传订单图片
export async function uploadOrderImages(_orderId, _formData) {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { code: 200, url: `/images/products/product-${Date.now()}.jpg` };
}

// 删除订单
export async function deleteOrder(orderId) {
  ensureMockState();
  const orders = readMockList('mock_orders');
  const order = orders.find(o => String(o.id) === String(orderId));
  if (!order) throw new Error('订单不存在');
  if (order.status !== 'cancelled') throw new Error('只能删除已取消的订单');
  const filtered = orders.filter(o => String(o.id) !== String(orderId));
  writeMockList('mock_orders', filtered);
  return { success: true };
}
