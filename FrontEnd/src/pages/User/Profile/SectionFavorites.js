import React, { useMemo, useState } from 'react';
import { Card, Row, Col, Button, Space, Select, Input, Checkbox, Empty, Pagination, Popconfirm, Typography } from 'antd';
import ProductCard from '../../../components/ProductCard';
import { resolveImageSrc } from '../../../utils/images';

const { Text } = Typography;

export default function SectionFavorites({ favorites, onRemoveFavorite, onNavigate }) {
  const [filters, setFilters] = useState({ category: '', keyword: '', timeRange: 'all', sortBy: 'addTime' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const categories = useMemo(() => {
    const set = new Set();
    favorites.forEach(item => {
      if (item.category) set.add(item.category);
      else if (Array.isArray(item.tags) && item.tags[0]) set.add(item.tags[0]);
    });
    return Array.from(set);
  }, [favorites]);

  const filtered = useMemo(() => {
    let items = [...favorites];
    if (filters.category) {
      items = items.filter(item => {
        const cat = item.category || (Array.isArray(item.tags) ? item.tags[0] : '');
        return cat === filters.category;
      });
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      items = items.filter(item => (item.productName || '').toLowerCase().includes(kw));
    }
    if (filters.timeRange !== 'all') {
      const now = Date.now();
      const days = filters.timeRange === '7d' ? 7 : 30;
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      items = items.filter(item => {
        const t = item.addTime ? new Date(item.addTime).getTime() : 0;
        return t >= cutoff;
      });
    }
    items.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_asc':
          return (a.currentPrice || 0) - (b.currentPrice || 0);
        case 'price_desc':
          return (b.currentPrice || 0) - (a.currentPrice || 0);
        case 'addTime':
        default:
          return new Date(b.addTime || 0) - new Date(a.addTime || 0);
      }
    });
    return items;
  }, [favorites, filters]);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, currentPage, pageSize]);

  const isAllSelected = useMemo(() => currentItems.length > 0 && currentItems.every(item => selectedIds.includes(item.id)), [currentItems, selectedIds]);
  const isIndeterminate = useMemo(() => {
    const count = currentItems.filter(item => selectedIds.includes(item.id)).length;
    return count > 0 && count < currentItems.length;
  }, [currentItems, selectedIds]);

  const handleSelectItem = (itemId, checked) => {
    setSelectedIds(prev => {
      if (checked) return [...new Set([...prev, itemId])];
      return prev.filter(id => id !== itemId);
    });
  };

  const handleSelectAll = (checked) => {
    const idsOnPage = currentItems.map(i => i.id);
    setSelectedIds(prev => {
      if (checked) return [...new Set([...prev, ...idsOnPage])];
      return prev.filter(id => !idsOnPage.includes(id));
    });
  };

  

  return (
    <>
      <Card className="section-card">
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Space size="middle" wrap>
            <Space.Compact style={{ width: 280 }}>
              <Input placeholder="搜索收藏商品" allowClear value={filters.keyword} onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))} />
              <Button type="primary" onClick={() => setCurrentPage(1)}>搜索</Button>
            </Space.Compact>
            <Select placeholder="商品分类" allowClear style={{ width: 140 }} value={filters.category || undefined} onChange={(val) => { setFilters(prev => ({ ...prev, category: val || '' })); setCurrentPage(1); }} options={categories.map(c => ({ label: c, value: c }))} />
            <Select placeholder="加入时间" style={{ width: 140 }} value={filters.timeRange} onChange={(val) => { setFilters(prev => ({ ...prev, timeRange: val })); setCurrentPage(1); }} options={[{ label: '全部', value: 'all' },{ label: '最近7天', value: '7d' },{ label: '最近30天', value: '30d' }]} />
            <Select placeholder="排序方式" style={{ width: 140 }} value={filters.sortBy} onChange={(val) => { setFilters(prev => ({ ...prev, sortBy: val })); setCurrentPage(1); }} options={[{ label: '添加时间', value: 'addTime' },{ label: '价格从低到高', value: 'price_asc' },{ label: '价格从高到低', value: 'price_desc' }]} />
          </Space>
        </div>
      </Card>
      {filtered.length > 0 && (
        <Card className="section-card">
          <div className="batch-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="select-all" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} onChange={(e) => handleSelectAll(e.target.checked)}>全选当前页</Checkbox>
              {selectedIds.length > 0 && <Text type="secondary">已选择 {selectedIds.length} 个商品</Text>}
            </div>
            <Space>
              <Button danger onClick={() => { const toRemove = [...selectedIds]; toRemove.forEach(id => onRemoveFavorite(id)); setSelectedIds([]); }} disabled={selectedIds.length === 0}>批量移除</Button>
            </Space>
          </div>
        </Card>
      )}
      <Card className="section-card">
        {currentItems.length > 0 ? (
          <Row gutter={[16, 16]}>
            {currentItems.map(item => (
              <Col key={item.id} xs={24} sm={12} md={8} lg={8} xl={8} xxl={8}>
                <ProductCard
                  imageSrc={resolveImageSrc({ item })}
                  title={item.productName}
                  price={item.currentPrice}
                  category={item.category || (Array.isArray(item.tags) ? item.tags[0] : '')}
                  status={item.status}
                  location={item.location}
                  sellerName={item.seller?.nickname}
                  sellerId={item.seller?.id || item.sellerId}
                  publishedAt={item.publishedAt || item.publishTime || item.createdAt}
                  favoriteAt={item.addTime}
                  views={item.sales}
                  overlayType={'views-left'}
                  dateFormat={'ymd'}
                  onClick={() => onNavigate(`/products/${item.productId}`)}
                  showCheckbox
                  checkboxChecked={selectedIds.includes(item.id)}
                  onCheckboxChange={(e) => handleSelectItem(item.id, e.target.checked)}
                  unavailable={!item.isAvailable}
                  unavailableText={'暂时缺货'}
                  imageHeight={200}
                />
                <div className="card-actions">
                  <Popconfirm title="确定要取消收藏吗？" onConfirm={() => onRemoveFavorite(item.id)}>
                    <Button type="link" danger>取消收藏</Button>
                  </Popconfirm>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="还没有收藏任何商品" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" onClick={() => onNavigate('/search?type=products')}>去逛逛</Button>
          </Empty>
        )}
      </Card>
      {filtered.length > pageSize && (
        <div className="pagination-container" style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <Pagination current={currentPage} pageSize={pageSize} total={filtered.length} showSizeChanger={false} showQuickJumper showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`} onChange={(page) => setCurrentPage(page)} />
        </div>
      )}
    </>
  );
}

