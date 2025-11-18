// 通用的标签映射与工具函数，统一在前端各页面使用

// 分类：代码 -> 中文
export const CATEGORY_CODE_TO_LABEL = {
  electronics: '数码电子',
  books: '图书教材',
  daily: '生活用品',
  other: '其他物品'
};

// 分类
export const CATEGORY_LABEL_TO_CODE = {
  数码电子: 'electronics',
  图书教材: 'books',
  生活用品: 'daily',
  其他物品: 'other'
};

export function getCategoryLabel(category) {
  return CATEGORY_CODE_TO_LABEL[category] || category || '其他物品';
}

export function toCategoryCode(input) {
  return CATEGORY_LABEL_TO_CODE[input] || input || '';
}

// 出售状态：代码/中文 -> 中文
export const STATUS_CODE_TO_LABEL = {
  available: '在售',
  selling: '在售',
  on_sale: '在售',
  sold_out: '已下架',
  sold: '已下架',
  off_shelf: '已下架',
  unavailable: '已下架',
  pending: '待处理',
  在售: '在售',
  已下架: '已下架',
  待处理: 'pending'
};

export function getStatusLabel(status) {
  return STATUS_CODE_TO_LABEL[status] || (status || '在售');
}

// 出售状态颜色（用于 Tag）
export const STATUS_COLOR_MAP = {
  在售: 'blue',
  已下架: 'red',
  待处理: 'orange'
};

export function getStatusColor(status) {
  const label = getStatusLabel(status);
  return STATUS_COLOR_MAP[label] || 'default';
}