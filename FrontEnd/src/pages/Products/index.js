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
  Avatar,
  Empty,
  Spin,
  message
} from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined,
  EnvironmentOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './index.css';
import { searchProducts } from '../../api/products';
import { getCategoryLabel, getStatusLabel, getStatusColor, toCategoryCode } from '../../utils/labels';

const { Option } = Select;

const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(() => Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1));
  const [pageSize] = useState(12);
  
  // 初始分类参数（支持中文或代码），统一转为代码
  const initialCategoryParam = searchParams.get('category') || '';
  const normalizedCategory = toCategoryCode(initialCategoryParam) || '';

  useEffect(() => {
    // 当 URL 查询参数变化时，同步到组件状态，避免状态与 URL 不一致
    const nextPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const priceRangeParamUrl = searchParams.get('priceRange');
    const nextPriceRange = (() => {
      if (priceRangeParamUrl) {
        const parts = priceRangeParamUrl.split(',').map(n => Number(n));
        if (parts.length === 2 && parts.every(n => Number.isFinite(n))) return parts;
      }
      return [0, 10000];
    })();
    const nextFilters = {
      keyword: searchParams.get('keyword') || '',
      category: toCategoryCode(searchParams.get('category') || '') || '',
      priceRange: nextPriceRange,
      location: searchParams.get('location') || '',
      sortBy: searchParams.get('sortBy') || 'latest'
    };
    const arraysEqual = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
    const filtersChanged = (
      filters.keyword !== nextFilters.keyword ||
      filters.category !== nextFilters.category ||
      filters.location !== nextFilters.location ||
      filters.sortBy !== nextFilters.sortBy ||
      !arraysEqual(filters.priceRange, nextFilters.priceRange)
    );
    const pageChanged = currentPage !== nextPage;
    if (filtersChanged) setFilters(nextFilters);
    if (pageChanged) setCurrentPage(nextPage);
  }, [searchParams]);
  const initialPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const priceRangeParam = searchParams.get('priceRange');
  const initialPriceRange = (() => {
    if (priceRangeParam) {
      const parts = priceRangeParam.split(',').map(n => Number(n));
      if (parts.length === 2 && parts.every(n => Number.isFinite(n))) {
        return parts;
      }
    }
    return [0, 10000];
  })();
  const sortByParam = searchParams.get('sortBy') || 'latest';

  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    category: normalizedCategory,
    priceRange: initialPriceRange,
    location: searchParams.get('location') || '',
    sortBy: sortByParam
  });
  // 商品分类
  const categories = [
    { value: 'electronics', label: '数码电子' },
    { value: 'books', label: '图书教材' },
    { value: 'daily', label: '生活用品' },
    { value: 'other', label: '其他物品' }
  ];

  // 成色筛选已移除

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
    updateSearchParams({ keyword: value, page: 1 });
  };

  // 处理筛选
  const handleFilterChange = (key, value) => {
    updateSearchParams({ [key]: value, page: 1 });
  };

  // 更新URL参数（保留已有参数、移除空值，并确保与当前 filters/page 同步）
  const updateSearchParams = (partial) => {
    const params = new URLSearchParams(searchParams);
    const entries = {
      keyword: partial.keyword ?? filters.keyword,
      category: partial.category ?? filters.category,
      priceRange: partial.priceRange ?? filters.priceRange,
      location: partial.location ?? filters.location,
      sortBy: partial.sortBy ?? filters.sortBy,
      page: partial.page ?? currentPage
    };
    Object.entries(entries).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        const val = value.join(',');
        if (val) params.set(key, val); else params.delete(key);
      } else if (value !== undefined && value !== null && String(value) !== '') {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  // 跳转到商品详情
  const handleProductClick = (productId) => {
    if (!productId) { message.warning('\u65e0\u6cd5\u6253\u5f00\u5546\u54c1\u8be6\u60c5\uff1a\u7f3a\u5c11\u5546\u54c1ID'); return; }
    navigate(`/products/${productId}`);
  };

  // 分类与成色标签由 utils 统一提供（此处无需重复定义）

  // 出售状态中文与颜色映射由 utils 统一提供

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="products-page">
      <div className="container">
        {/* 搜索和筛选区域 */}
        <div className="search-filter-section">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="搜索商品名称、描述..."
                  size="large"
                  value={filters.keyword}
                  onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                  onPressEnter={() => handleSearch(filters.keyword)}
                />
                <Button
                  type="primary"
                  size="large"
                  icon={<SearchOutlined />}
                  onClick={() => handleSearch(filters.keyword)}
                >
                  搜索
                </Button>
              </Space.Compact>
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
                  {products.map((product, index) => (
                    <Col key={product.id || product._id || `${product.title || 'item'}-${index}`} xs={24} sm={12} md={8} lg={8} xl={8}>
                      <Card
                        hoverable
                        className="product-card"
                        onClick={() => handleProductClick(product.id ?? product._id)}
                        cover={
                          <div className="product-image-container">
                            <img
                              alt={product.title}
                              src={product.image || (Array.isArray(product.images) ? product.images[0] : undefined) || 'https://via.placeholder.com/300x200?text=No+Image'}
                            />
                            <div className={`product-overlay overlay-hot`}>
                              <Space>
                                <EyeOutlined /> {product.views}
                              </Space>
                            </div>
                          </div>
                        }
                      >
                        <Card.Meta
                          title={
                            <div className="product-title">
                              {product.title}
                            </div>
                          }
                          description={
                            <div className="product-desc">
                              {product.category && (
                                <div className="product-category-line">
                                  <Tag color="green" className="product-category-tag">{getCategoryLabel(product.category)}</Tag>
                                  {product.status && (
                                    <Tag color={getStatusColor(product.status)} className="product-status-tag">
                                      {getStatusLabel(product.status)}
                                    </Tag>
                                  )}
                                </div>
                              )}
                              <div className="home-product-topline">
                                <div className="product-price">¥{product.price}</div>
                                {product.publishTime && (
                                  <div className="home-product-published">{product.publishTime}</div>
                                )}
                              </div>
                              <div className="home-product-bottom">
                                <div className="home-product-seller">
                                  <Avatar size={24} icon={<UserOutlined />} />
                                  <span className="seller-name">{typeof product.seller === 'string' ? product.seller : (product.seller?.name || '卖家')}</span>
                                </div>
                                {product.location && (
                                  <div className="home-product-location">
                                    <EnvironmentOutlined />
                                    <span>{product.location}</span>
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
                
                {/* 分页 */}
                <div className="pagination-container">
                  <Pagination
                    current={currentPage}
                    total={total}
                    pageSize={pageSize}
                    showSizeChanger={false}
                    showQuickJumper
                    showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                    onChange={(page) => { updateSearchParams({ page }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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