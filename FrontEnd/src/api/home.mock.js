import { mockProducts } from './mockData';
import { resolveImageSrc } from '../utils/images';
import { getStatusLabel } from '../utils/labels';

// 过滤掉已售出的商品
const filterAvailableProducts = (products) => {
  return products.filter(p => {
    const status = p.status || p.saleStatus || p.state || '在售';
    return getStatusLabel(status) !== '已售出';
  });
};

export async function getHotProducts(page = 1, pageSize = 12) {
  const allProducts = filterAvailableProducts([...mockProducts])
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .map(p => ({
      id: p.id,
      title: p.title,
      image: resolveImageSrc({ product: p }),
      images: p.images || [],
      views: p.views,
      price: p.price,
      publishedAt: p.publishTime,
      seller: p.seller?.nickname || '卖家',
      sellerId: p.seller?.id,
      sellerAvatar: p.seller?.avatar,
      location: p.location,
      category: p.category,
      status: p.status || '在售'
    }));
  
  const start = (page - 1) * pageSize;
  const items = allProducts.slice(start, start + pageSize);
  
  return {
    items,
    hasMore: start + pageSize < allProducts.length,
    total: allProducts.length
  };
}

export async function getLatestProducts(page = 1, pageSize = 12) {
  const allProducts = filterAvailableProducts([...mockProducts])
    .sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime))
    .map(p => ({
      id: p.id,
      title: p.title,
      image: resolveImageSrc({ product: p }),
      images: p.images || [],
      publishTime: p.publishTime,
      price: p.price,
      publishedAt: new Date(p.publishTime).toLocaleDateString(),
      seller: p.seller?.nickname || '卖家',
      sellerId: p.seller?.id,
      sellerAvatar: p.seller?.avatar,
      location: p.location,
      category: p.category,
      status: p.status || '在售'
    }));
  
  const start = (page - 1) * pageSize;
  const items = allProducts.slice(start, start + pageSize);
  
  return {
    items,
    hasMore: start + pageSize < allProducts.length,
    total: allProducts.length
  };
}

