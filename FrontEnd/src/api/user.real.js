import client from './client';

export async function getCurrentUser() {
  const { data } = await client.get('/user/me');
  const normalized = { ...(data || {}) };
  delete normalized.adress;
  delete normalized.location;
  if ('verified' in normalized) delete normalized.verified;
  return normalized;
}

export async function updateCurrentUser(payload) {
  const { data } = await client.put('/user/me', payload);
  const normalized = { ...(data || {}) };
  if ('verified' in normalized) delete normalized.verified;
  if ('adress' in normalized) delete normalized.adress;
  if ('location' in normalized) delete normalized.location;
  return normalized;
}

export async function getUserCollections() {
  const { data } = await client.get('/user/collections');
  return data;
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);
  const { data } = await client.post('/user/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function getMyPublished() {
  const { data } = await client.get('/user/published');
  return Array.isArray(data) ? data : (data.items || []);
}

export async function getMyPurchases() {
  const { data } = await client.get('/user/purchases');
  return Array.isArray(data) ? data : (data.items || []);
}

export async function requestEmailChange({ newEmail }) {
  const { data } = await client.post('/user/me/email/change-request', { newEmail });
  return data;
}

export async function confirmEmailChange({ newEmail, verificationCode }) {
  const { data } = await client.post('/user/me/email/change-confirm', { newEmail, verificationCode });
  return data;
}

export async function changePassword({ currentPassword, newPassword, verificationCode }) {
  const { data } = await client.post('/user/me/password', { currentPassword, newPassword, verificationCode });
  return data;
}