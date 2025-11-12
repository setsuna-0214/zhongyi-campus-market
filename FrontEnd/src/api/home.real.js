import client from './client';

export async function getHotProducts() {
  const { data } = await client.get('/home/hot');
  return Array.isArray(data) ? data : (data.items || []);
}

export async function getLatestProducts() {
  const { data } = await client.get('/home/latest');
  return Array.isArray(data) ? data : (data.items || []);
}

