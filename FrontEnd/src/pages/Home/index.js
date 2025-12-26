import React, { useState, useEffect, useRef, startTransition, useMemo, useCallback } from 'react';
import {
  Row,
  Col,
  Button,
  Carousel,
  Typography,
  Space,
  Skeleton,
  Card,
  Spin,
} from 'antd';
import {
  RightOutlined,
  DownOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index.css';
import ProductCard from '../../components/ProductCard';
import { getHotProducts, getLatestProducts } from '../../api/home';
import { getCategoryIcons } from '../../utils/theme';
import { message } from 'antd';
import { getStatusLabel } from '../../utils/labels';
import { isLoggedIn as checkIsLoggedIn } from '../../utils/auth';

const { Title, Paragraph } = Typography;

// 粒子组件 - 使用 React.memo 避免不必要的重渲染
const Particles = React.memo(({ count = 30 }) => {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.2,
    }));
  }, [count]);

  return (
    <div className="particles-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
});

const PAGE_SIZE = 12;

// 将 formatRelativeTime 移到组件外部，避免重复创建
const formatRelativeTime = (iso) => {
  try {
    if (!iso) return '刚刚';
    const t = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - t);
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return '刚刚';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}分钟前`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour}小时前`;
    const day = Math.floor(hour / 24);
    if (day === 1) return '昨天';
    if (day < 7) return `${day}天前`;
    const d = new Date(t);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  } catch {
    return '刚刚';
  }
};


