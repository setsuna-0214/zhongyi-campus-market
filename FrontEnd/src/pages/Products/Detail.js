import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Tag, 
  Avatar, 
  Divider, 
  Image, 
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
  HomeOutlined,
  RightOutlined,
  LeftOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import './Detail.css';
import { getProduct, getRelatedProducts, updateProductStatus } from '../../api/products';
import { getCategoryLabel, getStatusLabel, getStatusColor, getTradeMethodLabel, parseTradeMethod } from '../../utils/labels';
import { getFavorites, addToFavorites, removeFavoriteByProductId } from '../../api/favorites';
import { checkIsFollowing, followUser, unfollowUser } from '../../api/user';
import { createOrder } from '../../api/orders';
import { resolveImageSrc, FALLBACK_IMAGE } from '../../utils/images';
import { getComments, addComment } from '../../api/comments';
import { getCurrentUserId, isSelf } from '../../utils/auth';
import { useLoginPrompt } from '../../components/LoginPromptModal';
import FollowButton from '../../components/FollowButton';

const { TextArea } = Input;

// 自定义图片轮播组件
const ImageCarousel = ({ images, title, fallback }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoPlayRef = useRef(null);
  const imageCount = images?.length || 0;

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // 自动播放
  useEffect(() => {
    if (imageCount <= 1) return;
    
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % imageCount);
    }, 4000);
    
    return () => clearInterval(autoPlayRef.current);
  }, [imageCount]);

  // 鼠标悬停暂停自动播放
  const handleMouseEnter = () => clearInterval(autoPlayRef.current);
  const handleMouseLeave = () => {
    if (imageCount <= 1) return;
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % imageCount);
    }, 4000);
  };

  if (!images || images.length === 0) {
    return (
      <div className="carousel-slide active">
        <Image src={fallback} alt={title} width="100%" height={450} style={{ objectFit: 'cover', background: '#f8f9fa' }} />
      </div>
    );
  }

  return (
    <div 
      className="custom-carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Image.PreviewGroup
        preview={{
          countRender: (current, total) => `${current} / ${total}`,
          icons: { left: <LeftOutlined />, right: <RightOutlined /> },
        }}
      >
        <div className="carousel-track">
          {images.map((image, index) => (
            <div 
              key={index} 
              className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
            >
              <Image
                src={image}
                alt={`${title} ${index + 1}`}
                width="100%"
                height={450}
                fallback={fallback}
                style={{ objectFit: 'cover', background: '#f8f9fa' }}
                preview={{
                  mask: <div className="preview-mask"><EyeOutlined /> 查看大图</div>
                }}
              />
            </div>
          ))}
        </div>
      </Image.PreviewGroup>
      
      {/* 自定义指示点 */}
      {imageCount > 1 && (
        <div className="carousel-dots">
          {images.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`切换到第 ${index + 1} 张图片`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showLoginPrompt } = useLoginPrompt();
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

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
    // 未登录时不请求收藏列表
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setIsFavorited(false);
      return;
    }
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
    // 检查是否已登录
    if (!getCurrentUserId()) {
      showLoginPrompt({ message: '收藏商品需要登录后才能进行' });
      return;
    }
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

  const handleFollow = async (e) => {
    e.stopPropagation();
    // 检查是否已登录
    if (!getCurrentUserId()) {
      showLoginPrompt({ message: '关注卖家需要登录后才能进行' });
      return;
    }
    if (!product?.seller?.id) {
      message.warning('卖家信息不完整');
      return;
    }
    // 检查是否关注自己
    if (isSelf(product.seller.id)) {
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

  const [purchaseConfirmVisible, setPurchaseConfirmVisible] = useState(false);
  const [purchaseResultVisible, setPurchaseResultVisible] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  const handleBuyNow = () => {
    // 检查是否已登录
    if (!getCurrentUserId()) {
      showLoginPrompt({ message: '购买商品需要登录后才能进行' });
      return;
    }
    // 检查是否购买自己的商品
    if (product?.seller?.id && isSelf(product.seller.id)) {
      message.warning('不能购买自己发布的商品');
      return;
    }
    setPurchaseConfirmVisible(true);
  };

  const gotoContactSeller = () => {
    // 检查是否已登录
    if (!getCurrentUserId()) {
      showLoginPrompt({ message: '联系卖家需要登录后才能进行' });
      return;
    }
    const sellerId = product?.seller?.id;
    const sellerName = product?.seller?.nickname || product?.seller?.username || '';
    const sellerAvatar = product?.seller?.avatar || '';
    if (sellerId) {
      const params = new URLSearchParams({ sid: sellerId, pid: id });
      if (sellerName) params.set('sname', sellerName);
      if (sellerAvatar) params.set('savatar', sellerAvatar);
      if (createdOrderId) params.set('oid', String(createdOrderId));
      navigate(`/chat?${params.toString()}`);
    } else {
      navigate('/chat');
    }
  };

  // 加载评论
  const fetchComments = useCallback(async () => {
    try {
      const data = await getComments(id);
      setComments(data || []);
    } catch (error) {
      console.error('获取评论失败:', error);
    }
  }, [id]);

  // 添加评论
  const handleAddComment = async () => {
    const text = (commentText || '').trim();
    if (!text) {
      message.warning('请输入评论内容');
      return;
    }
    setCommentLoading(true);
    try {
      await addComment(id, text);
      setCommentText('');
      message.success('评论成功');
      fetchComments(); // 重新加载评论列表
    } catch (error) {
      message.error(error.message || '评论失败');
    } finally {
      setCommentLoading(false);
    }
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

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

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
            <span onClick={() => navigate('/search')}>商品</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <span onClick={() => navigate(`/search?c=${product.category}`)}>
              {getCategoryLabel(product.category)}
            </span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{product.title}</Breadcrumb.Item>
        </Breadcrumb>

        <Row gutter={[20, 20]}>
          {/* 左侧：商品图片和基本信息 */}
          <Col xs={24} lg={15}>
            <Card className="product-images-card">
              <ImageCarousel 
                images={product.images} 
                title={product.title} 
                fallback={FALLBACK_IMAGE}
              />
              
              <div className="product-actions">
                <Space size="middle">
                  <Button
                    type={isFavorited ? 'primary' : 'default'}
                    icon={isFavorited ? <HeartFilled /> : <HeartOutlined />}
                    onClick={handleFavorite}
                    className={isFavorited ? 'favorite-btn favorited' : 'favorite-btn'}
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

            {/* 商品评论 */}
            <Card title={`商品评论 (${comments.length})`} className="comments-card">
              <div className="comment-input">
                <TextArea
                  placeholder="写下你的问题或想法…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={500}
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  style={{ resize: 'none' }}
                />
                <div style={{ textAlign: 'right', marginTop: 12 }}>
                  <Button type="primary" onClick={handleAddComment} loading={commentLoading}>提交评论</Button>
                </div>
              </div>
              <List
                itemLayout="horizontal"
                dataSource={comments}
                locale={{ emptyText: '暂无评论，快来抢沙发吧~' }}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar src={item.userAvatar} icon={<UserOutlined />} />}
                      title={
                        <span>
                          {item.userNickname || '用户'} · 
                          <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 4, fontSize: 12 }}>
                            {item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN') : ''}
                          </span>
                        </span>
                      }
                      description={item.content}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* 右侧：价格和购买信息 */}
          <Col xs={24} lg={9}>
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
                      <span className="seller-nickname">{product.seller?.nickname || product.seller?.username || '卖家'}</span>
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
                  <FollowButton 
                    isFollowing={isFollowing}
                    size="small"
                    onClick={handleFollow}
                  />
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
              <Card title="相关推荐" className="related-products-card">
                <div className="related-products">
                  {relatedProducts.slice(0, 4).map(item => (
                    <div
                      key={item.id}
                      className="related-item"
                      onClick={() => navigate(`/products/${item.id}`)}
                    >
                      <img 
                        src={resolveImageSrc({ item, product: item })} 
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

      <Modal
        title={null}
        open={purchaseConfirmVisible}
        onCancel={() => setPurchaseConfirmVisible(false)}
        onOk={async () => {
          try {
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
        okText="确认购买"
        cancelText="再想想"
        centered
        className="purchase-confirm-modal"
        width={420}
      >
        <div className="purchase-confirm-content">
          <div className="purchase-confirm-icon">
            <ShoppingCartOutlined />
          </div>
          <h3 className="purchase-confirm-title">确认购买此商品？</h3>
          <div className="purchase-confirm-product">
            <img 
              src={resolveImageSrc({ item: product, product })} 
              alt={product?.title}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
            />
            <div className="purchase-confirm-info">
              <div className="purchase-confirm-name">{product?.title}</div>
              <div className="purchase-confirm-price">¥{product?.price}</div>
            </div>
          </div>
          <p className="purchase-confirm-tip">
            点击确认后将生成订单，请及时联系卖家完成交易
          </p>
        </div>
      </Modal>

      <Modal
        title={null}
        open={purchaseResultVisible}
        onCancel={() => setPurchaseResultVisible(false)}
        footer={null}
        centered
        className="purchase-result-modal"
        width={420}
      >
        <div className="purchase-result-content">
          <div className="purchase-result-icon success">
            <SafetyCertificateOutlined />
          </div>
          <h3 className="purchase-result-title">订单已生成</h3>
          <p className="purchase-result-desc">
            已通知卖家处理您的订单，建议尽快联系卖家确认交易细节
          </p>
          <div className="purchase-result-actions">
            <Button
              type="primary"
              size="large"
              icon={<MessageOutlined />}
              onClick={() => { gotoContactSeller(); setPurchaseResultVisible(false); }}
            >
              联系卖家
            </Button>
            <Button 
              size="large"
              className="view-order-btn"
              icon={<EyeOutlined />}
              onClick={() => { 
                setPurchaseResultVisible(false);
                if (createdOrderId) {
                  navigate(`/orders/${createdOrderId}`);
                } else {
                  navigate('/profile?t=orders');
                }
              }}
            >
              查看订单
            </Button>
            <Button 
              size="large"
              onClick={() => setPurchaseResultVisible(false)}
            >
              稍后再说
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ProductDetail;
