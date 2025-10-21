import React, { useState, useEffect, useCallback } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Input, 
  Select, 
  Button, 
  Tag, 
  Pagination, 
  Slider, 
  Space,
  Empty,
  Spin,
  message
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  HeartOutlined, 
  HeartFilled,
  EyeOutlined,
  ShoppingCartOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './index.css';
import { searchProducts } from '../../api/products';

const { Search } = Input;
const { Option } = Select;

const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  
  // 筛选条件
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    category: searchParams.get('category') || '',
    condition: searchParams.get('condition') || '',
    priceRange: [0, 10000],
    location: '',
    sortBy: 'latest'
  });
  
  // 收藏状态
  const [favorites, setFavorites] = useState(new Set());

  // 商品分类
  const categories = [
    { value: 'electronics', label: '数码电子' },
    { value: 'books', label: '图书教材' },
    { value: 'clothing', label: '服装配饰' },
    { value: 'sports', label: '运动户外' },
    { value: 'daily', label: '生活用品' },
    { value: 'furniture', label: '家具家电' },
    { value: 'beauty', label: '美妆护肤' },
    { value: 'other', label: '其他' }
  ];

  // 商品成色
  const conditions = [
    { value: 'new', label: '全新' },
    { value: 'like-new', label: '几乎全新' },
    { value: 'good', label: '成色较好' },
    { value: 'fair', label: '成色一般' }
  ];

  // 排序选项
  const sortOptions = [
    { value: 'latest', label: '最新发布' },
    { value: 'price-low', label: '价格从低到高' },
    { value: 'price-high', label: '价格从高到低' },
    { value: 'popular', label: '最受欢迎' }
  ];

  // 已移除模拟商品数据，统一从后端获取

  // 获取商品列表（接入后端）
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { items, total } = await searchProducts({
        ...filters,
        page: currentPage,
        pageSize,
      });
      setProducts(items);
      setTotal(total);
    } catch (error) {
      message.error(error.message || '获取商品列表失败');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, pageSize]);

  // 处理搜索
  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, keyword: value }));
    setCurrentPage(1);
    updateSearchParams({ ...filters, keyword: value });
  };

  // 处理筛选
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    updateSearchParams(newFilters);
  };

  // 更新URL参数
  const updateSearchParams = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '' && !(Array.isArray(value) && value.length === 0)) {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, value);
        }
      }
    });
    setSearchParams(params);
  };

  // 处理收藏
  const handleFavorite = (productId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
      message.success('已取消收藏');
    } else {
      newFavorites.add(productId);
      message.success('已添加到收藏');
    }
    setFavorites(newFavorites);
  };

  // 跳转到商品详情
  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  // 获取分类标签
  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  // 获取成色标签
  const getConditionLabel = (condition) => {
    const cond = conditions.find(c => c.value === condition);
    return cond ? cond.label : condition;
  };

  // 获取成色颜色
  const getConditionColor = (condition) => {
    const colors = {
      'new': 'green',
      'like-new': 'blue',
      'good': 'orange',
      'fair': 'default'
    };
    return colors[condition] || 'default';
  };

  useEffect(() => {
    fetchProducts();
  }, [filters, currentPage]);

  return (
    <div className="products-page">
      <div className="container">
        {/* 搜索和筛选区域 */}
        <div className="search-filter-section">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Search
                placeholder="搜索商品名称、描述..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                value={filters.keyword}
                onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                onSearch={handleSearch}
              />
            </Col>
            <Col xs={24} md={12}>
              <Space size="middle" className="filter-controls">
                <Select
                  placeholder="商品分类"
                  allowClear
                  style={{ width: 120 }}
                  value={filters.category || undefined}
                  onChange={(value) => handleFilterChange('category', value)}
                >
                  {categories.map(cat => (
                    <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                  ))}
                </Select>
                
                <Select
                  placeholder="商品成色"
                  allowClear
                  style={{ width: 120 }}
                  value={filters.condition || undefined}
                  onChange={(value) => handleFilterChange('condition', value)}
                >
                  {conditions.map(cond => (
                    <Option key={cond.value} value={cond.value}>{cond.label}</Option>
                  ))}
                </Select>
                
                <Select
                  placeholder="排序方式"
                  style={{ width: 120 }}
                  value={filters.sortBy}
                  onChange={(value) => handleFilterChange('sortBy', value)}
                >
                  {sortOptions.map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                  ))}
                </Select>
              </Space>
            </Col>
          </Row>
          
          {/* 价格筛选 */}
          <div className="price-filter">
            <span>价格范围：</span>
            <Slider
              range
              min={0}
              max={10000}
              step={100}
              value={filters.priceRange}
              onChange={(value) => handleFilterChange('priceRange', value)}
              style={{ width: 200, margin: '0 16px' }}
            />
            <span>¥{filters.priceRange[0]} - ¥{filters.priceRange[1]}</span>
          </div>
        </div>

        {/* 商品列表 */}
        <div className="products-section">
          <div className="section-header">
            <h2>商品列表</h2>
            <span className="total-count">共 {total} 件商品</span>
          </div>
          
          <Spin spinning={loading}>
            {products.length > 0 ? (
              <>
                <Row gutter={[16, 16]}>
                  {products.map(product => (
                    <Col key={product.id} xs={12} sm={8} md={6} lg={6} xl={4}>
                      <Card
                        hoverable
                        className="product-card"
                        onClick={() => handleProductClick(product.id)}
                        cover={
                          <div className="product-image-container">
                            <img
                              alt={product.title}
                              src={product.images[0]}
                              onClick={() => handleProductClick(product.id)}
                            />
                            <div className="product-overlay">
                              <Button
                                type="text"
                                icon={favorites.has(product.id) ? <HeartFilled /> : <HeartOutlined />}
                                className={`favorite-btn ${favorites.has(product.id) ? 'favorited' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFavorite(product.id);
                                }}
                              />
                              <div className="product-stats">
                                <span><EyeOutlined /> {product.views}</span>
                                <span><HeartOutlined /> {product.likes}</span>
                              </div>
                            </div>
                          </div>
                        }
                        actions={[
                          <Button
                            type="primary"
                            size="small"
                            icon={<ShoppingCartOutlined />}
                            onClick={() => handleProductClick(product.id)}
                          >
                            查看详情
                          </Button>
                        ]}
                      >
                        <div className="product-info">
                          <h3 className="product-title" onClick={() => handleProductClick(product.id)}>
                            {product.title}
                          </h3>
                          
                          <div className="product-tags">
                            <Tag color="blue">{getCategoryLabel(product.category)}</Tag>
                            <Tag color={getConditionColor(product.condition)}>
                              {getConditionLabel(product.condition)}
                            </Tag>
                          </div>
                          
                          <div className="product-price">
                            <span className="current-price">¥{product.price}</span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="original-price">¥{product.originalPrice}</span>
                            )}
                          </div>
                          
                          <div className="product-location">
                            <EnvironmentOutlined />
                            <span>{product.location}</span>
                          </div>
                          
                          <div className="seller-info">
                            <img src={product.seller.avatar} alt={product.seller.name} />
                            <span>{product.seller.name}</span>
                            <span className="rating">★{product.seller.rating}</span>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
                
                {/* 分页 */}
                <div className="pagination-container">
                  <Pagination
                    current={currentPage}
                    total={total}
                    pageSize={pageSize}
                    showSizeChanger={false}
                    showQuickJumper
                    showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                    onChange={(page) => setCurrentPage(page)}
                  />
                </div>
              </>
            ) : (
              <Empty
                description="暂无商品"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Spin>
        </div>
      </div>
    </div>
  );
};

export default Products;