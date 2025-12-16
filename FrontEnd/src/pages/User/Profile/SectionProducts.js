import React, { useMemo } from 'react';
import { Card, Tabs, List, Button, Empty } from 'antd';
import ProductCard from '../../../components/ProductCard';
import { resolveImageSrc } from '../../../utils/images';

export default function SectionProducts({ myProducts, purchaseHistory, onDeleteProduct, onNavigate, isReadOnly = false }) {
  // 去重购买记录，根据商品ID去除重复项
  const uniquePurchaseHistory = useMemo(() => {
    if (!purchaseHistory) return [];
    const seen = new Set();
    return purchaseHistory.filter((item) => {
      const id = item.id || item.productId;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [purchaseHistory]);

  const items = [
    {
      key: 'published',
      label: isReadOnly ? 'TA发布的' : '我发布的',
      children: (
        <>
          {!isReadOnly && (
            <div style={{ marginBottom: 12 }}>
              <Button type="primary" onClick={() => onNavigate('/publish')}>发布新商品</Button>
            </div>
          )}
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
            dataSource={myProducts}
            renderItem={(item) => (
              <List.Item>
                <div className="product-item">
                  <ProductCard
                    imageSrc={resolveImageSrc({ product: item, item })}
                    title={item.title}
                    price={item.price}
                    category={item.category}
                    status={item.status}
                    location={item.location}
                    sellerName={typeof item.seller === 'object' ? (item.seller?.nickname || item.seller?.username || '卖家') : (item.seller || '卖家')}
                    sellerId={typeof item.seller === 'object' ? item.seller?.id : item.sellerId}
                    publishedAt={item.publishTime || item.publishedAt || item.createdAt}
                    views={item.views}
                    overlayType="views-left"
                    dateFormat={'ymd'}
                    onClick={() => onNavigate(`/products/${item.id}`)}
                    imageHeight={200}
                    showEditButton={!isReadOnly}
                    onEdit={() => onNavigate(`/products/${item.id}/edit`)}
                    showDeleteButton={!isReadOnly}
                    onDelete={() => onDeleteProduct(item.id)}
                  />
                </div>
              </List.Item>
            )}
            locale={{ emptyText: (<Empty description="还没有发布商品" image={Empty.PRESENTED_IMAGE_SIMPLE} />) }}
          />
        </>
      )
    }
  ];

  if (!isReadOnly) {
    items.push({
      key: 'purchases',
      label: '我购买的',
      children: (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
          dataSource={uniquePurchaseHistory}
          renderItem={(item) => (
            <List.Item>
              <div className="product-item">
                <ProductCard
                  imageSrc={resolveImageSrc({ product: item, item })}
                  title={item.title || item.productName || item.name || '商品'}
                  price={item.price ?? item.currentPrice}
                  category={item.category || (Array.isArray(item.tags) ? item.tags[0] : '')}
                  status={item.status || item.saleStatus || item.state}
                  location={item.location}
                  sellerName={typeof item.seller === 'object' ? (item.seller?.nickname || item.seller?.username || '卖家') : (item.seller || item.vendor?.nickname || item.vendor?.username || '卖家')}
                  sellerId={typeof item.seller === 'object' ? item.seller?.id : (item.sellerId || item.vendor?.id)}
                  publishedAt={item.publishTime || item.publishedAt || item.productPublishTime || item.createdAt}
                  views={item.views || 0}
                  overlayType="views-left"
                  dateFormat={'ymd'}
                  onClick={() => onNavigate(`/products/${item.id}`)}
                  imageHeight={200}
                />
              </div>
            </List.Item>
          )}
          locale={{ emptyText: (<Empty description="还没有购买记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />) }}
        />
      )
    });
  }

  return (
    <Card className="section-card">
      <Tabs
        defaultActiveKey="published"
        items={items}
      />
    </Card>
  );
}

