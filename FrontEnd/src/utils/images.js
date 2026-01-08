/**
 * 图片工具函数
 * 提供图片 URL 解析、验证、默认值处理
 */

export const FALLBACK_IMAGE = '/images/products/ipad.jpg';
export const DEFAULT_AVATAR = '/images/avatars/default-avatar.svg';

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'data:', 'blob:'];

// 验证图片 URL 是否安全
export function isValidImageUrl(url) {
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

// 返回安全可用的图片地址；无效时返回空字符串（由调用方决定占位/降级策略）
export function sanitizeImageUrl(url) {
  return isValidImageUrl(url) ? url : '';
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
  const cleaned = typeof avatar === 'string' ? avatar.trim() : '';
  if (!cleaned) {
    return DEFAULT_AVATAR;
  }

  // 兼容历史默认头像路径（后端曾返回 default.svg，但前端实际资源为 default-avatar.svg）
  if (
    cleaned === '/images/avatars/default.svg' ||
    cleaned === 'images/avatars/default.svg' ||
    cleaned.endsWith('/images/avatars/default.svg') ||
    cleaned.endsWith('images/avatars/default.svg')
  ) {
    return DEFAULT_AVATAR;
  }

  // 兼容不存在的历史头像文件（如 avatar-1.svg、avatar-2.svg 等）
  // 这些文件在前端 public 目录中不存在，需要降级到默认头像
  if (/avatar-\d+\.svg$/.test(cleaned)) {
    return DEFAULT_AVATAR;
  }

  if (isValidImageUrl(cleaned)) {
    // 对不以 "/" 开头的相对路径，统一转为绝对 URL，避免在 /chat 等路由下变成错误的相对路径
    if (!cleaned.startsWith('/') && !cleaned.startsWith('data:') && !cleaned.startsWith('blob:')) {
      try {
        return new URL(cleaned, window.location.origin).toString();
      } catch {
        return cleaned;
      }
    }
    return cleaned;
  }

  return DEFAULT_AVATAR;
}
