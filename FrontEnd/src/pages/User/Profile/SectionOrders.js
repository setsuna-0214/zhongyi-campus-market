import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, List, Empty, message } from 'antd';
import ProductCard from '../../../components/ProductCard';
import OrderTabRow from '../../../components/OrderTabRow';
import { resolveImageSrc } from '../../../utils/images';
import { listOrders, deleteOrder } from '../../../api/orders';
import { 
  ORDER_STATUS, 
  normalizeOrderStatus, 
  getOrderStatusText 
} from '../../../utils/labels';

export default function SectionOrders({ 
  userInfo, 
  onNavigate, 
  orderType = 'purchase',
  orderStatus = 'pending',
  onOrderTypeChange,
  onOrderStatusChange
}) {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const myId = useMemo(() => userInfo?.id || userInfo?._id || userInfo?.userId || userInfo?.user_id || userInfo?.user_Id, [userInfo]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const list = await listOrders();
        // 调试日志：查看订单数据结构
        if (import.meta.env.DEV) {
          console.log('[SectionOrders] 获取到订单列表:', list);
          console.log('[SectionOrders] 当前用户ID:', myId);
        }
        if (mounted) setOrders(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('[SectionOrders] 获取订单失败:', err);
        message.error(err?.message || '获取订单失败');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [myId]);

  // 去重函数：针对同一商品的多个订单，只保留时间最早的
  const deduplicateOrders = useCallback((orderList) => {
    const productMap = new Map();
    
    // 按商品ID分组，保留时间最早的订单
    orderList.forEach(order => {
      const productId = order.product?.id || order.productId;
      if (!productId) {
        // 没有商品ID的订单直接保留
        productMap.set(order.id, order);
        return;
      }
      
      const key = String(productId);
      const existing = productMap.get(key);
      
      if (!existing) {
        productMap.set(key, order);
      } else {
        // 比较时间，保留更早的订单
        const existingTime = new Date(existing.orderTime || existing.createdAt || 0).getTime();
        const currentTime = new Date(order.orderTime || order.createdAt || 0).getTime();
        if (currentTime < existingTime) {
          productMap.set(key, order);
        }
      }
    });
    
    return Array.from(productMap.values());
  }, []);

  const purchaseOrders = useMemo(() => {
    const filtered = orders.filter(o => {
      const buyerId = o?.buyer?.id || o?.buyer?._id || o?.buyerId || o?.buyer_id;
      // 如果没有 buyerId 信息但有 sellerId 且不是自己，则认为是购买订单
      const sellerId = o?.seller?.id || o?.seller?._id || o?.sellerId || o?.seller_id;
      if (buyerId && myId) {
        return String(buyerId) === String(myId);
      }
      // 如果订单没有明确的 buyer 信息，但 seller 不是自己，则可能是购买订单
      if (!buyerId && sellerId && myId && String(sellerId) !== String(myId)) {
        return true;
      }
      // 如果订单既没有 buyer 也没有 seller 信息，默认显示在购买列表
      if (!buyerId && !sellerId) {
        return true;
      }
      return false;
    });
    return deduplicateOrders(filtered);
  }, [orders, myId, deduplicateOrders]);

  const sellOrders = useMemo(() => {
    const filtered = orders.filter(o => {
      const sellerId = o?.seller?.id || o?.seller?._id || o?.sellerId || o?.seller_id;
      return sellerId && myId && String(sellerId) === String(myId);
    });
    return deduplicateOrders(filtered);
  }, [orders, myId, deduplicateOrders]);

  // 删除订单（仅已取消的订单可删除）
  const handleDeleteOrder = useCallback(async (orderId) => {
    try {
      await deleteOrder(orderId);
      message.success('订单已删除');
      // 直接从本地状态中移除该订单，避免重新请求
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      message.error(err?.message || '删除订单失败');
    }
  }, []);

  // 按状态分类过滤
  const filterByStatus = (list, statusGroup) => list.filter(o => {
    const status = normalizeOrderStatus(o.status);
    if (statusGroup === 'pending') {
      // 待处理：包括待卖家处理和待买家确认
      return status === ORDER_STATUS.PENDING_SELLER || status === ORDER_STATUS.PENDING_BUYER;
    }
    if (statusGroup === 'completed') {
      return status === ORDER_STATUS.COMPLETED;
    }
    if (statusGroup === 'cancelled') {
      return status === ORDER_STATUS.CANCELLED;
    }
    return false;
  });

  const renderOrderList = (data, role) => (
    <List
      loading={loading}
      grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
      dataSource={data}
      renderItem={(order) => {
        const p = order.product || {};
        const amount = (Number(p.price) || 0) * (Number(p.quantity) || 1);
        // 获取对方名称：优先使用 nickname，其次使用 username
        const getDisplayName = (user, defaultName) => {
          if (!user) return defaultName;
          return user.nickname || user.username || defaultName;
        };
        const counterpartName = role === 'purchase' 
          ? getDisplayName(order.seller, '卖家') 
          : getDisplayName(order.buyer, '买家');
        const statusText = getOrderStatusText(order.status);
        const orderStatus = normalizeOrderStatus(order.status);
        const isCancelled = orderStatus === ORDER_STATUS.CANCELLED;
        
        return (
          <List.Item key={order.id}>
            <div className="product-item">
              <ProductCard
                imageSrc={resolveImageSrc({ product: p, item: p })}
                images={p.images}
                title={p.title || '商品'}
                price={amount}
                category={p.category}
                status={statusText}
                location={p.location}
                sellerName={counterpartName}
                sellerId={role === 'purchase' ? (order.seller?.id || order.sellerId) : (order.buyer?.id || order.buyerId)}
                sellerAvatar={role === 'purchase' ? order.seller?.avatar : order.buyer?.avatar}
                publishedAt={order.orderTime}
                views={0}
                overlayType="none"
                dateFormat={'ymd'}
                onClick={() => onNavigate(`/orders/${order.id}`)}
                imageHeight={200}
                showProductDetailButton
                onProductDetailClick={() => onNavigate(`/products/${p.id || order.productId}`)}
                showOrderDeleteButton={isCancelled}
                onOrderDelete={() => handleDeleteOrder(order.id)}
              />
            </div>
          </List.Item>
        );
      }}
      locale={{ emptyText: (<Empty description="暂无订单" image={Empty.PRESENTED_IMAGE_SIMPLE} />) }}
    />
  );

  // 根据 orderType 选择显示的订单列表
  const displayOrders = orderType === 'sell' ? sellOrders : purchaseOrders;
  const role = orderType === 'sell' ? 'sell' : 'purchase';

  // 根据当前 orderStatus 过滤订单
  const filteredOrders = filterByStatus(displayOrders, orderStatus);

  return (
    <Card className="section-card section-orders-card">
      <OrderTabRow
        orderType={orderType}
        orderStatus={orderStatus}
        onTypeChange={onOrderTypeChange}
        onStatusChange={onOrderStatusChange}
      />
      <div className="orders-content">
        {renderOrderList(filteredOrders, role)}
      </div>
    </Card>
  );
}