import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Row, 
  Col, 
  Select, 
  Pagination, 
  Input,
  Space,
  Empty,
  Spin,
  message,
  List,
  Avatar,
  Button,
  Card
} from 'antd';
import { 
  UserOutlined,
  ShoppingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './index.css';
import ProductCard from '../../components/ProductCard';
import { resolveImageSrc } from '../../utils/images';
import { searchProducts } from '../../api/products';
import { searchUsers, checkIsFollowing, followUser, unfollowUser } from '../../api/user';
import { toCategoryCode } from '../../utils/labels';

const { Option } = Select;

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 搜索类型：products | users
  const searchType = searchParams.get('type') || 'products';

  // 状态管理
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [followingMap, setFollowingMap] = useState({}); // 存储用户的关注状态 { [userId]: boolean }
  const [currentPage, setCurrentPage] = useState(() => Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1));
  const [pageSize] = useState(12);
  
  // 初始分类参数（支持中文或代码），统一转为代码
  const initialCategoryParam = searchParams.get('category') || '';
  const normalizedCategory = toCategoryCode(initialCategoryParam) || '';

  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    category: normalizedCategory,
    priceRange: [0, 1000000],
    location: searchParams.get('location') || '',
    sortBy: searchParams.get('sortBy') || 'latest',
    status: searchParams.get('status') || '在售'
  });

  useEffect(() => {
    const nextPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    
    // 价格区间处理
    const priceRangeParamUrl = searchParams.get('priceRange');
    const nextPriceRange = (() => {
      if (priceRangeParamUrl) {
        const parts = priceRangeParamUrl.split(',').map(n => Number(n));
        if (parts.length === 2 && parts.every(n => Number.isFinite(n))) return parts;
      }
      return [0, 1000000];
    })();

    const nextFilters = {
      keyword: searchParams.get('keyword') || '',
      category: toCategoryCode(searchParams.get('category') || '') || '',
      priceRange: nextPriceRange,
      location: searchParams.get('location') || '',
      sortBy: searchParams.get('sortBy') || 'latest',
      status: searchParams.get('status') || '在售'
    };

    setFilters(nextFilters);
    setCurrentPage(prev => (prev !== nextPage ? nextPage : prev));
  }, [searchParams]);

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

  // 获取数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (searchType === 'products') {
        const { items, total } = await searchProducts({
          ...filters,
          page: currentPage,
          pageSize,
        });
        setProducts(items);
        setTotal(total);
      } else {
        const { items, total } = await searchUsers({
          keyword: filters.keyword,
          page: currentPage,
          pageSize,
        });
        setUsers(items);
        setTotal(total);

        // 批量检查关注状态
        const checks = items.map(u => checkIsFollowing(u.id).then(isFollowing => ({ id: u.id, isFollowing })));
        const results = await Promise.all(checks);
        const map = {};
        results.forEach(r => { map[r.id] = r.isFollowing; });
        setFollowingMap(map);
      }
    } catch (error) {
      message.error(error.message || '获取搜索结果失败');
    } finally {
      setLoading(false);
    }
  }, [searchType, filters, currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 处理筛选
  const handleFilterChange = (key, value) => {
    updateSearchParams({ [key]: value, page: 1 });
  };

  // 切换搜索类型
  const handleTypeChange = (type) => {
    updateSearchParams({ type, page: 1 });
  };

  // 更新URL参数
  const updateSearchParams = (partial) => {
    const params = new URLSearchParams(searchParams);
    const currentType = partial.type ?? searchType;
    
    const entries = {
      type: currentType,
      keyword: partial.keyword !== undefined ? partial.keyword : filters.keyword,
      page: partial.page ?? currentPage
    };

    // 只有商品搜索才需要这些筛选参数
    if (currentType === 'products') {
      Object.assign(entries, {
        category: partial.category ?? filters.category,
        priceRange: partial.priceRange ?? filters.priceRange,
        location: partial.location ?? filters.location,
        sortBy: partial.sortBy ?? filters.sortBy,
        status: partial.status ?? filters.status,
      });
    } else {
      // 切换到用户搜索时，清除商品特有的筛选参数
      params.delete('category');
      params.delete('priceRange');
      params.delete('location');
      params.delete('sortBy');
      params.delete('status');
    }

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

  const handleProductClick = useCallback((productId) => {
    if (!productId) { message.warning('无法打开商品详情：缺少商品ID'); return; }
    navigate(`/products/${productId}`);
  }, [navigate]);

  const handleUserClick = useCallback((userId) => {
    navigate(`/users/${userId}`);
  }, [navigate]);

  // 获取当前登录用户ID
  const getCurrentUserId = () => {
    try {
      const raw = localStorage.getItem('authUser');
      if (raw) {
        const user = JSON.parse(raw);
        return user?.id;
      }
    } catch {}
    return null;
  };

  const handleFollow = async (e, userId) => {
    e.stopPropagation();
    // 检查是否关注自己
    const currentUserId = getCurrentUserId();
    if (currentUserId && String(currentUserId) === String(userId)) {
      message.warning('不能关注自己');
      return;
    }
    try {
      const isFollowing = followingMap[userId];
      if (isFollowing) {
        await unfollowUser(userId);
        message.success('已取消关注');
      } else {
        await followUser(userId);
        message.success('关注成功');
      }
      setFollowingMap(prev => ({ ...prev, [userId]: !isFollowing }));
    } catch (error) {
      message.error('操作失败');
    }
  };

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
          sellerName={typeof product.seller === 'string' ? product.seller : (product.seller?.nickname || '卖家')}
          sellerId={typeof product.seller === 'object' ? product.seller?.id : product.sellerId}
          sellerAvatar={typeof product.seller === 'object' ? product.seller?.avatar : product.sellerAvatar}
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
    <div className="search-page">
      <div className="container">
        {/* 筛选区域 */}
        <div className="search-filter-section">
          <div className="filter-controls">
            {/* 搜索类型切换 - 参考首页热门商品/最新发布的滑块效果 */}
            <div className="filter-group filter-group-type">
              <div className="search-type-switch">
                <div 
                  className="switch-slider" 
                  style={{ transform: searchType === 'products' ? 'translateX(0)' : 'translateX(100%)' }}
                />
                <button 
                  className={`switch-btn ${searchType === 'products' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('products')}
                >
                  <ShoppingOutlined className="switch-icon" />
                  搜商品
                </button>
                <button 
                  className={`switch-btn ${searchType === 'users' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('users')}
                >
                  <TeamOutlined className="switch-icon" />
                  搜用户
                </button>
              </div>
            </div>
            
            {searchType === 'products' && (
              <>
                <div className="filter-divider" />
                
                <div className="filter-group">
                  <span className="filter-label">分类</span>
                  <Select
                    placeholder="全部分类"
                    allowClear
                    className="filter-select"
                    popupClassName="filter-dropdown"
                    suffixIcon={<span className="custom-arrow" />}
                    value={filters.category || undefined}
                    onChange={(value) => handleFilterChange('category', value || '')}
                  >
                    {categories.map(cat => (
                      <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                    ))}
                  </Select>
                </div>
                
                <div className="filter-group">
                  <span className="filter-label">状态</span>
                  <Select
                    placeholder="出售状态"
                    className="filter-select"
                    popupClassName="filter-dropdown"
                    suffixIcon={<span className="custom-arrow" />}
                    value={filters.status}
                    onChange={(value) => handleFilterChange('status', value)}
                  >
                    <Option value="全部">全部</Option>
                    <Option value="在售">在售</Option>
                    <Option value="已下架">已下架</Option>
                  </Select>
                </div>

                <div className="filter-group">
                  <span className="filter-label">排序</span>
                  <Select
                    placeholder="排序方式"
                    className="filter-select filter-select-wide"
                    popupClassName="filter-dropdown"
                    suffixIcon={<span className="custom-arrow" />}
                    value={filters.sortBy}
                    onChange={(value) => handleFilterChange('sortBy', value)}
                  >
                    {sortOptions.map(option => (
                      <Option key={option.value} value={option.value}>{option.label}</Option>
                    ))}
                  </Select>
                </div>

                <div className="filter-divider" />

                {/* 价格筛选 */}
                <div className="filter-group filter-group-price">
                  <span className="filter-label">价格</span>
                  <div className="price-inputs">
                    <Input
                      type="number"
                      min={0}
                      value={filters.priceRange[0] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const min = val === '' ? 0 : Math.max(0, Number(val));
                        const max = filters.priceRange[1];
                        handleFilterChange('priceRange', [min, max]);
                      }}
                      placeholder="最低价"
                      className="price-input"
                    />
                    <span className="price-separator">—</span>
                    <Input
                      type="number"
                      min={0}
                      value={filters.priceRange[1] === 1000000 ? '' : filters.priceRange[1]}
                      onChange={(e) => {
                        const val = e.target.value;
                        const max = val === '' ? 1000000 : Math.max(0, Number(val));
                        const min = filters.priceRange[0];
                        handleFilterChange('priceRange', [min, max]);
                      }}
                      placeholder="最高价"
                      className="price-input"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 结果列表 */}
        <div className="results-section">
          <div className="section-header">
            <h2>{searchType === 'products' ? '商品列表' : '用户列表'}</h2>
            <span className="total-count">共 {total} 条结果</span>
          </div>
          
          <Spin spinning={loading}>
            {searchType === 'products' ? (
              products.length > 0 ? (
                <>
                  <Row gutter={[16, 16]}>
                    {productCards}
                  </Row>
                  
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
                <Empty description="暂无商品" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )
            ) : (
              users.length > 0 ? (
                <>
                  <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
                    dataSource={users}
                    renderItem={user => (
                      <List.Item>
                        <Card hoverable onClick={() => handleUserClick(user.id)} bodyStyle={{ padding: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                            <Avatar size={64} src={user.avatar} icon={<UserOutlined />} />
                            <div style={{ marginLeft: 16, overflow: 'hidden' }}>
                              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user.nickname || user.username}
                              </h3>
                              <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                                {user.school || '未知学校'}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                            <div style={{ color: '#666', fontSize: 14, height: 42, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', flex: 1, marginRight: 8 }}>
                              {user.bio || '这个人很懒，什么都没写'}
                            </div>
                            <Button 
                              type={followingMap[user.id] ? 'default' : 'primary'}
                              size="small"
                              onClick={(e) => handleFollow(e, user.id)}
                            >
                              {followingMap[user.id] ? '已关注' : '关注'}
                            </Button>
                          </div>
                        </Card>
                      </List.Item>
                    )}
                  />
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
                <Empty description="未找到相关用户" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )
            )}
          </Spin>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
