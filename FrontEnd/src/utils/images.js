// Unified image resolution utilities
// Provides a single source of truth for picking product images and fallbacks

export const FALLBACK_IMAGE = '/images/products/ipad.jpg';

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
  return prodImage || fromItem || FALLBACK_IMAGE;
}