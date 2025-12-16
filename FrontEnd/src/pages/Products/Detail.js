import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Tag, 
  Avatar, 
  Divider, 
  Image, 
  Carousel, 
  Space,
  Modal,
  Input,
  message,
  Tooltip,
  Breadcrumb,
  List
} from 'antd';
import { 
  UserOutlined,
  HeartOutlined, 
  HeartFilled,
  ShareAltOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  MailOutlined,
  HomeOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import './Detail.css';
import { getProduct, getRelatedProducts, updateProductStatus } from '../../api/products';
import { getCategoryLabel, getStatusLabel, getStatusColor, getTradeMethodLabel, parseTradeMethod } from '../../utils/labels';
import { getFavorites, addToFavorites, removeFavoriteByProductId } from '../../api/favorites';
import { checkIsFollowing, followUser, unfollowUser } from '../../api/user';
import { resolveImageSrc, FALLBACK_IMAGE } from '../../utils/images';

const { TextArea } = Input;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  // 能否购买状态判断
  const normalizedStatus = useMemo(() => {
    const raw = product?.status;
    const s = String(raw || '').toLowerCase();
    if (['available', 'selling', 'on_sale'].includes(s) || raw === '在售') return 'available';
    if (s === 'sold' || raw === '已售出') return 'sold'; // 已售出状态
    if (['sold_out', 'unavailable', 'off_shelf', 'inactive'].includes(s) || raw === '已下架') return 'unavailable';
    return s || '';
  }, [product]);

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

  // 初始化收藏状态
  const initFavoriteState = useCallback(async () => {
    try {
      const favorites = await getFavorites();
      const exists = Array.isArray(favorites) && favorites.some(f => String(f.productId) === String(id));
      setIsFavorited(!!exists);
    } catch {
      setIsFavorited(false);
    }
  }, [id]);

  // 初始化关注状态
  const initFollowState = useCallback(async () => {
    if (!product?.seller?.id) return;
    try {
      const following = await checkIsFollowing(product.seller.id);
      setIsFollowing(following);
    } catch {
      setIsFollowing(false);
    }
  }, [product]);

  // 处理收藏
  const handleFavorite = async () => {
    try {
      if (isFavorited) {
        await removeFavoriteByProductId(id);
        setIsFavorited(false);
        message.success('已取消收藏');
      } else {
        await addToFavorites(id);
        setIsFavorited(true);
        message.success('已添加到收藏');
      }
    } catch (e) {
      message.error('操作失败，请稍后重试');
    }
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

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!product?.seller?.id) {
      message.warning('卖家信息不完整');
      return;
    }
    // 检查是否关注自己
    const currentUserId = getCurrentUserId();
    if (currentUserId && String(currentUserId) === String(product.seller.id)) {
      message.warning('不能关注自己');
      return;
    }
    try {
      if (isFollowing) {
        await unfollowUser(product.seller.id);
        setIsFollowing(false);
        message.success('已取消关注');
      } else {
        await followUser(product.seller.id);
        setIsFollowing(true);
        message.success('关注成功');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const _unused = null;

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

  const [purchaseConfirmVisible, setPurchaseConfirmVisible] = useState(false);
  const [purchaseResultVisible, setPurchaseResultVisible] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  const handleBuyNow = () => {
    // 检查是否购买自己的商品
    const currentUserId = getCurrentUserId();
    if (currentUserId && product?.seller?.id && String(currentUserId) === String(product.seller.id)) {
      message.warning('不能购买自己发布的商品');
      return;
    }
    setPurchaseConfirmVisible(true);
  };

  const gotoContactSeller = () => {
    const sellerId = product?.seller?.id;
    if (sellerId) {
      const params = new URLSearchParams({ sellerId, productId: id });
      if (createdOrderId) params.set('orderId', String(createdOrderId));
      navigate(`/chat?${params.toString()}`);
    } else {
      navigate('/chat');
    }
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
    if (product?.seller?.id) {
      navigate(`/users/${product.seller.id}`);
    }
  };

  // 格式化为 年-月-日 时:分:秒
  const formatToYMDHMS = (input) => {
    if (!input) return '';
    try {
      const d = new Date(input);
      if (isNaN(d.getTime())) {
        return String(input);
      }
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
    } catch (_) {
      return String(input);
    }
  };

  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  useEffect(() => {
    initFavoriteState();
  }, [initFavoriteState]);

  useEffect(() => {
    initFollowState();
  }, [initFollowState]);

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
            <span onClick={() => navigate('/search?type=products')}>商品</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <span onClick={() => navigate(`/search?type=products&category=${product.category}`)}>
              {getCategoryLabel(product.category)}
            </span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{product.title}</Breadcrumb.Item>
        </Breadcrumb>

        <Row gutter={[24, 24]}>
          {/* 左侧：商品图片和基本信息 */}
          <Col xs={24} lg={14}>
            <Card className="product-images-card">
              <Carousel autoplay dots={{ className: 'custom-dots' }}>
                {(product.images || []).map((image, index) => (
                  <div key={index} className="carousel-item">
                    <Image
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      width="100%"
                      height={400}
                      fallback={FALLBACK_IMAGE}
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
                {(product.description || '').split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
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
                <h1 className="detail-title">{product.title}</h1>
                <div className="product-meta">
                  <Tag color="blue" className="tag-pill tag-sm tag-bold">
                    {getCategoryLabel(product.category)}
                  </Tag>
                  {normalizedStatus && (
                    <Tag color={getStatusColor(normalizedStatus)} className="tag-pill tag-sm tag-bold">{getStatusLabel(normalizedStatus)}</Tag>
                  )}
                </div>
              </div>

              <div className="price-section">
                <div className="current-price">¥{product.price}</div>
                <div className="price-note">{product.negotiable ? '价格可议' : '不议价'}</div>
              </div>

              {/* 交易方式 */}
              {product.tradeMethod && (
                <div className="trade-method-section" style={{ marginTop: 12 }}>
                  <span style={{ color: '#666', marginRight: 8 }}>交易方式：</span>
                  <Space size={[4, 4]} wrap>
                    {parseTradeMethod(product.tradeMethod).map((method, index) => (
                      <Tag key={index} color="cyan">
                        {getTradeMethodLabel(method.trim()) || method.trim()}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}

              <div className="location-time">
                <div className="location">
                  <EnvironmentOutlined />
                  <span>{product.location}</span>
                </div>
                <div className="publish-time">
                  <ClockCircleOutlined />
                  <span>{formatToYMDHMS(product.publishTime || product.publishedAt || product.createdAt)} 发布</span>
                </div>
              </div>

              <Divider />

              {/* 卖家信息 - 简化版 */}
              <div className="seller-simple-card" onClick={handleViewSeller} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar size={48} src={product.seller?.avatar} icon={<UserOutlined />} />
                  <div className="seller-simple-info">
                    <div className="seller-name-row">
                      <span className="seller-nickname">{product.seller?.nickname || '卖家'}</span>
                      {product.seller?.isVerified && (
                        <Tooltip title="已认证用户">
                          <SafetyCertificateOutlined className="verified-icon" />
                        </Tooltip>
                      )}
                    </div>
                    <span className="seller-label">卖家</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Button 
                    type={isFollowing ? 'default' : 'primary'}
                    shape="round"
                    size="small"
                    onClick={handleFollow}
                  >
                    {isFollowing ? '已关注' : '关注'}
                  </Button>
                  <RightOutlined className="seller-arrow" />
                </div>
              </div>

              <Divider style={{ margin: '16px 0' }} />

              {/* 购买按钮 */}
              <div className="purchase-buttons">
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    onClick={handleBuyNow}
                    block
                    disabled={normalizedStatus !== 'available'}
                  >
                    立即购买
                  </Button>
                  <Space style={{ width: '100%' }}>
                    <Button
                      size="large"
                      icon={<MessageOutlined />}
                      onClick={gotoContactSeller}
                      block
                    >
                      联系卖家
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
                        src={resolveImageSrc({ item })} 
                        alt={item.title} 
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                      />
                      <div className="related-info">
                        <div className="related-title">{item.title}</div>
                        <div className="related-price">¥{item.price}</div>
                        <div className="related-seller">{typeof item.seller === 'string' ? item.seller : (item.seller?.nickname || item.seller?.username || '卖家')}</div>
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

      <Modal
        title="是否确认购买？"
        open={purchaseConfirmVisible}
        onCancel={() => setPurchaseConfirmVisible(false)}
        onOk={async () => {
          try {
            const { createOrder } = await import('../../api/orders');
            const resp = await createOrder({ productId: id, quantity: 1 });
            const oid = resp?.id || resp?.orderId || null;
            setCreatedOrderId(oid);
            // 购买成功后将商品状态更新为"已售出"
            try {
              await updateProductStatus(id, '已售出');
              // 更新本地商品状态
              setProduct(prev => prev ? { ...prev, status: '已售出' } : prev);
            } catch {
              // 状态更新失败不影响购买流程
            }
            setPurchaseConfirmVisible(false);
            setPurchaseResultVisible(true);
          } catch (err) {
            message.error(err?.message || '下单失败');
          }
        }}
        okText="确认"
        cancelText="取消"
        centered
      />

      <Modal
        title="已通知卖家处理您的订单"
        open={purchaseResultVisible}
        onCancel={() => setPurchaseResultVisible(false)}
        footer={null}
        centered
      >
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            onClick={() => { gotoContactSeller(); setPurchaseResultVisible(false); }}
          >
            联系卖家
          </Button>
          <Button onClick={() => setPurchaseResultVisible(false)}>我知道了</Button>
        </Space>
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
          value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
          maxLength={500}
          showCount
        />
      </Modal>

    </div>
  );
};

export default ProductDetail;
