import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { FALLBACK_IMAGE } from '../../utils/images';
import { Card, Tag, Avatar } from 'antd';
import { EyeOutlined, EnvironmentOutlined, UserOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { Popconfirm } from 'antd';
import { getCategoryLabel, getStatusLabel, getStatusColor } from '../../utils/labels';

/**
 * Unified ProductCard component
 * Props:
 * - imageSrc: string
 * - title: string
 * - price?: number
 * - category?: string
 * - status?: string
 * - location?: string
 * - sellerName?: string
 * - publishedAt?: string
 * - views?: number
 * - overlayType: 'views-left' | 'publish-right'
 * - dateFormat?: 'ymd' | 'auto'
 * - favoriteAt?: string
 * - publishedOverlayText?: string // 仅用于右上角“最近发布”浮层的相对时间
 * - onClick?: () => void
 * - showCheckbox?: boolean
 * - checkboxChecked?: boolean
 * - onCheckboxChange?: (e) => void
 * - checkboxStopPropagation?: boolean (default true)
 * - unavailable?: boolean
 * - unavailableText?: string
 * - imageAlt?: string
 * - imageHeight?: number | string
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
  title,
  price,
  category,
  status,
  location,
  sellerName,
  sellerId,
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
  showOrderButton,
  onOrderClick,
  deleteButtonText,
  deleteConfirmText,
  showOrderDeleteButton,
  onOrderDelete,
}) => {
  const navigate = useNavigate();
  const overlayClass = overlayType === 'publish-right' ? 'overlay-recent' : (overlayType === 'views-left' ? 'overlay-hot' : '');

  const [imageLoaded, setImageLoaded] = useState(false);
  const publishedAtDisplay = publishedAt ? (dateFormat === 'ymd' ? formatToYMD(publishedAt) : publishedAt) : '';
  const favoriteAtDisplay = favoriteAt ? formatToYMD(favoriteAt) : '';

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
        <div className="product-image-container" style={imageHeight ? { height: typeof imageHeight === 'number' ? `${imageHeight}px` : imageHeight } : undefined}>
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
            src={imageSrc || FALLBACK_IMAGE}
            alt={imageAlt || title}
            loading="lazy"
            decoding="async"
            fetchpriority="low"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; setImageLoaded(true); }}
            className={imageLoaded ? 'product-image loaded' : 'product-image'}
          />
          {(overlayType && overlayType !== 'none') && (
            <div className={`product-overlay ${overlayClass}`}>
              {overlayType === 'publish-right' ? (
                <span className="recent-badge">{publishedOverlayText || publishedAt}</span>
              ) : overlayType === 'views-left' ? (
                <div className="views-badge" aria-label={`浏览量 ${formatViews(views)}`}>
                  <EyeOutlined />
                  <span className="views-number">{formatViews(views)}</span>
                </div>
              ) : null}
            </div>
          )}
          {favoriteAtDisplay && (
            <div className="product-overlay-bottom">
              <div className="views-badge" aria-label={`收藏于 ${favoriteAtDisplay}`}>
                <span className="views-number">收藏于 {favoriteAtDisplay}</span>
              </div>
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
              title={deleteConfirmText || "确定要删除这个商品吗？该操作不可逆，请谨慎操作。"}
              onConfirm={() => onDelete?.()}
              onCancel={(e) => e?.stopPropagation()}
              okText="确定"
              cancelText="取消"
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
              title="确定要删除这个订单吗？删除后无法恢复。"
              onConfirm={() => onOrderDelete?.()}
              onCancel={(e) => e?.stopPropagation()}
              okText="确定"
              cancelText="取消"
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
          {/* 订单处理按钮 - 右下角 */}
          {showOrderButton && (
            <div
              className="action-badge action-badge-right"
              onClick={(e) => { e.stopPropagation(); onOrderClick?.(); }}
              title="订单处理"
            >
              <FileTextOutlined />
            </div>
          )}
        </div>
      }
    >
      <Card.Meta
        title={<div className="product-title">{title}</div>}
        description={
          <div className="product-desc">
            {(category || status) && (
              <div className="product-category-line">
                {category && (
                  <Tag color="green" className="product-category-tag">
                    {getCategoryLabel(category)}
                  </Tag>
                )}
                {status && (
                  <Tag color={getStatusColor(status)} className="product-status-tag">
                    {getStatusLabel(status)}
                  </Tag>
                )}
              </div>
            )}
            <div className="home-product-topline">
              {price !== undefined && <div className="product-price">¥{price}</div>}
              {publishedAtDisplay && <div className="home-product-published">{publishedAtDisplay}</div>}
            </div>
            <div className="home-product-bottom">
              <div 
                className={`home-product-seller ${sellerId ? 'clickable' : ''}`}
                onClick={handleSellerClick}
              >
                <Avatar size={24} icon={<UserOutlined />} />
                <span className="seller-name">{sellerName}</span>
              </div>
              {location && (
                <div className="home-product-location">
                  <EnvironmentOutlined />
                  <span>{location}</span>
                </div>
              )}
            </div>
          </div>
        }
      />
    </Card>
  );
};

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.imageSrc === nextProps.imageSrc &&
    prevProps.title === nextProps.title &&
    prevProps.price === nextProps.price &&
    prevProps.category === nextProps.category &&
    prevProps.status === nextProps.status &&
    prevProps.location === nextProps.location &&
    prevProps.sellerName === nextProps.sellerName &&
    prevProps.sellerId === nextProps.sellerId &&
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
    prevProps.showOrderButton === nextProps.showOrderButton
  );
};

export default React.memo(ProductCard, areEqual);