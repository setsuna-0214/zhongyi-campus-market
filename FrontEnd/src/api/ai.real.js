/**
 * AI API - 真实后端实现
 */

import client from './client';

/**
 * 将 Blob URL 转换为 Base64
 */
const blobUrlToBase64 = async (blobUrl) => {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

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
    const imagePromises = images.map(async (img) => {
      if (img.isExisting && img.url) {
        // 已有图片（OSS URL），直接发送
        return { type: 'url', data: img.url };
      } else if (img.preview) {
        // 新上传的图片，preview 是 blob URL，需要转换为 base64
        if (img.preview.startsWith('blob:')) {
          const base64 = await blobUrlToBase64(img.preview);
          return { type: 'base64', data: base64 };
        }
        // 如果已经是 base64 或其他格式
        return { type: 'base64', data: img.preview };
      }
      return null;
    });
    
    requestBody.images = (await Promise.all(imagePromises)).filter(Boolean);
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
