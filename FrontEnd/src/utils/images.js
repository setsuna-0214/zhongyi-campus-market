/**
 * 图片工具函数
 * 提供图片 URL 解析、验证、默认值处理
 */

export const FALLBACK_IMAGE = '/images/products/ipad.jpg';
export const DEFAULT_AVATAR = '/images/avatars/default-avatar.svg';

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'data:', 'blob:'];

// 验证图片 URL 是否安全
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;

  // 允许相对路径
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }

  // 允许 data URL（base64 图片）
  if (url.startsWith('data:image/')) {
    return true;
  }

  // 允许 blob URL
  if (url.startsWith('blob:')) {
    return true;
  }

  try {
    const parsed = new URL(url, window.location.origin);
    return ALLOWED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

// 解析商品图片，按优先级选取最佳图片源
export function resolveImageSrc({ item, product } = {}) {
  const prodImage = (product?.image) || (Array.isArray(product?.images) ? product.images[0] : undefined);
  const fromItem = (item?.productImage) || (item?.coverImage) || (item?.image) || (Array.isArray(item?.images) ? item.images[0] : undefined);

  const imageUrl = prodImage || fromItem;

  if (imageUrl && isValidImageUrl(imageUrl)) {
    return imageUrl;
  }

  return FALLBACK_IMAGE;
}

// 解析用户头像，无效时返回默认头像
export function resolveAvatar(avatar) {
  if (!avatar || avatar.trim() === '') {
    return DEFAULT_AVATAR;
  }

  if (isValidImageUrl(avatar)) {
    return avatar;
  }

  return DEFAULT_AVATAR;
}