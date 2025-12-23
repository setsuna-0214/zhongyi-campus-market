import client from './client';

export async function getHotProducts(page = 1, pageSize = 12) {
  // 排除已售出商品，支持分页
  const { data } = await client.get('/home/hot', { 
    params: { excludeSold: 'true', page, pageSize } 
  });
  // 兼容不同返回格式
  if (Array.isArray(data)) {
    return { items: data, hasMore: data.length >= pageSize };
  }
  return { 
    items: data.items || [], 
    hasMore: data.hasMore ?? (data.items?.length >= pageSize),
    total: data.total
  };
}

export async function getLatestProducts(page = 1, pageSize = 12) {
  // 排除已售出商品，支持分页
  const { data } = await client.get('/home/latest', { 
    params: { excludeSold: 'true', page, pageSize } 
  });
  // 兼容不同返回格式
  if (Array.isArray(data)) {
    return { items: data, hasMore: data.length >= pageSize };
  }
  return { 
    items: data.items || [], 
    hasMore: data.hasMore ?? (data.items?.length >= pageSize),
    total: data.total
  };
}

