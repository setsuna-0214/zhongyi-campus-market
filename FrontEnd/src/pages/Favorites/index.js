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
  Pagination,
  Avatar
} from 'antd';
import { 
  HeartFilled,
  ShoppingCartOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  EyeOutlined,
  StarFilled,
  EnvironmentOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { getFavorites, removeFromFavorites } from '../../api/favorites';
import { addToCart, batchAddToCart } from '../../api/cart';
import { getCategoryLabel, getStatusLabel, getStatusColor } from '../../utils/labels';

const { Title, Text } = Typography;
const { Option } = Select;

// 我的收藏数据改为从后端获取

const Favorites = () => {
  const navigate = useNavigate();
  const [favoriteItems, setFavoriteItems] = useState([]);
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
      try {
        const items = await getFavorites();
        setFavoriteItems(Array.isArray(items) ? items : []);
      } catch (err) {
        message.error(err?.message || '获取收藏失败');
      }
    })();
  }, []);

  const getFilteredFavorites = () => {
  let filteredItems = [...favoriteItems];
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

  const filteredFavorites = getFilteredFavorites();

  // 分类与状态标签统一由 utils 提供

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, keyword: value }));
    setCurrentPage(1);
  };

  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleRemoveFromFavorites = async (itemId) => {
    try {
      await removeFromFavorites(itemId);
      setFavoriteItems(prev => prev.filter(item => item.id !== itemId));
      setSelectedItems(prev => prev.filter(id => id !== itemId));
      message.success('已移除收藏');
    } catch (error) {
      message.error('移除失败');
    }
  };

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
          await new Promise(resolve => setTimeout(resolve, 500));
          setFavoriteItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
          setSelectedItems([]);
          message.success('批量移除成功');
        } catch (error) {
          message.error('批量移除失败');
        }
      }
    });
  };

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

  const handleBatchAddToCart = () => {
    if (selectedItems.length === 0) {
      message.warning('请选择要加入购物车的商品');
      return;
    }
    const availableItems = filteredFavorites.filter(item => 
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

  const handleViewDetail = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleShare = (item) => {
    const shareUrl = `${window.location.origin}/products/${item.productId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      message.success('商品链接已复制到剪贴板');
    }).catch(() => {
      message.error('分享失败');
    });
  };

  const handleSelectItem = (itemId, checked) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

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

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredFavorites.slice(startIndex, endIndex);
  };

  const isAllSelected = () => {
    const currentPageItems = getCurrentPageItems();
    return currentPageItems.length > 0 && 
           currentPageItems.every(item => selectedItems.includes(item.id));
  };

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
            <Title level={3}>我的收藏</Title>
            <Text type="secondary">共 {filteredFavorites.length} 个商品</Text>
          </div>
          
          <div className="header-actions">
            <Space size="middle">
              <Input.Search
                placeholder="搜索收藏商品"
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
      {filteredFavorites.length > 0 && (
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
                  hoverable
                  bordered={false}
                  onClick={() => handleViewDetail(item.productId)}
                  cover={
                    <div className="product-image-container">
                      {/* 右上角选择框 */}
                       <Checkbox
                         className="product-checkbox"
                         checked={selectedItems.includes(item.id)}
                         onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                         onClick={(e) => e.stopPropagation()}
                       />
                       <Image
                         src={item.productImage}
                         alt={item.productName}
                         height={230}
                         preview={false}
                         style={{ cursor: 'pointer' }}
                       />
                      {/* 与首页热门商品卡片一致的顶部信息覆盖层 */}
                      <div className="product-overlay overlay-hot">
                        <Space>
                          <EyeOutlined /> {item.sales}
                        </Space>
                      </div>
                      {!item.isAvailable && (
                        <div className="unavailable-overlay">
                          <Text>暂时缺货</Text>
                        </div>
                      )}
                    </div>
                  }
                >
                  <Card.Meta
                    title={
                      <div className="product-title">
                        {item.productName}
                      </div>
                    }
                    description={
                      <div className="product-desc">
                        {(item.category || (Array.isArray(item.tags) && item.tags.length > 0)) && (
                          <div className="product-category-line">
                            <Tag color="green" className="product-category-tag">
                              {getCategoryLabel(item.category || (Array.isArray(item.tags) ? item.tags[0] : ''))}
                            </Tag>
                            {item.status && (
                              <Tag color={getStatusColor(item.status)} className="product-status-tag">
                                {getStatusLabel(item.status)}
                              </Tag>
                            )}
                          </div>
                        )}
                        <div className="home-product-topline">
                          <div className="product-price">¥{item.currentPrice}</div>
                          {item.addTime && (
                            <div className="home-product-published">{new Date(item.addTime).toLocaleDateString()}</div>
                          )}
                        </div>
                        <div className="home-product-bottom">
                          <div className="home-product-seller">
                            <Avatar size={24} icon={<UserOutlined />} />
                            <span className="seller-name">{item.seller?.name}</span>
                          </div>
                          {item.location && (
                            <div className="home-product-location">
                              <EnvironmentOutlined />
                              <span>{item.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            description="收藏为空"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/products')}>
              去逛逛
            </Button>
          </Empty>
        )}
      </Card>

      {/* 分页 */}
      {filteredFavorites.length > pageSize && (
        <div className="pagination-container">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredFavorites.length}
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

export default Favorites;