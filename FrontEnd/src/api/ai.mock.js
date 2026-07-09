/**
 * AI API - Mock 实现
 */

import { CATEGORY_CODE_TO_LABEL } from '../utils/labels';

/**
 * 模拟 AI 生成商品描述
 * @param {Object} data - 请求数据
 * @param {string} data.title - 商品标题
 * @param {string} data.category - 商品分类代码
 * @param {Array} data.images - 图片数组
 * @returns {Promise<{description: string}>}
 */
export const generateProductDescription = async (data) => {
  const { title, category, images } = data;
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
  
  // 获取分类标签
  const categoryLabel = category ? CATEGORY_CODE_TO_LABEL[category] || '' : '';
  
  // 根据不同分类生成不同风格的描述
  const descriptions = {
    electronics: `【${title || '电子产品'}】\n\n这是一款性能优良的电子设备，功能完好，无任何故障。购买后一直小心使用，外观保持良好，无明显划痕或磕碰。配件齐全，包装完整。\n\n因升级换代，现低价出售，价格可小刀。欢迎感兴趣的同学联系咨询，支持当面验货测试。`,
    
    books: `【${title || '书籍'}】\n\n正版书籍，内页干净整洁，无笔记无划线，品相良好。适合学习参考或收藏。\n\n因课程结束不再需要，现转让给有需要的同学。价格实惠，欢迎咨询。可校内当面交易。`,
    
    clothing: `【${title || '服饰'}】\n\n衣物保养良好，无污渍无破损，尺码合适。穿着舒适，面料质感好。\n\n因个人原因闲置转让，诚心出售。欢迎试穿，校内可当面交易。`,
    
    sports: `【${title || '运动装备'}】\n\n运动装备状态良好，功能正常，使用频率不高。适合运动爱好者。\n\n现因个人原因转让，价格可议。欢迎咨询，支持当面验货。`,
    
    daily: `【${title || '日用品'}】\n\n物品保存完好，功能正常，使用方便。适合日常生活使用。\n\n因毕业/搬家等原因闲置转让，价格实惠。欢迎校内同学咨询购买。`,
    
    default: `【${title || '商品'}】${categoryLabel ? ` - ${categoryLabel}` : ''}\n\n这是一件品质优良的商品，成色较新，功能完好。购买后一直妥善保管，使用频率较低。现因个人原因低价转让，诚心出售，价格可小刀。\n\n欢迎感兴趣的同学联系咨询，支持当面验货交易。`,
  };
  
  // 根据分类选择描述模板
  let description = descriptions.default;
  if (category) {
    if (['electronics', 'digital', 'computer', 'phone'].includes(category)) {
      description = descriptions.electronics;
    } else if (['books', 'textbook', 'novel'].includes(category)) {
      description = descriptions.books;
    } else if (['clothing', 'shoes', 'bags'].includes(category)) {
      description = descriptions.clothing;
    } else if (['sports', 'fitness', 'outdoor'].includes(category)) {
      description = descriptions.sports;
    } else if (['daily', 'household', 'beauty'].includes(category)) {
      description = descriptions.daily;
    }
  }
  
  // 如果有图片，添加图片相关描述
  if (images && images.length > 0) {
    description += `\n\n📷 已上传 ${images.length} 张实物图片，所见即所得。`;
  }
  
  return { description };
};
