import React, { useEffect, useMemo, useState } from 'react';
import { Card, Tabs, List, Button, Space, Empty, message } from 'antd';
import ProductCard from '../../../components/ProductCard';
import { resolveImageSrc } from '../../../utils/images';
import { listOrders, confirmReceived, cancelOrder, submitReview } from '../../../api/orders';

export default function SectionOrders({ userInfo, onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const myId = useMemo(() => userInfo?.id || userInfo?._id || userInfo?.userId, [userInfo]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const list = await listOrders();
        if (mounted) setOrders(Array.isArray(list) ? list : []);
      } catch (err) {
        message.error(err?.message || '获取订单失败');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const purchaseOrders = useMemo(() => {
    return orders.filter(o => {
      const buyerId = o?.buyer?.id || o?.buyer?._id || o?.buyerId;
      return buyerId && myId && String(buyerId) === String(myId);
    });
  }, [orders, myId]);

  const sellOrders = useMemo(() => {
    return orders.filter(o => {
      const sellerId = o?.seller?.id || o?.seller?._id || o?.sellerId;
      return sellerId && myId && String(sellerId) === String(myId);
    });
  }, [orders, myId]);

  const filterByStatus = (list, status) => list.filter(o => (o.status || '').toLowerCase() === status);

  const renderOrderList = (data, role) => (
    <List
      loading={loading}
      grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
      dataSource={data}
      renderItem={(order) => {
        const p = order.product || {};
        const amount = (Number(p.price) || 0) * (Number(p.quantity) || 1);
        const counterpartName = role === 'purchase' ? (order.seller?.name || '卖家') : (order.buyer?.name || '买家');
        const productId = p.id || p._id;
        return (
          <List.Item key={order.id || productId}>
            <div className="product-item">
              <ProductCard
                imageSrc={resolveImageSrc({ product: p, item: p })}
                title={p.title || '商品'}
                price={amount}
                category={p.category}
                status={order.status}
                location={p.location}
                sellerName={counterpartName}
                publishedAt={order.orderTime}
                views={0}
                overlayType="none"
                dateFormat={'ymd'}
                onClick={() => productId && onNavigate(`/products/${productId}`)}
                imageHeight={200}
              />
              <div className="card-actions">
                <Space>
                  {order.status === 'pending' && role === 'purchase' && (
                    <>
                      <Button type="link" onClick={async () => {
                        try { await confirmReceived(order.id); setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'completed' } : o)); message.success('已确认收货'); } catch (e) { message.error(e?.message || '操作失败'); }
                      }}>确认收货</Button>
                      <Button type="link" danger onClick={async () => {
                        try { await cancelOrder(order.id); setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o)); message.success('订单已取消'); } catch (e) { message.error(e?.message || '操作失败'); }
                      }}>取消订单</Button>
                    </>
                  )}
                  {order.status === 'pending' && role === 'sell' && (
                    <Button type="link" onClick={async () => {
                      try { await confirmReceived(order.id); setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'completed' } : o)); message.success('订单已标记完成'); } catch (e) { message.error(e?.message || '操作失败'); }
                    }}>标记完成</Button>
                  )}
                  {order.status === 'completed' && role === 'purchase' && (
                    <Button type="link" onClick={async () => {
                      try { await submitReview(order.id, { rating: 5, comment: '好评' }); message.success('评价已提交'); } catch (e) { message.error(e?.message || '操作失败'); }
                    }}>评价</Button>
                  )}
                  <Button type="link" onClick={() => productId && onNavigate(`/products/${productId}`)}>查看详情</Button>
                </Space>
              </div>
            </div>
          </List.Item>
        );
      }}
      locale={{ emptyText: (<Empty description="暂无订单" image={Empty.PRESENTED_IMAGE_SIMPLE} />) }}
    />
  );

  return (
    <Card className="section-card">
      <Tabs
        defaultActiveKey="purchase"
        items={[
          {
            key: 'purchase',
            label: '购买',
            children: (
              <Tabs
                defaultActiveKey="pending"
                items={[
                  { key: 'pending', label: '待处理', children: renderOrderList(filterByStatus(purchaseOrders, 'pending'), 'purchase') },
                  { key: 'completed', label: '已完成', children: renderOrderList(filterByStatus(purchaseOrders, 'completed'), 'purchase') },
                ]}
              />
            )
          },
          {
            key: 'sell',
            label: '出售',
            children: (
              <Tabs
                defaultActiveKey="pending"
                items={[
                  { key: 'pending', label: '待处理', children: renderOrderList(filterByStatus(sellOrders, 'pending'), 'sell') },
                  { key: 'completed', label: '已完成', children: renderOrderList(filterByStatus(sellOrders, 'completed'), 'sell') },
                ]}
              />
            )
          }
        ]}
      />
    </Card>
  );
}