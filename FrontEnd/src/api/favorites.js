import client from './client';
import { initialFavorites, ensureMockState, isMockEnabled, mockProducts } from './mockData';

// 获取收藏列表（我的收藏）
export async function getFavorites() {
  if (isMockEnabled()) {
    ensureMockState();
    try {
      const raw = localStorage.getItem('mock_favorites');
      if (raw) {
        const items = JSON.parse(raw);
        // 适配页面所需的字段，补全产品详情
        return items.map(item => {
          const p = mockProducts.find(mp => mp.id === item.productId);
          const currentPrice = item.currentPrice ?? p?.price ?? 0;
          return {
            ...item,
            category: item.category || p?.category || 'other',
            productImage: item.coverImage || p?.images?.[0] || '/images/products/product-1.svg',
            currentPrice,
            tags: p?.tags || [],
            seller: p?.seller || { name: '卖家', rating: 4.6 },
            location: p?.location || '校园',
            sales: Math.max(0, Math.floor((p?.views || 0) / 3)),
            status: p?.status || (item.isAvailable ? '在售' : '已下架')
          };
        });
      }
    } catch {}
    // 初始数据同样补全（沿用 initialFavorites 作为默认收藏）
    return initialFavorites.map(item => {
      const p = mockProducts.find(mp => mp.id === item.productId);
      const currentPrice = item.currentPrice ?? p?.price ?? 0;
      return {
        ...item,
        category: item.category || p?.category || 'other',
        productImage: item.coverImage || p?.images?.[0] || '/images/products/product-1.svg',
        currentPrice,
        tags: p?.tags || [],
        seller: p?.seller || { name: '卖家', rating: 4.6 },
        location: p?.location || '校园',
        sales: Math.max(0, Math.floor((p?.views || 0) / 3)),
        status: p?.status || (item.isAvailable ? '在售' : '已下架')
      };
    });
  }
  const { data } = await client.get('/favorites');
  return Array.isArray(data) ? data : (data.items || []);
}

// 添加到收藏
export async function addToFavorites(productId) {
  if (isMockEnabled()) {
    ensureMockState();
    let items = [];
    try { items = JSON.parse(localStorage.getItem('mock_favorites') || '[]'); } catch {}
    // 若已存在该商品，则直接返回现有条目
    const existing = items.find(i => i.productId === productId);
    if (existing) return existing;
    const id = `f_${Date.now()}`;
    const p = mockProducts.find(mp => mp.id === productId);
    const currentPrice = p?.price ?? 1;
    const newItem = {
      id,
      productId,
      productName: p?.title || String(productId),
      category: p?.category || 'other',
      coverImage: p?.images?.[0] || '/images/products/product-1.svg',
      currentPrice,
      addTime: new Date().toISOString(),
      isAvailable: true,
      // 扩展字段供页面使用
      productImage: p?.images?.[0] || '/images/products/product-1.svg',
      tags: p?.tags || [],
      seller: p?.seller || { name: '卖家', rating: 4.6 },
      location: p?.location || '校园',
      sales: Math.max(0, Math.floor((p?.views || 0) / 3)),
      status: p?.status || '在售'
    };
    items = [newItem, ...items];
    try { localStorage.setItem('mock_favorites', JSON.stringify(items)); } catch {}
    return newItem;
  }
  const { data } = await client.post('/favorites', { productId });
  return data;
}

// 从收藏移除（按收藏条目 id 移除）
export async function removeFromFavorites(itemId) {
  if (isMockEnabled()) {
    ensureMockState();
    let items = [];
    try { items = JSON.parse(localStorage.getItem('mock_favorites') || '[]'); } catch {}
    items = items.filter(i => i.id !== itemId);
    try { localStorage.setItem('mock_favorites', JSON.stringify(items)); } catch {}
    return { success: true };
  }
  const { data } = await client.delete(`/favorites/${itemId}`);
  return data;
}

// 根据商品 id 取消收藏（工具方法，供详情页使用）
export async function removeFavoriteByProductId(productId) {
  if (isMockEnabled()) {
    ensureMockState();
    let items = [];
    try { items = JSON.parse(localStorage.getItem('mock_favorites') || '[]'); } catch {}
    const target = items.find(i => i.productId === productId);
    if (!target) return { success: true };
    items = items.filter(i => i.productId !== productId);
    try { localStorage.setItem('mock_favorites', JSON.stringify(items)); } catch {}
    return { success: true };
  }
  // 非 mock 情况下，后端可支持 /favorites/by-product/:productId
  try {
    const { data } = await client.delete(`/favorites/by-product/${productId}`);
    return data;
  } catch {
    return { success: false };
  }
}