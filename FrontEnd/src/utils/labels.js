/**
 * 标签与映射工具
 * 提供商品分类、状态、订单状态、交易方式、性别等标签的转换与显示
 */

/* ===================== 商品分类 ===================== */

export const CATEGORY_CODE_TO_LABEL = {
  electronics: '数码电子',
  books: '图书教材',
  daily: '生活用品',
  other: '其他物品',
};

export const CATEGORY_COLOR_MAP = {
  electronics: '#1565C0',
  books: '#F57F17',
  daily: '#2E7D32',
  other: '#7B1FA2',
};

export const CATEGORY_BG_COLOR_MAP = {
  electronics: '#E3F2FD',
  books: '#FFF8E1',
  daily: '#E8F5E9',
  other: '#F3E5F5',
};

export const CATEGORY_LABEL_TO_CODE = {
  数码电子: 'electronics',
  图书教材: 'books',
  生活用品: 'daily',
  其他物品: 'other'
};

export function getCategoryLabel(category) {
  return CATEGORY_CODE_TO_LABEL[category] || category || '其他物品';
}

export function getCategoryColor(category) {
  return CATEGORY_COLOR_MAP[category] || CATEGORY_COLOR_MAP.other;
}

export function getCategoryBgColor(category) {
  return CATEGORY_BG_COLOR_MAP[category] || CATEGORY_BG_COLOR_MAP.other;
}

export function toCategoryCode(input) {
  return CATEGORY_LABEL_TO_CODE[input] || input || '';
}

/* ===================== 商品状态 ===================== */

export const STATUS_CODE_TO_LABEL = {
  available: '在售',
  selling: '在售',
  on_sale: '在售',
  sold_out: '已下架',
  sold: '已售出',
  off_shelf: '已下架',
  unavailable: '已下架',
  pending: '待处理',
  在售: '在售',
  已下架: '已下架',
  已售出: '已售出',
  待处理: 'pending'
};

export function getStatusLabel(status) {
  return STATUS_CODE_TO_LABEL[status] || (status || '在售');
}

export const STATUS_COLOR_MAP = {
  在售: '#52c41a',
  已下架: '#ff4d4f',
  已售出: '#8c8c8c',
  待处理: '#faad14'
};

export const STATUS_BG_COLOR_MAP = {
  在售: '#f6ffed',
  已下架: '#fff2f0',
  已售出: '#fafafa',
  待处理: '#fffbe6'
};

export function getStatusColor(status) {
  const label = getStatusLabel(status);
  return STATUS_COLOR_MAP[label] || '#8c8c8c';
}

export function getStatusBgColor(status) {
  const label = getStatusLabel(status);
  return STATUS_BG_COLOR_MAP[label] || '#fafafa';
}

export function isProductVisible(status) {
  const label = getStatusLabel(status);
  return label !== '已售出';
}

/* ===================== 订单状态 ===================== */

export const ORDER_STATUS = {
  PENDING_SELLER: 'pending_seller',
  PENDING_BUYER: 'pending_buyer',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const ORDER_STATUS_TEXT = {
  [ORDER_STATUS.PENDING_SELLER]: '待卖家处理',
  [ORDER_STATUS.PENDING_BUYER]: '待买家确认',
  [ORDER_STATUS.COMPLETED]: '已完成',
  [ORDER_STATUS.CANCELLED]: '已取消',
};

export const ORDER_STATUS_COLOR = {
  [ORDER_STATUS.PENDING_SELLER]: 'orange',
  [ORDER_STATUS.PENDING_BUYER]: 'blue',
  [ORDER_STATUS.COMPLETED]: 'green',
  [ORDER_STATUS.CANCELLED]: 'default',
};

const ORDER_STATUS_MAP = {
  'pending_seller': ORDER_STATUS.PENDING_SELLER,
  'pending': ORDER_STATUS.PENDING_SELLER,
  '待处理': ORDER_STATUS.PENDING_SELLER,
  '待卖家处理': ORDER_STATUS.PENDING_SELLER,
  'pending_buyer': ORDER_STATUS.PENDING_BUYER,
  'seller_processed': ORDER_STATUS.PENDING_BUYER,
  '待买家确认': ORDER_STATUS.PENDING_BUYER,
  '卖家已处理': ORDER_STATUS.PENDING_BUYER,
  'completed': ORDER_STATUS.COMPLETED,
  '已完成': ORDER_STATUS.COMPLETED,
  '已收货': ORDER_STATUS.COMPLETED,
  'cancelled': ORDER_STATUS.CANCELLED,
  '已取消': ORDER_STATUS.CANCELLED,
};

export function normalizeOrderStatus(status) {
  const s = (status || '').toLowerCase();
  return ORDER_STATUS_MAP[s] || ORDER_STATUS_MAP[status] || ORDER_STATUS.PENDING_SELLER;
}

export function getOrderStatusText(status) {
  const normalized = normalizeOrderStatus(status);
  return ORDER_STATUS_TEXT[normalized] || status;
}

export function getOrderStatusColor(status) {
  const normalized = normalizeOrderStatus(status);
  return ORDER_STATUS_COLOR[normalized] || 'default';
}

export function canCancelOrder(status) {
  const normalized = normalizeOrderStatus(status);
  return normalized === ORDER_STATUS.PENDING_SELLER || normalized === ORDER_STATUS.PENDING_BUYER;
}

/* ===================== 交易方式 ===================== */

export const TRADE_METHOD_CODE_TO_LABEL = {
  campus: '校内交易（自提）',
  express: '快递邮寄',
};

export const TRADE_METHOD_LABEL_TO_CODE = {
  '校内交易（自提）': 'campus',
  '校内交易': 'campus',
  '自提': 'campus',
  '快递邮寄': 'express',
  '快递': 'express',
  '邮寄': 'express',
};

export const TRADE_METHOD_OPTIONS = [
  { label: '校内交易（自提）', value: 'campus' },
  { label: '快递邮寄', value: 'express' },
];

export function getTradeMethodLabel(method) {
  return TRADE_METHOD_CODE_TO_LABEL[method] || method || '';
}

export function parseTradeMethod(tradeMethod) {
  if (!tradeMethod) return [];
  if (Array.isArray(tradeMethod)) return tradeMethod;
  return tradeMethod.split(',').map(s => s.trim()).filter(Boolean);
}

/* ===================== 性别 ===================== */

export const GENDER_NUM_TO_LABEL = {
  0: '保密',
  1: '男',
  2: '女',
};

export const GENDER_LABEL_TO_NUM = {
  '保密': 0,
  '男': 1,
  '女': 2,
};

export const GENDER_OPTIONS = [
  { label: '男', value: '男' },
  { label: '女', value: '女' },
  { label: '保密', value: '保密' },
];

export function getGenderLabel(gender) {
  if (typeof gender === 'number') {
    return GENDER_NUM_TO_LABEL[gender] ?? '保密';
  }
  return gender || '保密';
}

export function toGenderNum(gender) {
  if (typeof gender === 'number') return gender;
  return GENDER_LABEL_TO_NUM[gender] ?? 0;
}

export function toGenderLabel(gender) {
  if (typeof gender === 'number') {
    return GENDER_NUM_TO_LABEL[gender] ?? '保密';
  }
  return gender || '保密';
}