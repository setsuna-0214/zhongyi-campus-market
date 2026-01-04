import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { FALLBACK_IMAGE } from '../../utils/images';
import { Card, Tag, Avatar } from 'antd';
import { EyeOutlined, EnvironmentOutlined, UserOutlined, EditOutlined, DeleteOutlined, ShoppingOutlined } from '@ant-design/icons';
import { Popconfirm } from 'antd';
import { getCategoryLabel, getStatusLabel, getStatusColor, getStatusBgColor, getCategoryColor, getCategoryBgColor } from '../../utils/labels';

/**
 * 商品卡片组件
 * 展示商品图片、标题、价格、卖家等信息，支持图片轮播、收藏、编辑等操作
 */
const formatViews = (n) => {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return '0';
  if (num >= 10000) {
    const v = num / 10000;
    const s = Number.isInteger(v) ? v.toString() : v.toFixed(1);
    return `${s}万`;
  }
  if (num >= 1000) {
    const v = num / 1000;
    const s = Number.isInteger(v) ? v.toString() : v.toFixed(1);
    return `${s}k`;
  }
  return `${num}`;
};

const formatToYMD = (input) => {
  if (!input) return '';
  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) {
      return String(input);
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch (_) {
    return String(input);
  }
};

const ProductCard = ({
  imageSrc,
  images,
  title,
  price,
  category,
  status,
  location,
  sellerName,
  sellerId,
  sellerAvatar,
  publishedAt,
  views,
  overlayType,
  dateFormat = 'auto',
  favoriteAt,
  publishedOverlayText,
  onClick,
  showCheckbox,
  checkboxChecked,
  onCheckboxChange,
  checkboxStopPropagation = true,
  unavailable,
  unavailableText = '暂时缺货',
  imageAlt,
  imageHeight,
  showEditButton,
  onEdit,
  showDeleteButton,
  onDelete,
  showProductDetailButton,
  onProductDetailClick,
  deleteButtonText,
  deleteConfirmText,
  deleteConfirmIcon,
  showOrderDeleteButton,
  onOrderDelete,
}) => {
  const navigate = useNavigate();

  const [imageLoaded, setImageLoaded] = useState(false);
  const publishedAtDisplay = publishedAt ? (dateFormat === 'ymd' ? formatToYMD(publishedAt) : publishedAt) : '';
  const favoriteAtDisplay = favoriteAt ? formatToYMD(favoriteAt) : '';

  // 图片轮播相关状态
  const imageList = Array.isArray(images) && images.length > 0 ? images : (imageSrc ? [imageSrc] : [FALLBACK_IMAGE]);
  const imageCount = imageList.length;
  const imageCountRef = useRef(imageCount);
  imageCountRef.current = imageCount;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const intervalRef = useRef(null);

  // 获取当前显示的图片
  const currentImage = imageList[currentImageIndex] || FALLBACK_IMAGE;

  // 切换图片时触发淡入动画
  const changeImage = useCallback((newIndex) => {
    setIsFading(true);
    setCurrentImageIndex(newIndex);
    // 动画结束后移除类
    setTimeout(() => setIsFading(false), 400);
  }, []);

  // 启动轮播的通用函数
  const startCarousel = useCallback(() => {
    if (intervalRef.current) return; // 已经在运行
    intervalRef.current = setInterval(() => {
      setCurrentImageIndex(prev => {
        const count = imageCountRef.current;
        if (count <= 1) return prev;
        const newIndex = (prev + 1) % count;
        setIsFading(true);
        setTimeout(() => setIsFading(false), 400);
        return newIndex;
      });
    }, 1500);
  }, []);

  // 停止轮播
  const stopCarousel = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 鼠标悬浮时启动轮播
  const handleMouseEnter = useCallback(() => {
    if (imageCountRef.current <= 1) return;
    setIsHovering(true);
    startCarousel();
  }, [startCarousel]);

  // 鼠标离开时停止轮播
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    stopCarousel();
  }, [stopCarousel]);

  // 暂停轮播（悬停在指示器上时）
  const pauseCarousel = stopCarousel;

  // 恢复轮播（离开指示器时）
  const resumeCarousel = useCallback(() => {
    if (imageCountRef.current <= 1 || !isHovering) return;
    startCarousel();
  }, [isHovering, startCarousel]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleSellerClick = (e) => {
    if (sellerId) {
      e.stopPropagation();
      navigate(`/users/${sellerId}`);
    }
  };

  return (
    <Card
      className="product-card"
      hoverable
      onClick={onClick}
      cover={
        <div
          className="product-image-container"
          style={imageHeight ? { height: typeof imageHeight === 'number' ? `${imageHeight}px` : imageHeight } : undefined}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {showCheckbox && (
            <input
              type="checkbox"
              className="product-checkbox"
              checked={!!checkboxChecked}
              onChange={onCheckboxChange}
              onClick={(e) => checkboxStopPropagation && e.stopPropagation()}
              aria-label="选择商品"
              title="选择此商品"
            />
          )}
          <img
            src={currentImage}
            alt={imageAlt || title}
            loading="lazy"
            decoding="async"
            fetchpriority="low"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; setImageLoaded(true); }}
            className={`product-image ${imageLoaded ? 'loaded' : ''} ${isFading ? 'fade-transition' : ''}`}
          />
          {/* 图片指示器 - 仅在有多张图片时显示 */}
          {imageList.length > 1 && (
            <div
              className={`image-indicators ${imageList.length > 5 ? 'compact' : ''}`}
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={pauseCarousel}
              onMouseLeave={resumeCarousel}
            >
              {imageList.map((_, index) => (
                <span
                  key={index}
                  className={`image-indicator ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (index !== currentImageIndex) {
                      changeImage(index);
                    }
                  }}
                />
              ))}
            </div>
          )}
          {/* 左上角：收藏时间（优先）或浏览量 */}
          {favoriteAtDisplay ? (
            <div className="product-overlay overlay-hot">
              <div className="views-badge" aria-label={`收藏于 ${favoriteAtDisplay}`}>
                <span className="views-number">收藏于 {favoriteAtDisplay}</span>
              </div>
            </div>
          ) : (overlayType === 'views-left' && (
            <div className="product-overlay overlay-hot">
              <div className="views-badge" aria-label={`浏览量 ${formatViews(views)}`}>
                <EyeOutlined />
                <span className="views-number">{formatViews(views)}</span>
              </div>
            </div>
          ))}
          {/* 右上角：最近发布 */}
          {overlayType === 'publish-right' && (
            <div className="product-overlay overlay-recent">
              <span className="recent-badge">{publishedOverlayText || publishedAt}</span>
            </div>
          )}
          {unavailable && (
            <div className="unavailable-overlay">
              <span>{unavailableText}</span>
            </div>
          )}
          {/* 编辑按钮 - 左下角 */}
          {showEditButton && (
            <div
              className="action-badge action-badge-left"
              onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
              title="编辑"
            >
              <EditOutlined />
            </div>
          )}
          {/* 删除按钮 - 右下角 */}
          {showDeleteButton && (
            <Popconfirm
              title={deleteConfirmText || "真的要和它说再见吗？删除后就找不回来啦~"}
              icon={deleteConfirmIcon || <span className="popconfirm-emoji popconfirm-emoji-wave">👋</span>}
              onConfirm={(e) => { e?.stopPropagation(); onDelete?.(); }}
              onCancel={(e) => e?.stopPropagation()}
              onPopupClick={(e) => e?.stopPropagation()}
              okText="确定"
              cancelText="再想想"
            >
              <div
                className="action-badge action-badge-right"
                onClick={(e) => e.stopPropagation()}
                title={deleteButtonText || "删除该商品"}
              >
                <DeleteOutlined />
              </div>
            </Popconfirm>
          )}
          {/* 删除订单按钮 - 左下角（仅已取消订单显示） */}
          {showOrderDeleteButton && (
            <Popconfirm
              title="确定要删除这个订单吗？删除后就找不回来啦~"
              icon={<span className="popconfirm-emoji popconfirm-emoji-box">📦</span>}
              onConfirm={(e) => { e?.stopPropagation(); onOrderDelete?.(); }}
              onCancel={(e) => e?.stopPropagation()}
              onPopupClick={(e) => e?.stopPropagation()}
              okText="确定"
              cancelText="再想想"
            >
              <div
                className="action-badge action-badge-left"
                onClick={(e) => e.stopPropagation()}
                title="删除订单"
              >
                <DeleteOutlined />
              </div>
            </Popconfirm>
          )}
          {/* 查看商品详情按钮 - 右下角 */}
          {showProductDetailButton && (
            <div
              className="action-badge action-badge-right"
              onClick={(e) => { e.stopPropagation(); onProductDetailClick?.(); }}
              title="查看商品详情"
            >
              <ShoppingOutlined />
            </div>
          )}
        </div>
      }
    >
      <Card.Meta
        title={<div className="product-title">{title}</div>}
        description={
          <div className="product-desc">
            <div className="product-info-row">
              {/* 左侧：分类、状态、价格 */}
              <div className="product-info-left">
                {category && (
                  <Tag
                    className="product-tag"
                    style={{
                      color: getCategoryColor(category),
                      backgroundColor: getCategoryBgColor(category),
                    }}
                  >
                    {getCategoryLabel(category)}
                  </Tag>
                )}
                {status && (
                  <Tag
                    className="product-tag"
                    style={{
                      color: getStatusColor(status),
                      backgroundColor: getStatusBgColor(status),
                    }}
                  >
                    {getStatusLabel(status)}
                  </Tag>
                )}
                {price !== undefined && <div className="product-price">¥{price}</div>}
              </div>
              {/* 右侧：卖家、时间、地址 */}
              <div className="product-info-right">
                <div
                  className={`product-seller ${sellerId ? 'clickable' : ''}`}
                  onClick={handleSellerClick}
                >
                  <Avatar size={18} src={sellerAvatar} icon={<UserOutlined />} />
                  <span className="seller-name">{sellerName}</span>
                </div>
                {publishedAtDisplay && (
                  <div className="product-date">{publishedAtDisplay}</div>
                )}
                {location && (
                  <div className="product-location">
                    <EnvironmentOutlined />
                    <span>{location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        }
      />
    </Card>
  );
};

const areEqual = (prevProps, nextProps) => {
  // 比较 images 数组
  const prevImages = prevProps.images || [];
  const nextImages = nextProps.images || [];
  const imagesEqual = prevImages.length === nextImages.length &&
    prevImages.every((img, i) => img === nextImages[i]);

  return (
    prevProps.imageSrc === nextProps.imageSrc &&
    imagesEqual &&
    prevProps.title === nextProps.title &&
    prevProps.price === nextProps.price &&
    prevProps.category === nextProps.category &&
    prevProps.status === nextProps.status &&
    prevProps.location === nextProps.location &&
    prevProps.sellerName === nextProps.sellerName &&
    prevProps.sellerId === nextProps.sellerId &&
    prevProps.sellerAvatar === nextProps.sellerAvatar &&
    prevProps.publishedAt === nextProps.publishedAt &&
    prevProps.views === nextProps.views &&
    prevProps.overlayType === nextProps.overlayType &&
    prevProps.dateFormat === nextProps.dateFormat &&
    prevProps.favoriteAt === nextProps.favoriteAt &&
    prevProps.publishedOverlayText === nextProps.publishedOverlayText &&
    prevProps.showCheckbox === nextProps.showCheckbox &&
    prevProps.checkboxChecked === nextProps.checkboxChecked &&
    prevProps.unavailable === nextProps.unavailable &&
    prevProps.unavailableText === nextProps.unavailableText &&
    prevProps.imageAlt === nextProps.imageAlt &&
    prevProps.imageHeight === nextProps.imageHeight &&
    prevProps.showEditButton === nextProps.showEditButton &&
    prevProps.showDeleteButton === nextProps.showDeleteButton &&
    prevProps.showProductDetailButton === nextProps.showProductDetailButton
  );
};

export default React.memo(ProductCard, areEqual);