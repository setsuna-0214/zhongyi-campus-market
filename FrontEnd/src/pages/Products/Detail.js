import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Tag, 
  Avatar, 
  Rate, 
  Divider, 
  Image, 
  Carousel, 
  Space,
  Modal,
  Input,
  message,
  Badge,
  Tooltip,
  Breadcrumb,
  List
} from 'antd';
import { 
  HeartOutlined, 
  HeartFilled,
  ShareAltOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import './Detail.css';
import { getProduct, getRelatedProducts } from '../../api/products';

const { TextArea } = Input;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  // 已移除模拟商品详情数据，统一从后端获取

  // 相关商品改为从后端获取（已在 fetchProductDetail 中处理）

  // 获取商品详情
  const fetchProductDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProduct(id);
      setProduct(data);
      try {
        const related = await getRelatedProducts(id);
        setRelatedProducts(related);
      } catch {
        // 关联商品获取失败时不阻断详情渲染
        setRelatedProducts([]);
      }
    } catch (error) {
      message.error(error.message || '获取商品详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // 处理收藏
  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    message.success(isFavorited ? '已取消收藏' : '已添加到收藏');
  };

  // 处理分享
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `${product.title} - ¥${product.price}`,
        url: window.location.href
      });
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href);
      message.success('链接已复制到剪贴板');
    }
  };

  // 处理联系卖家
  const handleContact = () => {
    setContactModalVisible(true);
  };

  // 处理发送消息
  const handleSendMessage = () => {
    setMessageModalVisible(true);
  };

  // 发送消息
  const sendMessage = () => {
    const text = (chatMessage || '').trim();
    if (!text) {
      message.error('请输入消息内容');
      return;
    }
    if (product?.seller?.id) {
      navigate(`/chat?sellerId=${product.seller.id}&productId=${id}`);
    } else {
      navigate('/chat');
    }
    setMessageModalVisible(false);
    setChatMessage('');
  };

  // 立即购买
  const handleBuyNow = () => {
    // 跳转到订单页面
    navigate(`/orders/create?productId=${id}`);
  };

  // 添加留言
  const handleAddComment = () => {
    const text = (commentText || '').trim();
    if (!text) {
      return;
    }
    const newItem = {
      id: Date.now(),
      author: '我',
      avatar: '/images/avatars/avatar-1.svg',
      content: text,
      time: '刚刚'
    };
    setComments([newItem, ...comments]);
    setCommentText('');
  };

  // 查看卖家信息
  const handleViewSeller = () => {
    navigate(`/users/${product.seller.id}`);
  };

  // 格式化时间
  const formatTime = (timeString) => {
    const time = new Date(timeString);
    const now = new Date();
    const diff = now - time;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}分钟前`;
      }
      return `${hours}小时前`;
    }
    return `${days}天前`;
  };

  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  if (loading || !product) {
    return <div className="loading-container">加载中...</div>;
  }

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* 面包屑导航 */}
        <Breadcrumb className="breadcrumb">
          <Breadcrumb.Item>
            <HomeOutlined />
            <span onClick={() => navigate('/')}>首页</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <span onClick={() => navigate('/products')}>商品</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <span onClick={() => navigate(`/products?category=${product.category}`)}>
              {product.category === 'electronics' ? '数码电子' : '其他'}
            </span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{product.title}</Breadcrumb.Item>
        </Breadcrumb>

        <Row gutter={[24, 24]}>
          {/* 左侧：商品图片和基本信息 */}
          <Col xs={24} lg={14}>
            <Card className="product-images-card">
              <Carousel autoplay dots={{ className: 'custom-dots' }}>
                {product.images.map((image, index) => (
                  <div key={index} className="carousel-item">
                    <Image
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      width="100%"
                      height={400}
                      fallback="/images/products/product-1.svg"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </Carousel>
              
              <div className="product-actions">
                <Space size="middle">
                  <Button
                    type={isFavorited ? 'primary' : 'default'}
                    icon={isFavorited ? <HeartFilled /> : <HeartOutlined />}
                    onClick={handleFavorite}
                  >
                    {isFavorited ? '已收藏' : '收藏'}
                  </Button>
                  <Button icon={<ShareAltOutlined />} onClick={handleShare}>
                    分享
                  </Button>
                  <div className="view-count">
                    <EyeOutlined />
                    <span>{product.views} 次浏览</span>
                  </div>
                </Space>
              </div>
            </Card>

            {/* 商品详情 */}
            <Card title="商品详情" className="product-description-card">
              <div className="description-content">
                {product.description.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
              
              {product.tags && product.tags.length > 0 && (
                <div className="product-tags">
                  <h4>商品标签</h4>
                  <Space wrap>
                    {product.tags.map((tag, index) => (
                      <Tag key={index} color="blue">{tag}</Tag>
                    ))}
                  </Space>
                </div>
              )}
            </Card>

          {/* 商品规格 */}
          {product.specifications && (
            <Card title="商品规格" className="specifications-card">
              <Row gutter={[16, 8]}>
                {Object.entries(product.specifications).map(([key, value]) => (
                  <Col xs={12} sm={8} key={key}>
                    <div className="spec-item">
                      <span className="spec-label">{key}：</span>
                      <span className="spec-value">{value}</span>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          )}

            {/* 商品留言 */}
            <Card title="商品留言" className="comments-card">
              <div className="comment-input">
                <TextArea
                  rows={3}
                  placeholder="写下你的问题或想法…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={300}
                  showCount
                />
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  <Button type="primary" onClick={handleAddComment}>提交留言</Button>
                </div>
              </div>
              <List
                itemLayout="horizontal"
                dataSource={comments}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar src={item.avatar} />}
                      title={<span>{item.author} · <span style={{ color: '#999', fontWeight: 400 }}>{item.time}</span></span>}
                      description={item.content}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* 右侧：价格和购买信息 */}
          <Col xs={24} lg={10}>
            <Card className="purchase-card">
              <div className="product-header">
                <h1 className="product-title">{product.title}</h1>
                <div className="product-meta">
                  <Tag color="blue">
                    {product.category === 'electronics' ? '数码电子' : '其他'}
                  </Tag>
                  <Tag color="green">
                    {product.condition === 'like-new' ? '几乎全新' : '其他'}
                  </Tag>
                  {product.status === 'available' && (
                    <Tag color="success">在售</Tag>
                  )}
                </div>
              </div>

              <div className="price-section">
                <div className="current-price">¥{product.price}</div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="original-price">原价：¥{product.originalPrice}</div>
                )}
                <div className="price-note">价格可议</div>
              </div>

              <div className="location-time">
                <div className="location">
                  <EnvironmentOutlined />
                  <span>{product.location}</span>
                </div>
                <div className="publish-time">
                  <ClockCircleOutlined />
                  <span>{formatTime(product.publishTime)}发布</span>
                </div>
              </div>

              <Divider />

              {/* 卖家信息 */}
              <div className="seller-section">
                <div className="seller-header">
                  <h3>卖家信息</h3>
                  <Button type="link" onClick={handleViewSeller}>
                    查看详情 <RightOutlined />
                  </Button>
                </div>
                
                <div className="seller-info">
                  <div className="seller-basic">
                    <Avatar size={60} src={product.seller.avatar} />
                    <div className="seller-details">
                      <div className="seller-name">
                        {product.seller.name}
                        {product.seller.isVerified && (
                          <Tooltip title="已认证用户">
                            <SafetyCertificateOutlined className="verified-icon" />
                          </Tooltip>
                        )}
                      </div>
                      <Rate disabled defaultValue={product.seller.rating} allowHalf />
                      <div className="seller-stats">
                        <span>{product.seller.reviewCount} 评价</span>
                        <span>{product.seller.totalSales} 成交</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="seller-metrics">
                    <div className="metric">
                      <span className="metric-label">回复率</span>
                      <span className="metric-value">{product.seller.responseRate}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">回复时间</span>
                      <span className="metric-value">{product.seller.responseTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Divider />

              {/* 购买按钮 */}
              <div className="purchase-buttons">
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    onClick={handleBuyNow}
                    block
                    disabled={product.status !== 'available'}
                  >
                    立即购买
                  </Button>
                  <Space style={{ width: '100%' }}>
                    <Button
                      size="large"
                      icon={<MessageOutlined />}
                      onClick={handleSendMessage}
                      style={{ flex: 1 }}
                    >
                      私信
                    </Button>
                    <Button
                      size="large"
                      icon={<PhoneOutlined />}
                      onClick={handleContact}
                      style={{ flex: 1 }}
                    >
                      联系
                    </Button>
                  </Space>
                </Space>
              </div>
            </Card>

            {/* 相关商品 */}
            {relatedProducts.length > 0 && (
              <Card title="相关商品" className="related-products-card">
                <div className="related-products">
                  {relatedProducts.map(item => (
                    <div
                      key={item.id}
                      className="related-item"
                      onClick={() => navigate(`/products/${item.id}`)}
                    >
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        onError={(e) => { e.currentTarget.src = '/images/products/product-1.svg'; }}
                      />
                      <div className="related-info">
                        <div className="related-title">{item.title}</div>
                        <div className="related-price">¥{item.price}</div>
                        <div className="related-seller">{item.seller}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Col>
        </Row>
      </div>

      {/* 联系卖家弹窗 */}
      <Modal
        title="联系卖家"
        open={contactModalVisible}
        onCancel={() => setContactModalVisible(false)}
        footer={null}
        width={400}
      >
        <div className="contact-modal">
          <div className="contact-item">
            <MailOutlined />
            <span>微信：zhang_student</span>
            <Button size="small" type="link">复制</Button>
          </div>
          <div className="contact-item">
            <MessageOutlined />
            <span>QQ：123456789</span>
            <Button size="small" type="link">复制</Button>
          </div>
          <div className="contact-note">
            <p>温馨提示：</p>
            <p>• 请通过平台内消息优先沟通</p>
            <p>• 线下交易请注意安全</p>
            <p>• 建议校内面交验货</p>
          </div>
        </div>
      </Modal>

      {/* 发送消息弹窗 */}
      <Modal
        title="发送消息"
        open={messageModalVisible}
        onOk={sendMessage}
        onCancel={() => setMessageModalVisible(false)}
        okText="发送"
        cancelText="取消"
      >
        <TextArea
          rows={4}
          placeholder="请输入您想对卖家说的话..."
          value={message}
            onChange={(e) => setChatMessage(e.target.value)}
          maxLength={500}
          showCount
        />
      </Modal>

      {/* 底部悬浮操作栏 */}
      <div className="fixed-bottom-bar">
        <div className="bar-inner">
          <Button size="large" onClick={handleContact}>联系卖家</Button>
          <Button type="primary" size="large" onClick={handleBuyNow}>立即购买</Button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;