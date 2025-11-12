import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Row, 
  Col, 
  Select, 
  Pagination, 
  Slider, 
  Space,
  Empty,
  Spin,
  message
} from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './index.css';
import ProductCard from '../../components/ProductCard';
import { resolveImageSrc } from '../../utils/images';
import { searchProducts } from '../../api/products';
import { toCategoryCode } from '../../utils/labels';

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
      sortBy: searchParams.get('sortBy') || 'latest',
      status: searchParams.get('status') || '在售'
    };
    const arraysEqual = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
    setFilters(prev => {
      const changed = (
        prev.keyword !== nextFilters.keyword ||
        prev.category !== nextFilters.category ||
        prev.location !== nextFilters.location ||
        prev.sortBy !== nextFilters.sortBy ||
        prev.status !== nextFilters.status ||
        !arraysEqual(prev.priceRange, nextFilters.priceRange)
      );
      return changed ? nextFilters : prev;
    });
    setCurrentPage(prev => (prev !== nextPage ? nextPage : prev));
  }, [searchParams]);
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
    sortBy: sortByParam,
    status: searchParams.get('status') || '在售'
  });
  // 商品分类
  const categories = [
    { value: 'electronics', label: '数码电子' },
    { value: 'books', label: '图书教材' },
    { value: 'daily', label: '生活用品' },
    { value: 'other', label: '其他物品' }
  ];

  // 排序选项
  const sortOptions = [
    { value: 'latest', label: '最新发布' },
    { value: 'price-low', label: '价格从低到高' },
    { value: 'price-high', label: '价格从高到低' },
    { value: 'popular', label: '最受欢迎' }
  ];

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
      status: partial.status ?? filters.status,
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

  // 跳转到商品详情（稳定引用）
  const handleProductClick = useCallback((productId) => {
    if (!productId) { message.warning('\u65e0\u6cd5\u6253\u5f00\u5546\u54c1\u8be6\u60c5\uff1a\u7f3a\u5c11\u5546\u54c1ID'); return; }
    navigate(`/products/${productId}`);
  }, [navigate]);


  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const productCards = useMemo(() => (
    products.map((product, index) => (
      <Col key={product.id || product._id || `${product.title || 'item'}-${index}`} xs={24} sm={12} md={6} lg={6} xl={6}>
        <ProductCard
          imageSrc={resolveImageSrc({ product })}
          title={product.title}
          price={product.price}
          category={product.category}
          status={product.status}
          location={product.location}
          sellerName={typeof product.seller === 'string' ? product.seller : (product.seller?.name || '卖家')}
          publishedAt={product.publishTime}
          views={product.views}
          overlayType={'views-left'}
          dateFormat={'ymd'}
          onClick={() => handleProductClick(product.id ?? product._id)}
        />
      </Col>
    ))
  ), [products, handleProductClick]);

  return (
    <div className="products-page">
      <div className="container">
        {/* 搜索和筛选区域 */}
        <div className="search-filter-section">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={24}>
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
                  placeholder="出售状态"
                  style={{ width: 120 }}
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                >
                  <Option value="全部">全部</Option>
                  <Option value="在售">在售</Option>
                  <Option value="已下架">已下架</Option>
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
              style={{ width: 260, margin: '0 12px' }}
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
                  {productCards}
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