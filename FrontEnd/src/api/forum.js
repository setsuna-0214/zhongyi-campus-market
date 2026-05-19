/**
 * 论坛 API
 * 对接后端 /forum/** 接口
 */

import client from './client';

// ----------------------------------------------------------------
// 工具函数
// ----------------------------------------------------------------

/** 从 Result 包装中提取 data */
function extractData(response) {
  const data = response.data;
  if (data && typeof data === 'object' && 'code' in data && 'data' in data) {
    return data.data;
  }
  return data;
}

// ----------------------------------------------------------------
// 帖子接口
// ----------------------------------------------------------------

/**
 * 分页查询帖子列表
 * @param {Object} params - { type, keyword, userId, sort, page, pageSize }
 */
export async function getPosts(params = {}) {
  const { data } = await client.get('/forum/posts', { params });
  return extractData({ data });
}

/**
 * 获取帖子详情
 * @param {number} postId
 */
export async function getPostDetail(postId) {
  const { data } = await client.get(`/forum/posts/${postId}`);
  return extractData({ data });
}

/**
 * 发布帖子（需要登录）
 * @param {{ title, content, postType, images }} postData
 */
export async function createPost(postData) {
  const { data } = await client.post('/forum/posts', postData);
  return extractData({ data });
}

/**
 * 编辑帖子（需要登录，仅作者）
 * @param {number} postId
 * @param {{ title, content, postType, images }} postData
 */
export async function updatePost(postId, postData) {
  const { data } = await client.put(`/forum/posts/${postId}`, postData);
  return extractData({ data });
}

/**
 * 删除帖子（需要登录，仅作者）
 * @param {number} postId
 */
export async function deletePost(postId) {
  const { data } = await client.delete(`/forum/posts/${postId}`);
  return extractData({ data });
}

/**
 * 切换帖子点赞状态（需要登录）
 * @param {number} postId
 * @returns {{ liked: boolean, likeCount: number }}
 */
export async function togglePostLike(postId) {
  const { data } = await client.post(`/forum/posts/${postId}/like`);
  return extractData({ data });
}

/**
 * 获取某用户发布的帖子列表
 * @param {number} userId
 * @param {{ page, pageSize }} params
 */
export async function getPostsByUser(userId, params = {}) {
  const { data } = await client.get(`/forum/posts/user/${userId}`, { params });
  return extractData({ data });
}

// ----------------------------------------------------------------
// 评论接口
// ----------------------------------------------------------------

/**
 * 分页获取帖子评论（含楼中楼）
 * @param {number} postId
 * @param {{ sort, page, pageSize }} params
 */
export async function getComments(postId, params = {}) {
  const { data } = await client.get('/forum/comments', { params: { postId, ...params } });
  return extractData({ data });
}

/**
 * 发表顶层评论（需要登录）
 * @param {{ postId, content, images }} commentData
 */
export async function createComment(commentData) {
  const { data } = await client.post('/forum/comments', commentData);
  return extractData({ data });
}

/**
 * 发表楼中楼回复（需要登录）
 * @param {{ postId, parentId, rootId, replyToUserId, content }} replyData
 */
export async function createReply(replyData) {
  const { data } = await client.post('/forum/comments/reply', replyData);
  return extractData({ data });
}

/**
 * 删除评论（需要登录，仅作者）
 * @param {number} commentId
 */
export async function deleteComment(commentId) {
  const { data } = await client.delete(`/forum/comments/${commentId}`);
  return extractData({ data });
}

/**
 * 切换评论点赞状态（需要登录）
 * @param {number} commentId
 * @returns {{ liked: boolean, likeCount: number }}
 */
export async function toggleCommentLike(commentId) {
  const { data } = await client.post(`/forum/comments/${commentId}/like`);
  return extractData({ data });
}

// ----------------------------------------------------------------
// 收藏接口
// ----------------------------------------------------------------

/**
 * 获取当前用户收藏的帖子列表（需要登录）
 */
export async function getForumFavorites() {
  const { data } = await client.get('/forum/favorites');
  return extractData({ data });
}

/**
 * 收藏帖子（需要登录）
 * @param {number} postId
 */
export async function addForumFavorite(postId) {
  const { data } = await client.post(`/forum/favorites/${postId}`);
  return extractData({ data });
}

/**
 * 取消收藏帖子（需要登录）
 * @param {number} postId
 */
export async function removeForumFavorite(postId) {
  const { data } = await client.delete(`/forum/favorites/${postId}`);
  return extractData({ data });
}

/**
 * 查询帖子收藏状态（需要登录）
 * @param {number} postId
 * @returns {{ favorited: boolean, totalCount: number }}
 */
export async function getForumFavoriteStatus(postId) {
  const { data } = await client.get(`/forum/favorites/status/${postId}`);
  return extractData({ data });
}
