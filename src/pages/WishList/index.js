import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Tag, 
  Image, 
  Typography, 
  Space, 
  Input, 
  Select, 
  Checkbox, 
  Modal, 
  message,
  Empty,
  Tooltip,
  Divider,
  Pagination
} from 'antd';
import { 
  HeartFilled,
  HeartOutlined,
  ShoppingCartOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  FilterOutlined,
  SearchOutlined,
  EyeOutlined,
  StarFilled
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { getWishlist, removeFromWishlist } from '../../api/wishlist';
import { addToCart, batchAddToCart } from '../../api/cart';

const { Title, Text } = Typography;
const { Option } = Select;

// 心愿单数据改为从后端获取

const WishList = () => {
  const navigate = useNavigate();
  const [wishItems, setWishItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    keyword: '',
    sortBy: 'addTime'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const items = await getWishlist();
        setWishItems(Array.isArray(items) ? items : []);
      } catch (err) {
        message.error(err?.message || '获取心愿单失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 直接计算过滤后的数据，避免状态更新导致的重新渲染
  const getFilteredItems = () => {
    let filteredItems = [...wishItems];
    
    // 应用过滤器
    if (filters.category) {
      filteredItems = filteredItems.filter(item => item.category === filters.category);
    }
    
    if (filters.keyword) {
      filteredItems = filteredItems.filter(item => 
        item.productName.toLowerCase().includes(filters.keyword.toLowerCase())
      );
    }
    
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filteredItems = filteredItems.filter(item => 
        item.currentPrice >= min && item.currentPrice <= max
      );
    }
    
    // 排序
    filteredItems.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_asc':
          return a.currentPrice - b.currentPrice;
        case 'price_desc':
          return b.currentPrice - a.currentPrice;
        case 'addTime':
        default:
          return new Date(b.addTime) - new Date(a.addTime);
      }
    });
    
    return filteredItems;
  };

  const filteredWishItems = getFilteredItems();

  // 处理搜索
  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, keyword: value }));
    setCurrentPage(1);
  };

  // 处理筛选
  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // 移除心愿单
  const handleRemoveFromWishList = async (itemId) => {
    try {
      await removeFromWishlist(itemId);
      setWishItems(prev => prev.filter(item => item.id !== itemId));
      setSelectedItems(prev => prev.filter(id => id !== itemId));
      message.success('已从心愿单移除');
    } catch (error) {
      message.error('移除失败');
    }
  };

  // 批量移除
  const handleBatchRemove = () => {
    if (selectedItems.length === 0) {
      message.warning('请选择要移除的商品');
      return;
    }
    
    Modal.confirm({
      title: '确认移除',
      content: `确定要移除选中的 ${selectedItems.length} 个商品吗？`,
      onOk: async () => {
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 500));
          setWishItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
          setSelectedItems([]);
          message.success('批量移除成功');
        } catch (error) {
          message.error('批量移除失败');
        }
      }
    });
  };

  // 加入购物车
  const handleAddToCart = async (item) => {
    if (!item.isAvailable) {
      message.warning('商品暂时缺货');
      return;
    }
    
    try {
      await addToCart(item.productId, 1);
      message.success('已加入购物车');
    } catch (error) {
      message.error('加入购物车失败');
    }
  };

  // 批量加入购物车
  const handleBatchAddToCart = () => {
    if (selectedItems.length === 0) {
      message.warning('请选择要加入购物车的商品');
      return;
    }
    
    const availableItems = filteredWishItems.filter(item => 
      selectedItems.includes(item.id) && item.isAvailable
    );
    
    if (availableItems.length === 0) {
      message.warning('选中的商品都暂时缺货');
      return;
    }
    
    Modal.confirm({
      title: '加入购物车',
      content: `确定要将选中的 ${availableItems.length} 个商品加入购物车吗？`,
      onOk: async () => {
        try {
          await batchAddToCart(availableItems.map(i => ({ productId: i.productId, quantity: 1 })));
          message.success('批量加入购物车成功');
          setSelectedItems([]);
        } catch (error) {
          message.error('批量加入购物车失败');
        }
      }
    });
  };

  // 查看商品详情
  const handleViewDetail = (productId) => {
    navigate(`/products/${productId}`);
  };

  // 分享商品
  const handleShare = (item) => {
    // 模拟分享功能
    const shareUrl = `${window.location.origin}/products/${item.productId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      message.success('商品链接已复制到剪贴板');
    }).catch(() => {
      message.error('分享失败');
    });
  };

  // 处理选择
  const handleSelectItem = (itemId, checked) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  // 全选/取消全选
  const handleSelectAll = (checked) => {
    if (checked) {
      const currentPageItems = getCurrentPageItems();
      const currentPageIds = currentPageItems.map(item => item.id);
      setSelectedItems(prev => [...new Set([...prev, ...currentPageIds])]);
    } else {
      const currentPageItems = getCurrentPageItems();
      const currentPageIds = currentPageItems.map(item => item.id);
      setSelectedItems(prev => prev.filter(id => !currentPageIds.includes(id)));
    }
  };

  // 获取当前页商品
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredWishItems.slice(startIndex, endIndex);
  };

  // 检查是否全选
  const isAllSelected = () => {
    const currentPageItems = getCurrentPageItems();
    return currentPageItems.length > 0 && 
           currentPageItems.every(item => selectedItems.includes(item.id));
  };

  // 检查是否部分选择
  const isIndeterminate = () => {
    const currentPageItems = getCurrentPageItems();
    const selectedCount = currentPageItems.filter(item => 
      selectedItems.includes(item.id)
    ).length;
    return selectedCount > 0 && selectedCount < currentPageItems.length;
  };

  const currentPageItems = getCurrentPageItems();

  return (
    <div className="page-container wishlist-container">
      <Card className="wishlist-header-card">
        <div className="wishlist-header">
          <div className="header-left">
            <Title level={3}>我的心愿单</Title>
            <Text type="secondary">共 {filteredWishItems.length} 个商品</Text>
          </div>
          
          <div className="header-actions">
            <Space size="middle">
              <Input.Search
                placeholder="搜索心愿单商品"
                allowClear
                style={{ width: 250 }}
                onSearch={handleSearch}
              />
              
              <Select
                placeholder="商品分类"
                allowClear
                style={{ width: 120 }}
                onChange={(value) => handleFilter('category', value)}
              >
                <Option value="手机数码">手机数码</Option>
                <Option value="电脑办公">电脑办公</Option>
                <Option value="智能穿戴">智能穿戴</Option>
                <Option value="家用电器">家用电器</Option>
              </Select>
              
              <Select
                placeholder="价格区间"
                allowClear
                style={{ width: 120 }}
                onChange={(value) => handleFilter('priceRange', value)}
              >
                <Option value="0-1000">0-1000元</Option>
                <Option value="1000-3000">1000-3000元</Option>
                <Option value="3000-5000">3000-5000元</Option>
                <Option value="5000-10000">5000-10000元</Option>
                <Option value="10000-99999">10000元以上</Option>
              </Select>
              
              <Select
                placeholder="排序方式"
                value={filters.sortBy}
                style={{ width: 120 }}
                onChange={(value) => handleFilter('sortBy', value)}
              >
                <Option value="addTime">添加时间</Option>
                <Option value="price_asc">价格从低到高</Option>
                <Option value="price_desc">价格从高到低</Option>
              </Select>
            </Space>
          </div>
        </div>
      </Card>

      {/* 批量操作栏 */}
      {filteredWishItems.length > 0 && (
        <Card className="batch-actions-card">
          <div className="batch-actions">
            <div className="select-all">
              <Checkbox
                checked={isAllSelected()}
                indeterminate={isIndeterminate()}
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                全选当前页
              </Checkbox>
              {selectedItems.length > 0 && (
                <Text type="secondary">
                  已选择 {selectedItems.length} 个商品
                </Text>
              )}
            </div>
            
            <Space>
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={handleBatchAddToCart}
                disabled={selectedItems.length === 0}
              >
                批量加入购物车
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleBatchRemove}
                disabled={selectedItems.length === 0}
              >
                批量移除
              </Button>
            </Space>
          </div>
        </Card>
      )}

      {/* 商品列表 */}
      <Card className="wishlist-content-card">
        {currentPageItems.length > 0 ? (
          <Row gutter={[16, 16]}>
            {currentPageItems.map(item => (
              <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  className={`product-card ${!item.isAvailable ? 'unavailable' : ''}`}
                  cover={
                    <div className="product-image-container">
                      <Checkbox
                        className="product-checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                      />
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        height={200}
                        preview={false}
                        onClick={() => handleViewDetail(item.productId)}
                        style={{ cursor: 'pointer' }}
                      />
                      {!item.isAvailable && (
                        <div className="unavailable-overlay">
                          <Text>暂时缺货</Text>
                        </div>
                      )}
                      {item.discount > 0 && (
                        <div className="discount-badge">
                          {item.discount}折
                        </div>
                      )}
                    </div>
                  }
                  actions={[
                    <Tooltip title="查看详情">
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(item.productId)}
                      />
                    </Tooltip>,
                    <Tooltip title="加入购物车">
                      <Button
                        type="text"
                        icon={<ShoppingCartOutlined />}
                        onClick={() => handleAddToCart(item)}
                        disabled={!item.isAvailable}
                      />
                    </Tooltip>,
                    <Tooltip title="分享">
                      <Button
                        type="text"
                        icon={<ShareAltOutlined />}
                        onClick={() => handleShare(item)}
                      />
                    </Tooltip>,
                    <Tooltip title="移除">
                      <Button
                        type="text"
                        danger
                        icon={<HeartFilled />}
                        onClick={() => handleRemoveFromWishList(item.id)}
                      />
                    </Tooltip>
                  ]}
                >
                  <div className="product-info">
                    <Title level={5} className="product-name" ellipsis={{ rows: 2 }}>
                      {item.productName}
                    </Title>
                    
                    <div className="product-tags">
                      {item.tags.slice(0, 2).map(tag => (
                        <Tag key={tag} size="small">{tag}</Tag>
                      ))}
                    </div>
                    
                    <div className="price-info">
                      <Text className="current-price">¥{item.currentPrice}</Text>
                      {item.originalPrice > item.currentPrice && (
                        <Text className="original-price" delete>
                          ¥{item.originalPrice}
                        </Text>
                      )}
                    </div>
                    
                    <div className="seller-info">
                      <Space size="small">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.seller.name}
                        </Text>
                        <Space size={2}>
                          <StarFilled style={{ color: '#faad14', fontSize: 12 }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.seller.rating}
                          </Text>
                        </Space>
                      </Space>
                    </div>
                    
                    <div className="product-meta">
                      <Space split={<Divider type="vertical" />}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.location}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          销量{item.sales}
                        </Text>
                      </Space>
                    </div>
                    
                    <div className="add-time">
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        添加于 {item.addTime.split(' ')[0]}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            description="心愿单是空的"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/products')}>
              去逛逛
            </Button>
          </Empty>
        )}
      </Card>

      {/* 分页 */}
      {filteredWishItems.length > pageSize && (
        <div className="pagination-container">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredWishItems.length}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }
            onChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
};

export default WishList;
//