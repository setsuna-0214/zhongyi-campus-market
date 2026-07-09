/**
 * 订单 API - 真实后端实现
 * 调用后端 REST API 处理订单操作
 */

import client from './client';

// 获取订单列表
export async function listOrders(params = {}) {
  const { data } = await client.get('/orders', { params });
  const rawItems = data?.data || data;
  const items = Array.isArray(rawItems) ? rawItems : (rawItems?.items || []);

  // 规范化订单数据，确保 buyer/seller 字段存在
  return items.map(order => {
    let buyer = order.buyer;
    if (!buyer && order.buyerId) {
      buyer = { id: order.buyerId };
    }
    if (!buyer && order.buyer_id) {
      buyer = { id: order.buyer_id };
    }

    let seller = order.seller;
    if (!seller && order.sellerId) {
      seller = { id: order.sellerId };
    }
    if (!seller && order.seller_id) {
      seller = { id: order.seller_id };
    }
    if (!seller && order.product?.seller) {
      seller = order.product.seller;
    }
    if (!seller && order.product?.sellerId) {
      seller = { id: order.product.sellerId };
    }

    const product = order.product || {};
    const coverImage = product.coverImage || product.image;
    const images = product.images || (coverImage ? [coverImage] : []);

    return {
      ...order,
      buyer,
      seller,
      product: { ...product, images },
    };
  });
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

// 创建订单
export async function createOrder({ productId, quantity = 1, skipDuplicateCheck = false }) {
  // 前端预检查：是否存在同一商品的未完成订单
  if (!skipDuplicateCheck) {
    try {
      const existingOrders = await listOrders();
      const currentUserId = (() => {
        try {
          const raw = localStorage.getItem('authUser');
          if (raw) {
            const user = JSON.parse(raw);
            return user?.id;
          }
        } catch (e) {
          if (import.meta.env.DEV) console.warn('读取当前用户信息失败，将跳过重复下单预检查', e);
        }
        return null;
      })();

      const duplicateOrder = existingOrders.find(o => {
        const orderProductId = o.product?.id || o.productId;
        const buyerId = o.buyer?.id || o.buyerId;
        const isActiveOrder = ['pending', 'pending_seller', 'pending_buyer'].includes(o.status);
        return String(orderProductId) === String(productId) &&
          String(buyerId) === String(currentUserId) &&
          isActiveOrder;
      });

      if (duplicateOrder) {
        throw new Error('您已对该商品下过订单，请勿重复下单');
      }
    } catch (err) {
      if (err.message?.includes('重复下单')) {
        throw err;
      }
    }
  }

  const { data } = await client.post('/orders', { productId, quantity });
  const orderData = data?.data || data;
  return orderData;
}

// 获取订单详情
export async function getOrderDetail(orderId) {
  const { data } = await client.get(`/orders/${orderId}`);
  const orderData = data?.data || data;

  // 规范化订单数据
  let buyer = orderData.buyer;
  if (!buyer && orderData.buyerId) {
    buyer = { id: orderData.buyerId };
  }

  let seller = orderData.seller;
  if (!seller && orderData.sellerId) {
    seller = { id: orderData.sellerId };
  }

  const product = orderData.product || {};
  const coverImage = product.coverImage || product.image;
  const images = product.images || (coverImage ? [coverImage] : []);

  return {
    ...orderData,
    buyer,
    seller,
    product: { ...product, images },
  };
}

// 更新订单状态
export async function updateOrderStatus(orderId, payload) {
  const { data } = await client.patch(`/orders/${orderId}/status`, payload);
  return data;
}

// 上传订单图片
export async function uploadOrderImages(orderId, formData) {
  const { data } = await client.post(`/orders/${orderId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

// 删除订单
export async function deleteOrder(orderId) {
  const { data } = await client.delete(`/orders/${orderId}`);
  return data;
}
