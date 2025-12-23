// 通用的标签映射与工具函数，统一在前端各页面使用

// ==================== 商品分类 ====================

// 分类：代码 -> 中文
export const CATEGORY_CODE_TO_LABEL = {
  electronics: '数码电子',
  books: '图书教材',
  daily: '生活用品',
  other: '其他物品',
};

// 分类颜色映射（用于 Tag）
export const CATEGORY_COLOR_MAP = {
  electronics: '#1565C0',  // 蓝色 - 数码电子
  books: '#F57F17',        // 橙黄色 - 图书教材
  daily: '#2E7D32',        // 绿色 - 生活用品
  other: '#7B1FA2',        // 紫色 - 其他物品
};

// 分类背景色映射（用于 Tag 背景）
export const CATEGORY_BG_COLOR_MAP = {
  electronics: '#E3F2FD',  // 浅蓝色
  books: '#FFF8E1',        // 浅黄色
  daily: '#E8F5E9',        // 浅绿色
  other: '#F3E5F5',        // 浅紫色
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

export function getCategoryColor(category) {
  return CATEGORY_COLOR_MAP[category] || CATEGORY_COLOR_MAP.other;
}

export function getCategoryBgColor(category) {
  return CATEGORY_BG_COLOR_MAP[category] || CATEGORY_BG_COLOR_MAP.other;
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

// 出售状态颜色（用于 Tag）
export const STATUS_COLOR_MAP = {
  在售: '#52c41a',      // 绿色 - 可购买
  已下架: '#ff4d4f',    // 红色 - 不可购买
  已售出: '#8c8c8c',    // 灰色 - 已完成
  待处理: '#faad14'     // 橙色 - 等待中
};

// 出售状态背景色（用于 Tag 背景）
export const STATUS_BG_COLOR_MAP = {
  在售: '#f6ffed',      // 浅绿色
  已下架: '#fff2f0',    // 浅红色
  已售出: '#fafafa',    // 浅灰色
  待处理: '#fffbe6'     // 浅橙色
};

export function getStatusColor(status) {
  const label = getStatusLabel(status);
  return STATUS_COLOR_MAP[label] || '#8c8c8c';
}

export function getStatusBgColor(status) {
  const label = getStatusLabel(status);
  return STATUS_BG_COLOR_MAP[label] || '#fafafa';
}

// 判断商品是否可在列表中显示（排除已售出）
export function isProductVisible(status) {
  const label = getStatusLabel(status);
  return label !== '已售出';
}

// ==================== 订单状态 ====================

// 订单状态常量
export const ORDER_STATUS = {
  PENDING_SELLER: 'pending_seller',  // 1. 待（卖家）处理
  PENDING_BUYER: 'pending_buyer',    // 2. 待（买家）确认
  COMPLETED: 'completed',            // 3. 已完成
  CANCELLED: 'cancelled',            // 4. 已取消
};

// 订单状态显示文本
export const ORDER_STATUS_TEXT = {
  [ORDER_STATUS.PENDING_SELLER]: '待卖家处理',
  [ORDER_STATUS.PENDING_BUYER]: '待买家确认',
  [ORDER_STATUS.COMPLETED]: '已完成',
  [ORDER_STATUS.CANCELLED]: '已取消',
};

// 订单状态颜色（用于 Tag）
export const ORDER_STATUS_COLOR = {
  [ORDER_STATUS.PENDING_SELLER]: 'orange',
  [ORDER_STATUS.PENDING_BUYER]: 'blue',
  [ORDER_STATUS.COMPLETED]: 'green',
  [ORDER_STATUS.CANCELLED]: 'default',
};

// 订单状态映射表：将各种后端返回格式统一为标准状态
const ORDER_STATUS_MAP = {
  // 待卖家处理
  'pending_seller': ORDER_STATUS.PENDING_SELLER,
  'pending': ORDER_STATUS.PENDING_SELLER,
  '待处理': ORDER_STATUS.PENDING_SELLER,
  '待卖家处理': ORDER_STATUS.PENDING_SELLER,
  // 待买家确认
  'pending_buyer': ORDER_STATUS.PENDING_BUYER,
  'seller_processed': ORDER_STATUS.PENDING_BUYER,
  '待买家确认': ORDER_STATUS.PENDING_BUYER,
  '卖家已处理': ORDER_STATUS.PENDING_BUYER,
  // 已完成
  'completed': ORDER_STATUS.COMPLETED,
  '已完成': ORDER_STATUS.COMPLETED,
  '已收货': ORDER_STATUS.COMPLETED,
  // 已取消
  'cancelled': ORDER_STATUS.CANCELLED,
  '已取消': ORDER_STATUS.CANCELLED,
};

// 规范化订单状态：将各种后端返回格式统一为标准状态码
export function normalizeOrderStatus(status) {
  const s = (status || '').toLowerCase();
  return ORDER_STATUS_MAP[s] || ORDER_STATUS_MAP[status] || ORDER_STATUS.PENDING_SELLER;
}

// 获取订单状态显示文本
export function getOrderStatusText(status) {
  const normalized = normalizeOrderStatus(status);
  return ORDER_STATUS_TEXT[normalized] || status;
}

// 获取订单状态颜色
export function getOrderStatusColor(status) {
  const normalized = normalizeOrderStatus(status);
  return ORDER_STATUS_COLOR[normalized] || 'default';
}

// 判断订单是否可取消（仅买家可取消，确认前可取消）
export function canCancelOrder(status) {
  const normalized = normalizeOrderStatus(status);
  return normalized === ORDER_STATUS.PENDING_SELLER || normalized === ORDER_STATUS.PENDING_BUYER;
}

// ==================== 交易方式 ====================

// 交易方式：代码 -> 中文
export const TRADE_METHOD_CODE_TO_LABEL = {
  campus: '校内交易（自提）',
  express: '快递邮寄',
};

// 交易方式：中文 -> 代码
export const TRADE_METHOD_LABEL_TO_CODE = {
  '校内交易（自提）': 'campus',
  '校内交易': 'campus',
  '自提': 'campus',
  '快递邮寄': 'express',
  '快递': 'express',
  '邮寄': 'express',
};

// 交易方式选项（用于表单）
export const TRADE_METHOD_OPTIONS = [
  { label: '校内交易（自提）', value: 'campus' },
  { label: '快递邮寄', value: 'express' },
];

// 获取交易方式显示文本
export function getTradeMethodLabel(method) {
  return TRADE_METHOD_CODE_TO_LABEL[method] || method || '';
}

// 解析交易方式字符串为数组
export function parseTradeMethod(tradeMethod) {
  if (!tradeMethod) return [];
  if (Array.isArray(tradeMethod)) return tradeMethod;
  return tradeMethod.split(',').map(s => s.trim()).filter(Boolean);
}

// ==================== 性别 ====================

// 性别：数字 -> 中文
export const GENDER_NUM_TO_LABEL = {
  0: '保密',
  1: '男',
  2: '女',
};

// 性别：中文 -> 数字
export const GENDER_LABEL_TO_NUM = {
  '保密': 0,
  '男': 1,
  '女': 2,
};

// 性别选项（用于表单）
export const GENDER_OPTIONS = [
  { label: '男', value: '男' },
  { label: '女', value: '女' },
  { label: '保密', value: '保密' },
];

// 获取性别显示文本（数字或字符串输入）
export function getGenderLabel(gender) {
  if (typeof gender === 'number') {
    return GENDER_NUM_TO_LABEL[gender] ?? '保密';
  }
  return gender || '保密';
}

// 将性别转换为数字（用于提交到后端）
export function toGenderNum(gender) {
  if (typeof gender === 'number') return gender;
  return GENDER_LABEL_TO_NUM[gender] ?? 0;
}

// 将性别数字转换为字符串（用于前端显示）
export function toGenderLabel(gender) {
  if (typeof gender === 'number') {
    return GENDER_NUM_TO_LABEL[gender] ?? '保密';
  }
  return gender || '保密';
}