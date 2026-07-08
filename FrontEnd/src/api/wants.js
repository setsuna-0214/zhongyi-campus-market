/**
 * 求购模块 API
 * 对接后端 /wants/** 与 /products/{id}/related-wants。
 */

import client from './client';

function extractData(response) {
  const data = response.data;
  if (data && typeof data === 'object' && 'code' in data && 'data' in data) {
    return data.data;
  }
  return data;
}

function extractResult(response) {
  return response.data;
}

export async function listWants(params = {}) {
  const { data } = await client.get('/wants', { params });
  return extractData({ data });
}

export async function getWantDetail(wantId) {
  const { data } = await client.get(`/wants/${wantId}`);
  return extractData({ data });
}

export async function createWant(payload) {
  const response = await client.post('/wants', payload);
  return extractResult(response);
}

export async function updateWant(wantId, payload) {
  const response = await client.put(`/wants/${wantId}`, payload);
  return extractResult(response);
}

export async function closeWant(wantId) {
  const response = await client.put(`/wants/${wantId}/close`);
  return extractResult(response);
}

export async function getWantMatches(wantId) {
  const { data } = await client.get(`/wants/${wantId}/matches`);
  return extractData({ data });
}

export async function refreshWantMatches(wantId) {
  const { data } = await client.post(`/wants/${wantId}/refresh-matches`);
  return extractData({ data });
}

export async function getRelatedWantsByProduct(productId) {
  const { data } = await client.get(`/products/${productId}/related-wants`);
  return extractData({ data });
}

export async function listAdminWants(params = {}) {
  const { data } = await client.get('/admin/wants', { params });
  return extractData({ data });
}

export async function adminCloseWant(wantId) {
  const response = await client.put(`/admin/wants/${wantId}/close`);
  return extractResult(response);
}

export async function adminRestoreWant(wantId) {
  const response = await client.put(`/admin/wants/${wantId}/restore`);
  return extractResult(response);
}