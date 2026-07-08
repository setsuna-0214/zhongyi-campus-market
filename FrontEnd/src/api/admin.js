/**
 * 管理员后台 API
 * 对接后端 /admin/** 接口（由 SecurityConfig 限定 hasRole("ADMIN")）
 * 沿用项目 Result 返回格式与 client 封装。
 */

import client from './client';

/** 从 Result 包装中提取 data */
function extractData(response) {
  const data = response.data;
  if (data && typeof data === 'object' && 'code' in data && 'data' in data) {
    return data.data;
  }
  return data;
}

/** 读取响应中的 code/message，便于 403 等错误给出中文提示 */
function extractResult(response) {
  return response.data;
}

// ----------------------------------------------------------------
// 首页统计
// ----------------------------------------------------------------

/** 管理员首页统计数据：用户/商品/订单/帖子/求购/今日新增等 */
export async function getStatistics() {
  const { data } = await client.get('/admin/statistics');
  return extractData({ data });
}

// ----------------------------------------------------------------
// 系统状态
// ----------------------------------------------------------------

/** 系统状态：后端/数据库/Redis/环境/各计数/服务器时间 */
export async function getSystemStatus() {
  const { data } = await client.get('/admin/system/status');
  return extractData({ data });
}

// ----------------------------------------------------------------
// 用户管理
// ----------------------------------------------------------------

/** 用户列表分页 */
export async function listUsers(params = {}) {
  const { data } = await client.get('/admin/users', { params });
  return extractData({ data });
}

/** 启用/禁用用户 */
export async function setUserStatus(userId, status) {
  const response = await client.put(`/admin/users/${userId}/status`, { status });
  return extractResult(response);
}

// ----------------------------------------------------------------
// 商品管理
// ----------------------------------------------------------------

/** 商品列表分页 */
export async function listProducts(params = {}) {
  const { data } = await client.get('/admin/products', { params });
  return extractData({ data });
}

/** 下架商品 */
export async function offlineProduct(productId) {
  const response = await client.put(`/admin/products/${productId}/offline`);
  return extractResult(response);
}

/** 恢复商品 */
export async function restoreProduct(productId) {
  const response = await client.put(`/admin/products/${productId}/restore`);
  return extractResult(response);
}

// ----------------------------------------------------------------
// 订单管理
// ----------------------------------------------------------------

/** 订单列表分页 */
export async function listOrders(params = {}) {
  const { data } = await client.get('/admin/orders', { params });
  return extractData({ data });
}

// ----------------------------------------------------------------
// 论坛帖管理
// ----------------------------------------------------------------

/** 论坛帖子列表分页（含已隐藏） */
export async function listForumPosts(params = {}) {
  const { data } = await client.get('/admin/forum/posts', { params });
  return extractData({ data });
}

/** 隐藏帖子 */
export async function hideForumPost(postId) {
  const response = await client.put(`/admin/forum/posts/${postId}/hide`);
  return extractResult(response);
}

/** 恢复帖子 */
export async function restoreForumPost(postId) {
  const response = await client.put(`/admin/forum/posts/${postId}/restore`);
  return extractResult(response);
}

// ----------------------------------------------------------------
// 求购管理（占位，阶段四接入真实数据）
// ----------------------------------------------------------------

/** 求购列表分页（当前返回空） */
export async function listWants(params = {}) {
  const { data } = await client.get('/admin/wants', { params });
  return extractData({ data });
}