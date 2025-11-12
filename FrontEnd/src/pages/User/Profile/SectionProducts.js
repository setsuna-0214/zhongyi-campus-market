import React from 'react';
import { Card, Tabs, List, Button, Space, Popconfirm, Empty } from 'antd';
import ProductCard from '../../../components/ProductCard';
import { resolveImageSrc } from '../../../utils/images';

export default function SectionProducts({ myProducts, purchaseHistory, onDeleteProduct, onNavigate }) {
  return (
    <Card className="section-card">
      <Tabs
        defaultActiveKey="published"
        items={[
          {
            key: 'published',
            label: '我发布的',
            children: (
              <>
                <div style={{ marginBottom: 12 }}>
                  <Button type="primary" onClick={() => onNavigate('/publish')}>发布新商品</Button>
                </div>
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
                          sellerName={item.seller?.name || item.seller}
                          publishedAt={item.publishTime || item.publishedAt || item.createdAt}
                          views={item.views}
                          overlayType="views-left"
                          dateFormat={'ymd'}
                          onClick={() => onNavigate(`/products/${item.id}`)}
                          imageHeight={200}
                        />
                        <div className="card-actions">
                          <Space>
                            <Button type="link" onClick={() => onNavigate(`/products/${item.id}`)}>查看详情</Button>
                            <Button type="link">编辑</Button>
                            <Popconfirm title="确定要删除这个商品吗？" onConfirm={() => onDeleteProduct(item.id)}>
                              <Button type="link" danger>删除</Button>
                            </Popconfirm>
                          </Space>
                        </div>
                      </div>
                    </List.Item>
                  )}
                  locale={{ emptyText: (<Empty description="还没有发布商品" image={Empty.PRESENTED_IMAGE_SIMPLE} />) }}
                />
              </>
            )
          },
          {
            key: 'purchases',
            label: '我购买的',
            children: (
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
                dataSource={purchaseHistory}
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
                        sellerName={item.seller?.name || item.seller || item.vendor?.name || '卖家'}
                        publishedAt={item.publishTime || item.publishedAt || item.productPublishTime || item.createdAt}
                        views={item.views || 0}
                        overlayType="views-left"
                        dateFormat={'ymd'}
                        onClick={() => onNavigate(`/products/${item.id}`)}
                        imageHeight={200}
                      />
                      <div className="card-actions">
                        <Button type="link" onClick={() => onNavigate(`/products/${item.id}`)}>查看详情</Button>
                      </div>
                    </div>
                  </List.Item>
                )}
                locale={{ emptyText: (<Empty description="还没有购买记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />) }}
              />
            )
          }
        ]}
      />
    </Card>
  );
}

