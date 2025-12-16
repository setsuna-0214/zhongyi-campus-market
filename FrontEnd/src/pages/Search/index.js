import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Row, 
  Col, 
  Select, 
  Pagination, 
  InputNumber,
  Space,
  Empty,
  Spin,
  message,
  Radio,
  List,
  Avatar,
  Button,
  Card,
  Input
} from 'antd';
import { 
  UserOutlined,
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
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    updateSearchParams({ type: newType, page: 1 });
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
        {/* 搜索和筛选区域 */}
        <div className="search-filter-section">
          <Row gutter={[16, 16]} align="middle">
            <Col flex="none">
              <Radio.Group value={searchType} onChange={handleTypeChange} buttonStyle="solid">
                <Radio.Button value="products">搜商品</Radio.Button>
                <Radio.Button value="users">搜用户</Radio.Button>
              </Radio.Group>
            </Col>
            
            <Col flex="auto">
              <Input.Search
                placeholder={searchType === 'products' ? '搜索商品名称或描述' : '搜索用户昵称'}
                value={filters.keyword}
                onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                onSearch={(value) => handleFilterChange('keyword', value)}
                style={{ maxWidth: 400 }}
                enterButton="搜索"
                size="large"
                allowClear
              />
            </Col>
          </Row>
          
          {searchType === 'products' && (
            <Row gutter={[16, 16]} align="middle" style={{ marginTop: 16 }}>
              <Col flex="auto">
                <Space size="middle" className="filter-controls" wrap>
                  <Select
                    placeholder="商品分类"
                    allowClear
                    style={{ width: 120 }}
                    value={filters.category || undefined}
                    onChange={(value) => handleFilterChange('category', value || '')}
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

                  {/* 价格筛选 */}
                  <Space size="small">
                    <span>价格：</span>
                    <InputNumber
                      min={0}
                      max={1000000}
                      value={filters.priceRange[0]}
                      onChange={(value) => {
                        const min = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
                        const max = filters.priceRange[1];
                        handleFilterChange('priceRange', [min, max]);
                      }}
                      placeholder="最低价"
                      style={{ width: 100 }}
                    />
                    <span>~</span>
                    <InputNumber
                      min={0}
                      max={1000000}
                      value={filters.priceRange[1]}
                      onChange={(value) => {
                        const max = typeof value === 'number' && !Number.isNaN(value) ? value : 1000000;
                        const min = filters.priceRange[0];
                        handleFilterChange('priceRange', [min, max]);
                      }}
                      placeholder="最高价"
                      style={{ width: 100 }}
                    />
                  </Space>
                </Space>
              </Col>
            </Row>
          )}
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
