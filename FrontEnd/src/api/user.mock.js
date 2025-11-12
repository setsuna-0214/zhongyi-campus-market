import { mockUserDebug, mockProducts, ensureMockState } from './mockData';
import { normalizeFavorites, normalizePurchases, readMockList } from './mockHelpers';

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

