import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Carousel, 
  Typography, 
  Space,
  Tag,
  Avatar,
  List
} from 'antd';
import { 
  UserOutlined, 
  RightOutlined,
  EyeOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { getHotProducts, getLatestProducts, getHomeStats } from '../../api/home';
import { CATEGORY_THEMES, getCategoryBackground, getCategoryIcons } from '../../utils/theme';
import { message } from 'antd';
import { getCategoryLabel, getStatusLabel, getStatusColor } from '../../utils/labels';

const { Title, Paragraph } = Typography;


const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('hot');
  const isLoggedIn = !!localStorage.getItem('authUser');
  const [stats, setStats] = useState(null);
  const [hotProducts, setHotProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [topSellers, setTopSellers] = useState([]);

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
    (async () => {
      try {
        const hot = await getHotProducts();
        setHotProducts(Array.isArray(hot) ? hot : (hot?.items || []));
      } catch (err) {
        message.info('热门商品暂不可用');
      }
      try {
        const latest = await getLatestProducts();
        setRecentProducts(Array.isArray(latest) ? latest : (latest?.items || []));
      } catch (err) {
        message.info('最新发布暂不可用');
      }
      try {
        const s = await getHomeStats();
        setStats(s);
      } catch (err) {
        // ignore stats errors
      }
    })();
  }, []);

  const bannerItems = [
    {
      title: '欢迎来到中易校园二手交易平台',
      subtitle: '安全、便捷、高效的校园交易体验',
      image: '/images/carousel/carousel-1.svg',
      action: () => navigate('/products')
    },
    {
      title: '发布你的闲置物品',
      subtitle: '让闲置物品重新焕发价值',
      image: '/images/carousel/carousel-2.svg',
      action: () => navigate('/publish')
    },
    {
      title: '加入校园交易社区',
      subtitle: '与同校同学安全交易',
      image: '/images/carousel/carousel-3.svg',
      action: () => navigate('/register')
    }
  ];

  const categories = [
    { name: '数码电子', code: 'electronics' },
    { name: '图书教材', code: 'books' },
    { name: '生活用品', code: 'daily' },
    { name: '其他物品', code: 'other' }
  ];


  const CATEGORY_COUNT_KEY = {
    electronics: 'digital',
    books: 'books',
    daily: 'home',
    other: 'other'
  };

  return (
    <div className="home-page">

      {/* 带轮播图背景的注册登录区域（未登录时显示） */}
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
                <img src={item.image} alt={item.title} />
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
                      onClick={() => navigate(`/products?category=${category.code}`)}
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
                                  />
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="category-name">{category.name}</div>
                        <div className="category-count">
                          共 {stats?.categoryCounts ? (stats.categoryCounts[CATEGORY_COUNT_KEY[category.code]] ?? 0) : 0} 件
                        </div>
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
                onClick={() => setActiveTab('hot')}
              >
                热门商品
              </Button>
              <Button
                shape="round"
                type={activeTab === 'recent' ? 'primary' : 'default'}
                icon={<img src="/images/icons/innovation_11511322.svg" className="section-icon" alt="最新发布" />}
                onClick={() => setActiveTab('recent')}
              >
                最新发布
              </Button>
              <Button 
                type="link" 
                onClick={() => navigate(activeTab === 'hot' ? '/products' : '/products?sort=newest')}
                icon={<RightOutlined />}
              >
                查看更多
              </Button>
            </Space>
          </div>
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Row gutter={[16, 16]}>
                {(activeTab === 'hot' ? hotProducts : recentProducts).map((product) => (
                  <Col xs={24} sm={12} md={6} lg={6} xl={6} key={product.id}>
                    <Card
                      className="product-card"
                      hoverable
                      cover={
                        <div className="product-image-container">
                          <img src={product.image} alt={product.title} />
                          <div className={`product-overlay ${activeTab === 'hot' ? 'overlay-hot' : 'overlay-recent'}`}>
                            <Space>
                              {activeTab === 'hot' ? (
                                <>
                                  <EyeOutlined /> {product.views}
                                </>
                              ) : (
                                <>
                                  {formatRelativeTime(product.publishTime)}
                                </>
                              )}
                            </Space>
                          </div>
                        </div>
                      }
                      onClick={() => navigate(`/products/${product.id}`)}
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
                              {product.publishedAt && (
                                <div className="home-product-published">{product.publishedAt}</div>
                              )}
                            </div>
                            <div className="home-product-bottom">
                              <div className="home-product-seller">
                                <Avatar size={24} icon={<UserOutlined />} />
                                <span className="seller-name">{product.seller}</span>
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
            </Col>
          </Row>
        </section>
      </div>
    </div>
  );
};

export default Home;