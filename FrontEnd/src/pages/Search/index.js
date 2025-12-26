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
import FollowButton from '../../components/FollowButton';
import { resolveImageSrc } from '../../utils/images';
import { searchProducts } from '../../api/products';
import { searchUsers, checkIsFollowing, followUser, unfollowUser, getFollows } from '../../api/user';
import { toCategoryCode } from '../../utils/labels';
import { getCurrentUserId, isSelf } from '../../utils/auth';
import { useLoginPrompt } from '../../components/LoginPromptModal';

const { Option } = Select;

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showLoginPrompt } = useLoginPrompt();
  
  // 搜索类型：products | users
  const searchType = searchParams.get('type') || 'products';

  // 状态管理
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [followingMap, setFollowingMap] = useState({}); // 存储用户的关注状态 { [userId]: boolean }
  const [currentPage, setCurrentPage] = useState(() => Math.max(1, parseInt(searchParams.get('p') || '1', 10) || 1));
  const [pageSize] = useState(12);
  
  // 初始分类参数（支持中文或代码），统一转为代码
  const initialCategoryParam = searchParams.get('c') || searchParams.get('category') || '';
  const normalizedCategory = toCategoryCode(initialCategoryParam) || '';

  const [filters, setFilters] = useState({
    keyword: searchParams.get('q') || searchParams.get('keyword') || '',
    category: normalizedCategory,
    priceRange: [0, 1000000],
    location: searchParams.get('loc') || searchParams.get('location') || '',
    sortBy: searchParams.get('sort') || searchParams.get('sortBy') || 'latest',
    status: searchParams.get('s') || searchParams.get('status') || '在售',
    // 用户搜索筛选
    followStatus: searchParams.get('f') || searchParams.get('followStatus') || 'all' // all | following | not_following
  });

  useEffect(() => {
    const nextPage = Math.max(1, parseInt(searchParams.get('p') || '1', 10) || 1);
    
    // 价格区间处理 - 支持新旧参数名
    const priceRangeParamUrl = searchParams.get('price') || searchParams.get('priceRange');
    const nextPriceRange = (() => {
      if (priceRangeParamUrl) {
        const parts = priceRangeParamUrl.split(',').map(n => Number(n));
        if (parts.length === 2 && parts.every(n => Number.isFinite(n))) return parts;
      }
      return [0, 1000000];
    })();

    const nextFilters = {
      keyword: searchParams.get('q') || searchParams.get('keyword') || '',
      category: toCategoryCode(searchParams.get('c') || searchParams.get('category') || '') || '',
      priceRange: nextPriceRange,
      location: searchParams.get('loc') || searchParams.get('location') || '',
      sortBy: searchParams.get('sort') || searchParams.get('sortBy') || 'latest',
      status: searchParams.get('s') || searchParams.get('status') || '在售',
      followStatus: searchParams.get('f') || searchParams.get('followStatus') || 'all'
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
        const currentUserId = getCurrentUserId();
        let followMap = {};
        let followingIds = new Set();

        // 如果需要筛选关注状态，先获取关注列表
        if (currentUserId && filters.followStatus !== 'all') {
          try {
            const follows = await getFollows();
            followingIds = new Set(follows.map(u => u.id));
          } catch {
            // 获取关注列表失败，忽略筛选
          }
        }

        // 根据筛选条件决定请求策略
        if (filters.followStatus === 'following' && currentUserId) {
          // 筛选"已关注"：直接使用关注列表，按关键词过滤
          const follows = await getFollows();
          let filteredItems = follows;
          
          // 按关键词过滤
          if (filters.keyword) {
            const kw = filters.keyword.toLowerCase();
            filteredItems = follows.filter(u => 
              (u.nickname || '').toLowerCase().includes(kw) ||
              (u.username || '').toLowerCase().includes(kw)
            );
          }

          // 构建关注状态映射
          filteredItems.forEach(u => { followMap[u.id] = true; });

          // 客户端分页
          const totalFiltered = filteredItems.length;
          const startIndex = (currentPage - 1) * pageSize;
          const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

          setUsers(paginatedItems);
          setTotal(totalFiltered);
          setFollowingMap(followMap);
        } else {
          // 筛选"全部"或"未关注"：从搜索API获取用户
          const { items: searchedItems, total: searchTotal } = await searchUsers({
            keyword: filters.keyword,
            page: filters.followStatus === 'not_following' ? 1 : currentPage,
            pageSize: filters.followStatus === 'not_following' ? 200 : pageSize,
          });

          // 获取关注列表用于标记状态
          if (currentUserId) {
            try {
              const follows = await getFollows();
              followingIds = new Set(follows.map(u => u.id));
              searchedItems.forEach(u => { followMap[u.id] = followingIds.has(u.id); });
            } catch {
              searchedItems.forEach(u => { followMap[u.id] = false; });
            }
          } else {
            searchedItems.forEach(u => { followMap[u.id] = false; });
          }

          if (filters.followStatus === 'not_following') {
            // 筛选未关注的用户
            const filteredItems = searchedItems.filter(u => !followingIds.has(u.id));
            const totalFiltered = filteredItems.length;
            const startIndex = (currentPage - 1) * pageSize;
            const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

            setUsers(paginatedItems);
            setTotal(totalFiltered);
          } else {
            // 全部用户，直接使用后端分页结果
            setUsers(searchedItems);
            setTotal(searchTotal);
          }
          setFollowingMap(followMap);
        }
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

  // 更新URL参数 - 只保留非默认值的参数
  const updateSearchParams = (partial) => {
    const params = new URLSearchParams();
    const currentType = partial.type ?? searchType;
    
    // 默认值定义
    const defaults = {
      type: 'products',
      page: 1,
      sortBy: 'latest',
      status: '在售',
      followStatus: 'all',
      priceRange: [0, 1000000]
    };

    // type: 只有 users 时才显示
    if (currentType !== defaults.type) {
      params.set('type', currentType);
    }

    // keyword: 有值才显示
    const keyword = partial.keyword !== undefined ? partial.keyword : filters.keyword;
    if (keyword) {
      params.set('q', keyword);
    }

    // page: 非第一页才显示
    const page = partial.page ?? currentPage;
    if (page > 1) {
      params.set('p', String(page));
    }

    if (currentType === 'products') {
      // category: 有值才显示
      const category = partial.category ?? filters.category;
      if (category) {
        params.set('c', category);
      }

      // status: 非默认值才显示
      const status = partial.status ?? filters.status;
      if (status && status !== defaults.status) {
        params.set('s', status);
      }

      // sortBy: 非默认值才显示
      const sortBy = partial.sortBy ?? filters.sortBy;
      if (sortBy && sortBy !== defaults.sortBy) {
        params.set('sort', sortBy);
      }

      // priceRange: 非默认值才显示
      const priceRange = partial.priceRange ?? filters.priceRange;
      if (priceRange[0] > 0 || priceRange[1] < 1000000) {
        params.set('price', priceRange.join(','));
      }

      // location: 有值才显示
      const location = partial.location ?? filters.location;
      if (location) {
        params.set('loc', location);
      }
    } else {
      // followStatus: 非默认值才显示
      const followStatus = partial.followStatus ?? filters.followStatus;
      if (followStatus && followStatus !== defaults.followStatus) {
        params.set('f', followStatus);
      }
    }

    setSearchParams(params);
  };

  const handleProductClick = useCallback((productId) => {
    if (!productId) { message.warning('无法打开商品详情：缺少商品ID'); return; }
    navigate(`/products/${productId}`);
  }, [navigate]);

  const handleUserClick = useCallback((userId) => {
    navigate(`/users/${userId}`);
  }, [navigate]);

  const handleFollow = async (e, userId) => {
    e.stopPropagation();
    // 检查是否关注自己
    if (isSelf(userId)) {
      message.warning('不能关注自己');
      return;
    }
    // 检查是否已登录
    if (!getCurrentUserId()) {
      showLoginPrompt({ message: '关注用户需要登录后才能进行' });
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
          images={product.images}
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
            
            {searchType === 'users' && (
              <>
                <div className="filter-divider" />
                
                <div className="filter-group">
                  <span className="filter-label">关注</span>
                  <Select
                    className="filter-select"
                    popupClassName="filter-dropdown"
                    suffixIcon={<span className="custom-arrow" />}
                    value={filters.followStatus}
                    onChange={(value) => handleFilterChange('followStatus', value)}
                  >
                    <Option value="all">全部用户</Option>
                    <Option value="following">已关注</Option>
                    <Option value="not_following">未关注</Option>
                  </Select>
                </div>
              </>
            )}

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
                    className="user-list"
                    renderItem={user => (
                      <List.Item>
                        <Card 
                          hoverable 
                          onClick={() => handleUserClick(user.id)} 
                          className="user-card"
                          bodyStyle={{ padding: 0 }}
                        >
                          <div className="user-card-content">
                            <Avatar 
                              size={72} 
                              src={user.avatar} 
                              icon={<UserOutlined />} 
                              className="user-card-avatar"
                            />
                            <div className="user-card-info">
                              <div className="user-card-name">
                                {user.nickname || user.username || '用户'}
                              </div>
                              {user.username && user.nickname && (
                                <div className="user-card-username">@{user.username}</div>
                              )}
                              <div className="user-card-bio">
                                {user.bio || '这个人很懒，什么都没写~'}
                              </div>
                            </div>
                          </div>
                          <div className="user-card-footer">
                            <div className="user-card-stats">
                              <span className="stat-item">
                                <span className="stat-value">{user.followersCount ?? 0}</span>
                                <span className="stat-label">粉丝</span>
                              </span>
                              <span className="stat-divider" />
                              <span className="stat-item">
                                <span className="stat-value">{user.followingCount ?? 0}</span>
                                <span className="stat-label">关注</span>
                              </span>
                            </div>
                            <FollowButton 
                              isFollowing={followingMap[user.id]}
                              size="small"
                              onClick={(e) => handleFollow(e, user.id)}
                            />
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