const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('hot');
  const loggedIn = checkIsLoggedIn();
  
  // 热门商品状态
  const [hotProducts, setHotProducts] = useState([]);
  const [hotPage, setHotPage] = useState(1);
  const [hotHasMore, setHotHasMore] = useState(true);
  const [hotLoading, setHotLoading] = useState(false);
  
  // 最新发布状态
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentPage, setRecentPage] = useState(1);
  const [recentHasMore, setRecentHasMore] = useState(true);
  const [recentLoading, setRecentLoading] = useState(false);
  
  const [initialLoading, setInitialLoading] = useState(true);
  const didFetchRef = useRef(false);
  
  // 无限滚动观察器
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);
  
  // 页面展开状态
  const [isExpanded, setIsExpanded] = useState(loggedIn);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(null);
  const heroRef = useRef(null);
  
  // 使用 ref 追踪加载状态和页码，避免闭包问题
  const hotLoadingRef = useRef(false);
  const recentLoadingRef = useRef(false);
  const hotPageRef = useRef(1);
  const recentPageRef = useRef(1);
  const hotHasMoreRef = useRef(true);
  const recentHasMoreRef = useRef(true);
  const activeTabRef = useRef('hot');

  // 检查是否可以触发返回过渡
  const canTriggerCollapse = useCallback(() => {
    return isExpanded && !isTransitioning && window.scrollY === 0;
  }, [isExpanded, isTransitioning]);

  // 向上返回处理
  const handleCollapseTransition = useCallback(() => {
    if (!canTriggerCollapse()) return;
    setIsTransitioning(true);
    setTransitionDirection('up');
    // 状态重置将由 onAnimationEnd 处理
  }, [canTriggerCollapse]);

  // 处理动画结束事件，重置过渡状态
  const handleAnimationEnd = useCallback((e) => {
    // 只处理 home-content 的动画结束事件
    if (e.target.classList.contains('home-content')) {
      if (transitionDirection === 'up') {
        // 延迟重置状态，确保轮播图元素淡入动画完成
        requestAnimationFrame(() => {
          setIsExpanded(false);
          setIsTransitioning(false);
          setTransitionDirection(null);
        });
      } else if (transitionDirection === 'down') {
        setIsExpanded(true);
        setIsTransitioning(false);
        setTransitionDirection(null);
      }
    }
  }, [transitionDirection]);

  // 派发首页展开状态变化事件给 Header
  useEffect(() => {
    const event = new CustomEvent('homeExpandChange', {
      detail: {
        isExpanded,
        isTransitioning,
        transitionDirection
      }
    });
    window.dispatchEvent(event);
  }, [isExpanded, isTransitioning, transitionDirection]);

  // 监听滚轮事件，实现一次下滑展开
  useEffect(() => {
    if (isExpanded) return;
    
    const handleWheel = (e) => {
      if (isTransitioning) return;
      
      // 向下滚动时展开
      if (e.deltaY > 0) {
        e.preventDefault();
        setIsTransitioning(true);
        setTransitionDirection('down');
        // 状态重置将由 onAnimationEnd 处理
      }
    };
    
    // 监听触摸滑动（移动端）
    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e) => {
      if (isTransitioning || isExpanded) return;
      const touchEndY = e.touches[0].clientY;
      const deltaY = touchStartY - touchEndY;
      
      // 向上滑动（手指向上）时展开
      if (deltaY > 50) {
        e.preventDefault();
        setIsTransitioning(true);
        setTransitionDirection('down');
        // 状态重置将由 onAnimationEnd 处理
      }
    };
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isExpanded, isTransitioning]);

  // 监听滚轮事件，支持向上滑动返回轮播图
  useEffect(() => {
    if (!isExpanded) return;
    
    const handleWheelCollapse = (e) => {
      if (isTransitioning) return;
      
      // 向上滚动（deltaY < 0）且页面在顶部时返回轮播图
      if (e.deltaY < 0 && window.scrollY === 0) {
        e.preventDefault();
        handleCollapseTransition();
      }
    };
    
    window.addEventListener('wheel', handleWheelCollapse, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleWheelCollapse);
    };
  }, [isExpanded, isTransitioning, handleCollapseTransition]);

  // 监听触摸事件，支持向下滑动返回轮播图（移动端）
  useEffect(() => {
    if (!isExpanded) return;
    
    let touchStartY = 0;
    
    const handleTouchStartCollapse = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchMoveCollapse = (e) => {
      if (isTransitioning) return;
      
      const touchEndY = e.touches[0].clientY;
      const deltaY = touchEndY - touchStartY; // 正值表示手指向下移动
      
      // 向下滑动（手指向下移动）超过阈值且页面在顶部时返回轮播图
      if (deltaY > 50 && window.scrollY === 0) {
        e.preventDefault();
        handleCollapseTransition();
      }
    };
    
    window.addEventListener('touchstart', handleTouchStartCollapse, { passive: true });
    window.addEventListener('touchmove', handleTouchMoveCollapse, { passive: false });
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStartCollapse);
      window.removeEventListener('touchmove', handleTouchMoveCollapse);
    };
  }, [isExpanded, isTransitioning, handleCollapseTransition]);

  // 点击箭头展开
  const handleExpandClick = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTransitionDirection('down');
    // 状态重置将由 onAnimationEnd 处理
  }, [isTransitioning]);

  // 同步 ref 值
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);
  
  useEffect(() => {
    hotPageRef.current = hotPage;
    hotHasMoreRef.current = hotHasMore;
  }, [hotPage, hotHasMore]);
  
  useEffect(() => {
    recentPageRef.current = recentPage;
    recentHasMoreRef.current = recentHasMore;
  }, [recentPage, recentHasMore]);

  // 加载热门商品
  const loadHotProducts = useCallback(async (page = 1, append = false) => {
    if (hotLoadingRef.current) return;
    hotLoadingRef.current = true;
    setHotLoading(true);
    try {
      const res = await getHotProducts(page, PAGE_SIZE);
      const items = res.items || res;
      const filtered = (Array.isArray(items) ? items : []).filter(p => getStatusLabel(p.status) === '在售');
      
      startTransition(() => {
        if (append) {
          // 使用 id 去重，防止重复数据
          setHotProducts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newItems = filtered.filter(p => !existingIds.has(p.id));
            return [...prev, ...newItems];
          });
        } else {
          setHotProducts(filtered);
        }
        setHotHasMore(res.hasMore ?? filtered.length >= PAGE_SIZE);
        setHotPage(page);
      });
    } catch (e) {
      if (page === 1) message.info('热门商品暂不可用');
    } finally {
      hotLoadingRef.current = false;
      setHotLoading(false);
    }
  }, []);

  // 加载最新发布
  const loadRecentProducts = useCallback(async (page = 1, append = false) => {
    if (recentLoadingRef.current) return;
    recentLoadingRef.current = true;
    setRecentLoading(true);
    try {
      const res = await getLatestProducts(page, PAGE_SIZE);
      const items = res.items || res;
      const filtered = (Array.isArray(items) ? items : []).filter(p => getStatusLabel(p.status) === '在售');
      
      startTransition(() => {
        if (append) {
          // 使用 id 去重，防止重复数据
          setRecentProducts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newItems = filtered.filter(p => !existingIds.has(p.id));
            return [...prev, ...newItems];
          });
        } else {
          setRecentProducts(filtered);
        }
        setRecentHasMore(res.hasMore ?? filtered.length >= PAGE_SIZE);
        setRecentPage(page);
      });
    } catch (e) {
      if (page === 1) message.info('最新发布暂不可用');
    } finally {
      recentLoadingRef.current = false;
      setRecentLoading(false);
    }
  }, []);

  // 加载更多 - 使用 ref 避免依赖变化导致重新创建
  const loadMore = useCallback(() => {
    if (activeTabRef.current === 'hot') {
      if (hotHasMoreRef.current && !hotLoadingRef.current) {
        loadHotProducts(hotPageRef.current + 1, true);
      }
    } else {
      if (recentHasMoreRef.current && !recentLoadingRef.current) {
        loadRecentProducts(recentPageRef.current + 1, true);
      }
    }
  }, [loadHotProducts, loadRecentProducts]);

  // 初始加载
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    
    (async () => {
      await Promise.all([
        loadHotProducts(1),
        loadRecentProducts(1)
      ]);
      setInitialLoading(false);
    })();
  }, []);

  // 无限滚动 - IntersectionObserver（使用稳定的 loadMore 引用）
  useEffect(() => {
    if (!isExpanded) return;
    
    const currentLoadMoreRef = loadMoreRef.current;
    
    // 只在 observer 不存在时创建
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMore();
          }
        },
        { rootMargin: '200px' }
      );
    }
    
    if (currentLoadMoreRef) {
      observerRef.current.observe(currentLoadMoreRef);
    }
    
    return () => {
      if (currentLoadMoreRef && observerRef.current) {
        observerRef.current.unobserve(currentLoadMoreRef);
      }
    };
  }, [isExpanded, loadMore]);

  const bannerItems = [
    {
      title: '欢迎来到中易校园交易平台',
      subtitle: '安全、便捷、高效的校园交易体验',
      image: '/images/carousel/banner1-Vjwxq.jpg',
      action: () => navigate('/search')
    },
    {
      title: '发布你的闲置物品',
      subtitle: '让闲置物品重新焕发价值',
      image: '/images/carousel/banner2-38SxR.jpg',
      action: () => navigate('/publish')
    },
    {
      title: '加入校园交易社区',
      subtitle: '与同校同学安全交易',
      image: '/images/carousel/banner3-1mewp.jpg',
      action: () => navigate('/register')
    }
  ];

  // 商品点击处理 - 使用 useCallback 避免重复创建
  const handleProductClick = useCallback((productId) => {
    navigate(`/products/${productId}`);
  }, [navigate]);

  // 预计算相对时间，避免在 useMemo 中重复计算
  const recentProductsWithTime = useMemo(() => {
    return recentProducts.map(product => ({
      ...product,
      relativeTime: formatRelativeTime(product.publishTime)
    }));
  }, [recentProducts]);

  const hotCards = useMemo(() => (
    hotProducts.map((product) => (
      <Col xs={24} sm={12} md={6} lg={6} xl={6} key={`hot-${product.id}`}>
        <ProductCard
          imageSrc={product.image}
          images={product.images}
          title={product.title}
          price={product.price}
          category={product.category}
          status={product.status}
          location={product.location}
          sellerName={product.seller?.nickname || product.seller?.username || product.seller}
          sellerId={product.sellerId || product.seller?.id}
          sellerAvatar={product.sellerAvatar || product.seller?.avatar}
          publishedAt={product.publishedAt}
          views={product.views}
          overlayType={'views-left'}
          dateFormat={'ymd'}
          onClick={() => handleProductClick(product.id)}
        />
      </Col>
    ))
  ), [hotProducts, handleProductClick]);

  const recentCards = useMemo(() => (
    recentProductsWithTime.map((product) => (
      <Col xs={24} sm={12} md={6} lg={6} xl={6} key={`recent-${product.id}`}>
        <ProductCard
          imageSrc={product.image}
          images={product.images}
          title={product.title}
          price={product.price}
          category={product.category}
          status={product.status}
          location={product.location}
          sellerName={product.seller}
          sellerId={product.sellerId || product.seller?.id}
          sellerAvatar={product.sellerAvatar || product.seller?.avatar}
          publishedAt={product.publishTime}
          views={product.views}
          overlayType={'publish-right'}
          publishedOverlayText={product.relativeTime}
          dateFormat={'ymd'}
          onClick={() => handleProductClick(product.id)}
        />
      </Col>
    ))
  ), [recentProductsWithTime, handleProductClick]);

  // 当前是否正在加载
  const isLoadingMore = activeTab === 'hot' ? hotLoading : recentLoading;
  const hasMore = activeTab === 'hot' ? hotHasMore : recentHasMore;

  const categories = [
    { name: '数码电子', code: 'electronics' },
    { name: '图书教材', code: 'books' },
    { name: '生活用品', code: 'daily' },
    { name: '其他物品', code: 'other' }
  ];


  return (
    <div className={`home-page ${!isExpanded ? 'hero-mode' : ''} ${isTransitioning ? 'transitioning' : ''} ${isExpanded ? 'expanded' : ''} ${transitionDirection === 'down' ? 'transition-down' : ''} ${transitionDirection === 'up' ? 'transition-up' : ''}`}>

      {/* 轮播图背景 */}
      <section 
        className={`auth-carousel-section ${isExpanded ? 'as-background' : ''} ${isTransitioning ? 'fading' : ''}`}
        ref={heroRef}
      >
        <Particles count={30} />
        <Carousel
          autoplay
          autoplaySpeed={4000}
          className="auth-carousel"
          dots={false}
          dotPosition="bottom"
          infinite={true}
          effect="fade"
          pauseOnHover={false}
          pauseOnFocus={false}
          pauseOnDotsHover={false}
        >
          {bannerItems.map((item, index) => (
            <div key={index} className="auth-carousel-item">
              <div className="auth-carousel-background">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  loading="lazy" 
                  decoding="async" 
                  fetchpriority="low"
                />
                <div className="auth-carousel-overlay"></div>
              </div>
              <div className={`auth-carousel-content ${isTransitioning ? 'fade-out' : ''}`}>
                <div className="auth-content-wrapper">
                  <Title level={1} className="auth-main-title">
                    {item.title}
                  </Title>
                  <Paragraph className="auth-main-subtitle">
                    {item.subtitle}
                  </Paragraph>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
        {/* 注册、登录按钮区域（仅未登录时显示） */}
        {!loggedIn && (
          <div className={`auth-fixed-buttons ${isTransitioning ? 'fade-out' : ''}`}>
            <div className="auth-buttons-container">
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/register')}
                className="auth-main-button register-button"
              >
                注册
              </Button>
              <Button
                size="large"
                onClick={() => navigate('/login')}
                className="auth-main-button login-button"
              >
                登录
              </Button>
            </div>
          </div>
        )}
        {/* 向下滚动提示箭头 */}
        {!isExpanded && (
          <div className={`scroll-indicator ${isTransitioning ? 'fade-out' : ''}`} onClick={handleExpandClick}>
            <DownOutlined className="scroll-arrow" />
          </div>
        )}
      </section>

      <div 
        className={`home-content ${!isExpanded && !isTransitioning ? 'hidden' : ''}`}
        onAnimationEnd={handleAnimationEnd}
      >
        <section className="categories-section">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={24}>
              <Row gutter={[16, 16]}>
                {categories.map((category, index) => (
                  <Col xs={12} sm={8} md={6} lg={6} key={index}>
                    <Card
                      className={`category-card category-${category.code}`}
                      hoverable
                      onClick={() => navigate(`/search?c=${category.code}`)}
                    >
                      <div className="category-content">
                        <div className="category-icon">
                          {(() => {
                            const icons = getCategoryIcons(category.code);
                            const countClass = `icon-count-${icons.length}`;
                            return (
                              <div className={`category-icon-group ${countClass}`}>
                                {icons.map((src, i) => (
                                  <img
                                    key={`${category.code}-${i}`}
                                    className="category-icon-img"
                                    src={src}
                                    alt={`${category.name}-${i + 1}`}
                                    loading="lazy"
                                    decoding="async"
                                  />
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="category-name">{category.name}</div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>

          </Row>
        </section>

        {/* 热门商品/最新发布 */}
        <section className="hot-products-section">
          <div className="section-header">
            <Space size="middle" align="center" className={activeTab === 'recent' ? 'tab-recent' : 'tab-hot'}>
              <Button
                shape="round"
                type={activeTab === 'hot' ? 'primary' : 'default'}
                icon={<img src="/images/icons/star_6024697.svg" className="section-icon" alt="热门商品" />}
                onClick={() => startTransition(() => setActiveTab('hot'))}
              >
                热门商品
              </Button>
              <Button
                shape="round"
                type={activeTab === 'recent' ? 'primary' : 'default'}
                icon={<img src="/images/icons/innovation_11511322.svg" className="section-icon" alt="最新发布" />}
                onClick={() => startTransition(() => setActiveTab('recent'))}
              >
                最新发布
              </Button>
            </Space>
            <Button
              type="link"
              onClick={() => navigate(activeTab === 'hot' ? '/search' : '/search?sort=latest')}
              icon={<RightOutlined />}
            >
              查看更多
            </Button>
          </div>
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              {initialLoading ? (
                <Row gutter={[16, 16]}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Col xs={24} sm={12} md={6} lg={6} xl={6} key={`skeleton-${i}`}>
                      <Card className="product-card">
                        <Skeleton.Image style={{ width: '100%', height: 160, borderRadius: 8 }} active />
                        <div style={{ marginTop: 12 }}>
                          <Skeleton active paragraph={{ rows: 2 }} title={{ width: '60%' }} />
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <>
                  <Row
                    gutter={[16, 16]}
                    style={activeTab === 'hot' ? undefined : { display: 'none' }}
                    aria-hidden={activeTab !== 'hot'}
                  >
                    {hotCards}
                  </Row>

                  <Row
                    gutter={[16, 16]}
                    style={activeTab === 'recent' ? undefined : { display: 'none' }}
                    aria-hidden={activeTab !== 'recent'}
                  >
                    {recentCards}
                  </Row>
                  
                  {/* 无限滚动触发器 */}
                  <div 
                    ref={loadMoreRef} 
                    className="load-more-trigger"
                    style={{ 
                      height: 1, 
                      marginTop: 24,
                      display: hasMore ? 'block' : 'none'
                    }} 
                  />
                  
                  {/* 加载中提示 */}
                  {isLoadingMore && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                      <div style={{ marginTop: 8, color: '#888', fontSize: 14 }}>加载中...</div>
                    </div>
                  )}
                  
                  {/* 没有更多数据提示 */}
                  {!hasMore && !isLoadingMore && (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#999', fontSize: 14 }}>
                      已经到底啦 ~
                    </div>
                  )}
                </>
              )}
            </Col>
          </Row>
        </section>
      </div>
    </div>
  );
};

export default Home;