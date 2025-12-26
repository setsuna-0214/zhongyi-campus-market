// Unified image resolution utilities
// Provides a single source of truth for picking product images and fallbacks

export const FALLBACK_IMAGE = '/images/products/ipad.jpg';
export const DEFAULT_AVATAR = '/images/avatars/default-avatar.svg';

// 允许的图片 URL 协议和域名
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'data:', 'blob:'];
const ALLOWED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  // 添加你的生产域名
];

/**
 * 验证图片 URL 是否安全
 * @param {string} url - 图片 URL
 * @returns {boolean} 是否安全
 */
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
    // 检查协议
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return false;
    }
    // 对于 http/https，可以选择性地检查域名（生产环境建议启用）
    // if (!ALLOWED_DOMAINS.some(domain => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain))) {
    //   return false;
    // }
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve the best image source from given item/product
 * Priority: product.images[0] -> item.productImage -> item.coverImage -> item.image -> item.images[0] -> FALLBACK
 * @param {Object} params
 * @param {Object} [params.item]
 * @param {Object} [params.product]
 * @returns {string}
 */
export function resolveImageSrc({ item, product } = {}) {
  // 优先使用商品主图字段，其次商品图片数组
  const prodImage = (product?.image) || (Array.isArray(product?.images) ? product.images[0] : undefined);
  // 其次使用条目上的图片字段
  const fromItem = (item?.productImage) || (item?.coverImage) || (item?.image) || (Array.isArray(item?.images) ? item.images[0] : undefined);
  
  const imageUrl = prodImage || fromItem;
  
  // 验证 URL 安全性
  if (imageUrl && isValidImageUrl(imageUrl)) {
    return imageUrl;
  }
  
  return FALLBACK_IMAGE;
}

/**
 * 获取用户头像，如果没有则返回默认头像
 * @param {string|null|undefined} avatar - 用户头像 URL
 * @returns {string} 头像 URL
 */
export function resolveAvatar(avatar) {
  if (!avatar || avatar.trim() === '') {
    return DEFAULT_AVATAR;
  }
  
  // 验证 URL 安全性
  if (isValidImageUrl(avatar)) {
    return avatar;
  }
  
  return DEFAULT_AVATAR;
}