import React, { useState, useEffect, useRef, startTransition, useMemo } from 'react';
import {
  Row,
  Col,
  Button,
  Carousel,
  Typography,
  Space,
  Skeleton,
  Card,
} from 'antd';
import {
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index.css';
import ProductCard from '../../components/ProductCard';
import { getHotProducts, getLatestProducts } from '../../api/home';
import { getCategoryBackground, getCategoryIcons } from '../../utils/theme';
import { message } from 'antd';
import { getStatusLabel } from '../../utils/labels';

const { Title, Paragraph } = Typography;


const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('hot');
  const isLoggedIn = !!localStorage.getItem('authUser');
  const [hotProducts, setHotProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const didFetchRef = useRef(false);
  // 分批渲染控制，减少首次渲染卡顿
  const [visibleHotCount, setVisibleHotCount] = useState(0);
  const [visibleRecentCount, setVisibleRecentCount] = useState(0);
  const chunkTimerRef = useRef(null);

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


  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    setLoading(true);
    (async () => {
      const [hotRes, latestRes] = await Promise.all([
        getHotProducts().catch(() => 'ERR_HOT'),
        getLatestProducts().catch(() => 'ERR_LATEST'),
      ]);
      startTransition(() => {
        if (hotRes !== 'ERR_HOT') {
          const raw = Array.isArray(hotRes) ? hotRes : (hotRes?.items || []);
          const filtered = raw.filter(p => getStatusLabel(p.status) === '在售');
          setHotProducts(filtered);
        } else {
          message.info('热门商品暂不可用');
          setHotProducts([]);
        }
        if (latestRes !== 'ERR_LATEST') {
          const raw = Array.isArray(latestRes) ? latestRes : (latestRes?.items || []);
          const filtered = raw.filter(p => getStatusLabel(p.status) === '在售');
          setRecentProducts(filtered);
        } else {
          message.info('最新发布暂不可用');
          setRecentProducts([]);
        }
      });
      setLoading(false);
    })();
  }, []);

  // 数据加载完成后，仅对当前激活标签分批增加可见的商品卡片数量
  useEffect(() => {
    if (loading) return;
    // 清理上一次的定时器
    if (chunkTimerRef.current) {
      clearTimeout(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }

    // 初始显示数量（首批）
    const INITIAL_CHUNK = 12;

    if (activeTab === 'hot') {
      setVisibleHotCount((c) => (c > 0 ? c : Math.min(INITIAL_CHUNK, hotProducts.length)));
    } else {
      setVisibleRecentCount((c) => (c > 0 ? c : Math.min(INITIAL_CHUNK, recentProducts.length)));
    }
  }, [loading, hotProducts, recentProducts, activeTab]);

  const bannerItems = [
    {
      title: '欢迎来到中易校园交易平台',
      subtitle: '安全、便捷、高效的校园交易体验',
      image: '/images/carousel/banner1-Vjwxq.jpg',
      action: () => navigate('/search?type=products')
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

  const hotCards = useMemo(() => (
    hotProducts.slice(0, visibleHotCount).map((product) => (
      <Col xs={24} sm={12} md={6} lg={6} xl={6} key={`hot-${product.id}`}>
        <ProductCard
          imageSrc={product.image}
          title={product.title}
          price={product.price}
          category={product.category}
          status={product.status}
          location={product.location}
          sellerName={product.seller?.name || product.seller}
          sellerId={product.sellerId || product.seller?.id}
          publishedAt={product.publishedAt}
          views={product.views}
          overlayType={'views-left'}
          dateFormat={'ymd'}
          onClick={() => navigate(`/products/${product.id}`)}
        />
      </Col>
    ))
  ), [hotProducts, visibleHotCount, navigate]);

  const recentCards = useMemo(() => (
    recentProducts.slice(0, visibleRecentCount).map((product) => (
      <Col xs={24} sm={12} md={6} lg={6} xl={6} key={`recent-${product.id}`}>
        <ProductCard
          imageSrc={product.image}
          title={product.title}
          price={product.price}
          category={product.category}
          status={product.status}
          location={product.location}
          sellerName={product.seller}
          sellerId={product.sellerId || product.seller?.id}
          publishedAt={product.publishTime}
          views={product.views}
          overlayType={'publish-right'}
          publishedOverlayText={formatRelativeTime(product.publishTime)}
          dateFormat={'ymd'}
          onClick={() => navigate(`/products/${product.id}`)}
        />
      </Col>
    ))
  ), [recentProducts, visibleRecentCount, navigate]);

  const categories = [
    { name: '数码电子', code: 'electronics' },
    { name: '图书教材', code: 'books' },
    { name: '生活用品', code: 'daily' },
    { name: '其他物品', code: 'other' }
  ];


  return (
    <div className="home-page">

      {/* 带轮播图背景的注册登录区域*/}
      {!isLoggedIn && (
        <section className="auth-carousel-section">
          <Carousel
            autoplay
            autoplaySpeed={4000}
            effect="fade"
            className="auth-carousel"
            dots={true}
            dotPosition="bottom"
            infinite={true}
          >
            {bannerItems.map((item, index) => (
              <div key={index} className="auth-carousel-item">
                <div className="auth-carousel-background">
                  <img src={item.image} alt={item.title} loading="lazy" decoding="async" fetchpriority="low" />
                  <div className="auth-carousel-overlay"></div>
                </div>
                <div className="auth-carousel-content">
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
          {/* 固定的注册、登录按钮区域 */}
          <div className="auth-fixed-buttons">
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
        </section>
      )}

      <div className="home-content">
        <section className="categories-section">
          <div className="section-bar">
            <div className="bar-title"><img src="/images/icons/category-title.svg" className="bar-icon" alt="分类图标" /> 商品分类</div>
            <div className="bar-actions">
            </div>
          </div>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={24}>
              <Row gutter={[16, 16]}>
                {categories.map((category, index) => (
                  <Col xs={12} sm={8} md={6} lg={6} key={index}>
                    <Card
                      className={`category-card category-${category.code}`}
                      style={{ background: getCategoryBackground(category.code) }}
                      hoverable
                      onClick={() => navigate(`/search?type=products&category=${category.code}`)}
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
            <Space size="middle" align="center">
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
              <Button
                type="link"
                onClick={() => navigate(activeTab === 'hot' ? '/search?type=products' : '/search?type=products&sortBy=latest')}
                icon={<RightOutlined />}
              >
                查看更多
              </Button>
            </Space>
          </div>
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              {loading ? (
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
                  {/* 当卡片数量多于初始显示数量时显示加载更多 */}
                  {activeTab === 'hot' && hotProducts.length > visibleHotCount && (
                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                      <Button onClick={() => setVisibleHotCount(prev => prev + 8)}>加载更多</Button>
                    </div>
                  )}

                  <Row
                    gutter={[16, 16]}
                    style={activeTab === 'recent' ? undefined : { display: 'none' }}
                    aria-hidden={activeTab !== 'recent'}
                  >
                    {recentCards}
                  </Row>
                  {/* 当卡片数量多于初始显示数量时显示加载更多 */}
                  {activeTab === 'recent' && recentProducts.length > visibleRecentCount && (
                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                      <Button onClick={() => setVisibleRecentCount(prev => prev + 8)}>加载更多</Button>
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