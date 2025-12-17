import client from './client';

export async function listOrders(params = {}) {
  const { data } = await client.get('/orders', { params });
  // 后端返回格式: { code: 200, message: "成功", data: [...] } 或直接返回数组
  const rawItems = data?.data || data;
  const items = Array.isArray(rawItems) ? rawItems : (rawItems?.items || []);
  
  // 规范化订单数据，确保 buyer/seller 字段存在
  return items.map(order => {
    // 处理 buyer 信息 - 支持多种后端返回格式
    let buyer = order.buyer;
    if (!buyer && order.buyerId) {
      buyer = { id: order.buyerId };
    }
    if (!buyer && order.buyer_id) {
      buyer = { id: order.buyer_id };
    }
    
    // 处理 seller 信息 - 支持多种后端返回格式
    let seller = order.seller;
    if (!seller && order.sellerId) {
      seller = { id: order.sellerId };
    }
    if (!seller && order.seller_id) {
      seller = { id: order.seller_id };
    }
    // 如果 seller 信息在 product 中
    if (!seller && order.product?.seller) {
      seller = order.product.seller;
    }
    if (!seller && order.product?.sellerId) {
      seller = { id: order.product.sellerId };
    }
    
    return {
      ...order,
      buyer,
      seller,
    };
  });
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
        } catch {}
        return null;
      })();
      
      const duplicateOrder = existingOrders.find(o => {
        const orderProductId = o.product?.id || o.productId;
        const buyerId = o.buyer?.id || o.buyerId;
        // 检查未完成状态的订单（待卖家处理、待买家确认）
        const isActiveOrder = ['pending', 'pending_seller', 'pending_buyer'].includes(o.status);
        return String(orderProductId) === String(productId) && 
               String(buyerId) === String(currentUserId) && 
               isActiveOrder;
      });
      
      if (duplicateOrder) {
        throw new Error('您已对该商品下过订单，请勿重复下单');
      }
    } catch (err) {
      // 如果是重复订单错误，直接抛出；其他错误（如网络问题）则忽略，让后端处理
      if (err.message?.includes('重复下单')) {
        throw err;
      }
    }
  }
  
  const { data } = await client.post('/orders', { productId, quantity });
  return data;
}


export async function getOrderDetail(orderId) {
  const { data } = await client.get(`/orders/${orderId}`);
  // 后端返回格式: { code: 200, message: "成功", data: {...} }
  const orderData = data?.data || data;
  
  // 规范化订单数据，确保 buyer/seller 字段存在
  let buyer = orderData.buyer;
  if (!buyer && orderData.buyerId) {
    buyer = { id: orderData.buyerId };
  }
  
  let seller = orderData.seller;
  if (!seller && orderData.sellerId) {
    seller = { id: orderData.sellerId };
  }
  
  return {
    ...orderData,
    buyer,
    seller,
  };
}

export async function updateOrderStatus(orderId, payload) {
  const { data } = await client.patch(`/orders/${orderId}/status`, payload);
  return data;
}

export async function uploadOrderImages(orderId, formData) {
  const { data } = await client.post(`/orders/${orderId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function deleteOrder(orderId) {
  const { data } = await client.delete(`/orders/${orderId}`);
  return data;
}
