import { mockUserDebug, mockProducts, mockSellers, ensureMockState } from './mockData';
import { normalizeFavorites, normalizePurchases, readMockList, writeMockList } from './mockHelpers';

// --- 关注相关 ---
export async function getFollows() {
  ensureMockState();
  // mock_follows 存储的是 sellerId 的数组
  const followIds = readMockList('mock_follows', []);
  
  // 根据 ID 获取 seller 详细信息
  const follows = followIds.map(id => {
    const seller = mockSellers.find(s => s.id === id);
    return seller || { 
      id, 
      nickname: '未知用户', 
      avatar: '/images/avatars/avatar-1.svg' 
    };
  });
  
  return follows;
}

export async function checkIsFollowing(sellerId) {
  ensureMockState();
  const followIds = readMockList('mock_follows', []);
  return followIds.includes(sellerId);
}

export async function followUser(sellerId) {
  ensureMockState();
  const followIds = readMockList('mock_follows', []);
  if (!followIds.includes(sellerId)) {
    const newFollows = [...followIds, sellerId];
    writeMockList('mock_follows', newFollows);
  }
  return true;
}

export async function unfollowUser(sellerId) {
  ensureMockState();
  const followIds = readMockList('mock_follows', []);
  const newFollows = followIds.filter(id => id !== sellerId);
  writeMockList('mock_follows', newFollows);
  return true;
}

export async function getCurrentUser() {
  const raw = localStorage.getItem('authUser');
  if (raw) {
    const parsed = JSON.parse(raw);
    const merged = { ...mockUserDebug, ...parsed };
    delete merged.adress;
    delete merged.location;
    if ('verified' in merged) delete merged.verified;
    return merged;
  }
  return mockUserDebug;
}

export async function updateCurrentUser(payload) {
  let base = mockUserDebug;
  try {
    const raw = localStorage.getItem('authUser');
    if (raw) base = { ...mockUserDebug, ...JSON.parse(raw) };
  } catch {}
  const sanitized = { ...payload };
  if (sanitized.adress && !sanitized.address) {
    sanitized.address = sanitized.adress;
  }
  delete sanitized.adress;
  if (!sanitized.address) {
    sanitized.address = base.address || '';
  }
  delete sanitized.location;
  if ('verified' in sanitized) delete sanitized.verified;
  ['id','username','token','createdAt','lastLoginAt','joinDate'].forEach(k => { if (k in sanitized) delete sanitized[k]; });
  const updated = { ...base, ...sanitized };
  if ('location' in updated) delete updated.location;
  if ('verified' in updated) delete updated.verified;
  try { localStorage.setItem('authUser', JSON.stringify(updated)); } catch {}
  return updated;
}

export async function getUserCollections() {
  ensureMockState();
  const favorites = normalizeFavorites(readMockList('mock_favorites'));
  const orders = readMockList('mock_orders');
  const normalizedPurchases = normalizePurchases(orders);
  return {
    published: mockProducts.filter(p => p.seller?.id === 's1'),
    purchases: normalizedPurchases,
    favorites,
  };
}

export async function uploadAvatar() {
  const avatarUrl = '/images/avatars/avatar-1.svg';
  try {
    const raw = localStorage.getItem('authUser');
    const user = raw ? JSON.parse(raw) : mockUserDebug;
    const updated = { ...user, avatar: avatarUrl };
    localStorage.setItem('authUser', JSON.stringify(updated));
  } catch {}
  return { avatarUrl };
}

export async function getMyPublished() {
  return mockProducts.filter(p => p.seller?.id === 's1');
}

export async function getMyPurchases() {
  ensureMockState();
  const orders = readMockList('mock_orders');
  return normalizePurchases(orders);
}

export async function requestEmailChange() {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { message: '已向原邮箱发送通知，并向新邮箱发送验证码' };
}

export async function confirmEmailChange({ newEmail }) {
  let base = mockUserDebug;
  try {
    const raw = localStorage.getItem('authUser');
    if (raw) base = { ...mockUserDebug, ...JSON.parse(raw) };
  } catch {}
  const updated = { ...base, email: newEmail };
  try { localStorage.setItem('authUser', JSON.stringify(updated)); } catch {}
  return { success: true, user: updated };
}

export async function changePassword() {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true, message: '密码修改成功' };
}

export async function getUser(id) {
  const found = mockSellers.find(s => s.id === id);
  if (found) {
    // 返回已包含所需字段的 mock 数据
    return found;
  }
  // 如果是当前登录用户
  const currentUser = await getCurrentUser();
  if (currentUser && currentUser.id === id) {
    return currentUser;
  }
  // 默认返回一个模拟用户
  return {
    id,
    username: '未知用户',
    nickname: '未知用户',
    avatar: '/images/avatars/avatar-1.svg',
    joinDate: '2024-01-01',
    bio: '用户不存在或已注销'
  };
}

export async function getUserPublished(userId) {
  return mockProducts.filter(p => p.seller?.id === userId);
}

export async function searchUsers(params = {}) {
  ensureMockState();
  const { keyword = '', page = 1, pageSize = 20 } = params;
  
  let filtered = [...mockSellers];

  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(user => 
      (user.nickname || '').toLowerCase().includes(kw) ||
      (user.username || '').toLowerCase().includes(kw) ||
      (user.school || '').toLowerCase().includes(kw)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = filtered.slice(start, end);

  return {
    items,
    total,
    page,
    pageSize
  };
}

