import client from './client';

// 获取商品评论列表
export const getComments = async (productId) => {
  const response = await client.get(`/api/comments/product/${productId}`);
  return response.data?.data || [];
};

// 添加评论
export const addComment = async (productId, content) => {
  const response = await client.post(`/api/comments/product/${productId}`, { content });
  return response.data?.data;
};

// 删除评论
export const deleteComment = async (commentId) => {
  const response = await client.delete(`/api/comments/${commentId}`);
  return response.data;
};
