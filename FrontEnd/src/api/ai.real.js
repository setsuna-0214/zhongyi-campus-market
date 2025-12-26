/**
 * AI API - 真实后端实现
 */

import client from './client';

/**
 * AI 生成商品描述
 * @param {Object} params - 请求数据
 * @param {string} params.title - 商品标题
 * @param {string} params.category - 商品分类代码
 * @param {Array} params.images - 图片数组，包含 url/preview/isExisting
 * @returns {Promise<{description: string}>}
 */
export const generateProductDescription = async (params) => {
  const { title, category, images } = params;
  
  // 构建请求数据
  const requestBody = {
    title: title || '',
    category: category || '',
    images: [],
  };
  
  // 处理图片数据
  if (images && images.length > 0) {
    requestBody.images = images.map(img => {
      if (img.isExisting && img.url) {
        // 已有图片，发送 URL
        return { type: 'url', data: img.url };
      } else if (img.preview) {
        // 新上传的图片，发送 base64
        return { type: 'base64', data: img.preview };
      }
      return null;
    }).filter(Boolean);
  }
  
  // 调用后端 API
  const { data } = await client.post('/ai/generate-description', requestBody);
  
  // 后端返回格式: { code: 200, message: "成功", data: { description: "..." } }
  const result = data?.data || data;
  if (result?.description) {
    return { description: result.description };
  }
  
  throw new Error(data?.message || '生成失败');
};
