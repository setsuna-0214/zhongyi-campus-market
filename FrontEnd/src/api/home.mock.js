import { mockProducts } from './mockData';
import { resolveImageSrc } from '../utils/images';

export async function getHotProducts() {
  const hot = [...mockProducts]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 12)
    .map(p => ({
      id: p.id,
      title: p.title,
      image: resolveImageSrc({ product: p }),
      views: p.views,
      price: p.price,
      publishedAt: p.publishTime,
      seller: p.seller?.nickname || '卖家',
      sellerId: p.seller?.id,
      location: p.location,
      category: p.category,
      status: p.status || '在售'
    }));
  return hot;
}

export async function getLatestProducts() {
  const latest = [...mockProducts]
    .sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime))
    .slice(0, 12)
    .map(p => ({
      id: p.id,
      title: p.title,
      image: resolveImageSrc({ product: p }),
      publishTime: p.publishTime,
      price: p.price,
      publishedAt: new Date(p.publishTime).toLocaleDateString(),
      seller: p.seller?.nickname || '卖家',
      sellerId: p.seller?.id,
      location: p.location,
      category: p.category,
      status: p.status || '在售'
    }));
  return latest;
}

