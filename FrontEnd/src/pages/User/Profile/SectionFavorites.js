import { useMemo, useState } from 'react';
import { Card, Row, Col, Button, Space, Select, Input, Checkbox, Empty, Pagination, Typography } from 'antd';
import ProductCard from '../../../components/ProductCard';
import { resolveImageSrc } from '../../../utils/images';
import { CATEGORY_CODE_TO_LABEL, getCategoryLabel } from '../../../utils/labels';

const { Text } = Typography;

// 商品分类选项（用于筛选下拉框）
const CATEGORY_OPTIONS = [
  { label: '全部分类', value: '' },
  ...Object.entries(CATEGORY_CODE_TO_LABEL).map(([code, label]) => ({ label, value: code }))
];

export default function SectionFavorites({ favorites, onRemoveFavorite, onBatchRemoveFavorites, onNavigate }) {
  const [filters, setFilters] = useState({ category: '', keyword: '', timeRange: 'all', sortBy: 'addTime' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchRemoving, setBatchRemoving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

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

  // 批量移除收藏
  const handleBatchRemove = async () => {
    if (selectedIds.length === 0 || batchRemoving) return;
    setBatchRemoving(true);
    try {
      await onBatchRemoveFavorites([...selectedIds]);
      setSelectedIds([]);
    } finally {
      setBatchRemoving(false);
    }
  };

  return (
    <>
      <Card className="section-card" style={{ marginBottom: 12 }}>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '4px 0' }}>
          <Space size="middle" wrap>
            <Space.Compact style={{ width: 280 }}>
              <Input placeholder="搜索收藏商品" allowClear value={filters.keyword} onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))} />
              <Button type="primary" onClick={() => setCurrentPage(1)}>搜索</Button>
            </Space.Compact>
            <Select placeholder="商品分类" allowClear style={{ width: 140 }} value={filters.category || undefined} onChange={(val) => { setFilters(prev => ({ ...prev, category: val || '' })); setCurrentPage(1); }} options={CATEGORY_OPTIONS.filter(opt => opt.value !== '')} />
            <Select placeholder="加入时间" style={{ width: 140 }} value={filters.timeRange} onChange={(val) => { setFilters(prev => ({ ...prev, timeRange: val })); setCurrentPage(1); }} options={[{ label: '全部', value: 'all' },{ label: '最近7天', value: '7d' },{ label: '最近30天', value: '30d' }]} />
            <Select placeholder="排序方式" style={{ width: 140 }} value={filters.sortBy} onChange={(val) => { setFilters(prev => ({ ...prev, sortBy: val })); setCurrentPage(1); }} options={[{ label: '添加时间', value: 'addTime' },{ label: '价格从低到高', value: 'price_asc' },{ label: '价格从高到低', value: 'price_desc' }]} />
          </Space>
          {filtered.length > 0 && (
            <div className="batch-actions-inline">
              <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} onChange={(e) => handleSelectAll(e.target.checked)}>全选当前页</Checkbox>
              <Text type="secondary" className="selected-count">{selectedIds.length > 0 ? `已选 ${selectedIds.length} 项` : '\u00A0'}</Text>
              <Button className="batch-remove-btn" onClick={handleBatchRemove} disabled={selectedIds.length === 0} loading={batchRemoving}>批量移除</Button>
            </div>
          )}
        </div>
      </Card>
      <Card className="section-card">
        {currentItems.length > 0 ? (
          <Row gutter={[16, 16]}>
            {currentItems.map(item => (
              <Col key={item.id} xs={24} sm={12} md={8} lg={8} xl={8} xxl={8}>
                <ProductCard
                  imageSrc={resolveImageSrc({ item })}
                  images={item.images}
                  title={item.productName}
                  price={item.currentPrice}
                  category={getCategoryLabel(item.category || (Array.isArray(item.tags) ? item.tags[0] : ''))}
                  status={item.status}
                  location={item.location}
                  sellerName={item.seller?.nickname || item.seller?.username || item.seller?.name || item.sellerName || '卖家'}
                  sellerId={item.seller?.id || item.sellerId}
                  sellerAvatar={item.seller?.avatar || item.sellerAvatar}
                  publishedAt={item.publishedAt || item.publishTime || item.createdAt}
                  favoriteAt={item.addTime}
                  overlayType="none"
                  dateFormat={'ymd'}
                  onClick={() => onNavigate(`/products/${item.productId}`)}
                  showCheckbox
                  checkboxChecked={selectedIds.includes(item.id)}
                  onCheckboxChange={(e) => handleSelectItem(item.id, e.target.checked)}
                  unavailable={!item.isAvailable}
                  unavailableText={'暂时缺货'}
                  imageHeight={200}
                  showDeleteButton
                  onDelete={() => onRemoveFavorite(item.id)}
                  deleteButtonText="取消收藏"
                  deleteConfirmText="不喜欢它了吗？取消收藏后可以随时再收藏哦~"
                  deleteConfirmIcon={<span className="popconfirm-emoji popconfirm-emoji-heart">💔</span>}
                />
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="还没有收藏任何商品" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" onClick={() => onNavigate('/search')}>去逛逛</Button>
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

