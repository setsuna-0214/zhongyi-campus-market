import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Carousel, 
  Statistic, 
  Typography, 
  Space,
  Tag,
  Avatar,
  List
} from 'antd';
import { 
  ShoppingOutlined, 
  UserOutlined, 
  DollarOutlined,
  TrophyOutlined,
  RightOutlined,
  FireOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { getHomeStats, getHotProducts, getLatestProducts } from '../../api/home';
import { message } from 'antd';

const { Title, Paragraph } = Typography;

// 初始化为空，运行时从后端获取


const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('hot'); // 'hot' or 'recent'
  const isLoggedIn = !!localStorage.getItem('authUser');
  const [stats, setStats] = useState(null);
  const [hotProducts, setHotProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [topSellers, setTopSellers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const s = await getHomeStats();
        setStats(s || {});
        // 修复：使用同步的 s 设置 topSellers，避免作用域问题
        if (s?.topSellers) setTopSellers(s.topSellers);
      } catch (err) {
        message.info('主页统计暂不可用');
      }
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
      // 取消原来的 s 引用位置（已上移到 getHomeStats 成功后）
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
    { name: '数码电子', icon: '💻', count: stats?.categoryCounts?.digital || 0 },
    { name: '图书教材', icon: '📚', count: stats?.categoryCounts?.books || 0 },
    { name: '服装配饰', icon: '👕', count: stats?.categoryCounts?.fashion || 0 },
    { name: '运动户外', icon: '⚽', count: stats?.categoryCounts?.sports || 0 },
    { name: '生活用品', icon: '🧴', count: stats?.categoryCounts?.home || 0 },
    { name: '家具家电', icon: '🪑', count: stats?.categoryCounts?.furniture || 0 },
    { name: '文具用品', icon: '✏️', count: stats?.categoryCounts?.stationery || 0 },
    { name: '其他物品', icon: '📦', count: stats?.categoryCounts?.other || 0 }
  ];

  return (
    <div className="home-page">

      {/* 带轮播图背景的注册登录区域（未登录显示） */}
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
        {/* 固定的按钮区域 */}
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
        {/* 热门分类与数据统计 */}
        <section className="categories-section">
          <Title level={2} className="section-title">
            <FireOutlined /> 商品分类
          </Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={18}>
              <Row gutter={[16, 16]}>
                {categories.map((category, index) => (
                  <Col span={6} key={index}>
                    <Card 
                      className="category-card"
                      hoverable
                      onClick={() => navigate(`/products?category=${category.name}`)}
                    >
                      <div className="category-content">
                        <div className="category-icon">{category.icon}</div>
                        <div className="category-name">{category.name}</div>
                        <div className="category-count">{category.count} 件</div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>
            <Col xs={24} lg={6}>
              <Card className="stats-container-vertical">
                <div className="stat-rows">
                  <div className="stat-row">
                    <div className="stat-label">
                      <span style={{ fontSize: 22, fontWeight: 800, color: '#69c0ff' }}>商品总数</span>
                    </div>
                    <div className="stat-value" style={{ color: '#69c0ff' }}>{stats?.totalProducts || 0}件</div>
                  </div>
                  <div className="stat-row">
                    <div className="stat-label">
                      <span style={{ fontSize: 22, fontWeight: 800, color: '#95de64' }}>注册用户</span>
                    </div>
                    <div className="stat-value" style={{ color: '#95de64' }}>{stats?.totalUsers || 0}人</div>
                  </div>
                  <div className="stat-row">
                    <div className="stat-label">
                      <span style={{ fontSize: 22, fontWeight: 800, color: '#ffd666' }}>成功交易</span>
                    </div>
                    <div className="stat-value" style={{ color: '#ffd666' }}>{stats?.totalTransactions || 0}笔</div>
                  </div>
                  <div className="stat-row">
                    <div className="stat-label">
                      <span style={{ fontSize: 22, fontWeight: 800, color: '#ffa39e' }}>交易金额</span>
                    </div>
                    <div className="stat-value" style={{ color: '#ffa39e' }}>{stats?.totalAmount || 0}元</div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </section>

        {/* 热门商品/最新发布  优秀卖家 */}
        <section className="hot-products-section">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Title level={2} className="section-title" style={{ margin: 0 }}>
                <FireOutlined /> {activeTab === 'hot' ? '热门商品' : '最新发布'}
              </Title>
              <Space>
                <Button 
                  type={activeTab === 'hot' ? 'primary' : 'default'}
                  onClick={() => setActiveTab('hot')}
                >
                  热门商品
                </Button>
                <Button 
                  type={activeTab === 'recent' ? 'primary' : 'default'}
                  onClick={() => setActiveTab('recent')}
                >
                  最新发布
                </Button>
              </Space>
            </div>
            <Button 
              type="link" 
              onClick={() => navigate(activeTab === 'hot' ? '/products' : '/products?sort=newest')}
              icon={<RightOutlined />}
            >
              查看更多
            </Button>
          </div>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={18}>
              <Row gutter={[16, 16]}>
                {(activeTab === 'hot' ? hotProducts : recentProducts).map((product) => (
                  <Col xs={24} sm={12} md={8} lg={8} xl={8} key={product.id}>
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
                                  <ClockCircleOutlined /> {product.time}
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
                                <Tag color="green" className="product-category-tag">{product.category}</Tag>
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
            <Col xs={24} lg={6}>
              <Card 
                title={
                  <Space>
                    <TrophyOutlined />
                    优秀卖家
                  </Space>
                }
                extra={
                  <Button type="link" onClick={() => navigate('/sellers')}>
                    查看更多
                  </Button>
                }
              >
                <List
                  dataSource={topSellers}
                  renderItem={(seller) => (
                    <List.Item className="seller-item">
                      <List.Item.Meta
                        avatar={<Avatar src={seller.avatar} size={48} />}
                        title={
                          <Space>
                            {seller.name}
                            <Tag color="gold">{seller.badge}</Tag>
                          </Space>
                        }
                        description={
                          <Space split={<span>|</span>}>
                            <span>销量: {seller.sales}</span>
                            <span>评分: {seller.rating}⭐</span>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </section>
      </div>
    </div>
  );
};

export default Home;