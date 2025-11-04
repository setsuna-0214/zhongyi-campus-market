export const CATEGORY_THEMES = {
  electronics: 'linear-gradient(135deg, #1e88e5, #42a5f5)', // 蓝（接近 #1890ff）
  books: 'linear-gradient(135deg, #5c6bc0, #7986cb)',       // 靛蓝
  daily: 'linear-gradient(135deg, #81d4fa, #64b5f6)',       // 淡蓝
  other: 'linear-gradient(135deg, #9fa8da, #7986cb)'        // 蓝灰
};

export const getCategoryBackground = (code) => {
  return CATEGORY_THEMES[code] || 'linear-gradient(135deg, #1890ff, #1c7ed6)';
};

// 根据分类代码返回对应的彩色卡通图标路径（位于 public/images/category）
export const getCategoryIcon = (code) => {
  const known = [
    'electronics', 'books','daily', 'other'
  ];
  const key = typeof code === 'string' ? code.toLowerCase() : 'other';
  const file = known.includes(key) ? key : 'other';
  return `/images/category/${file}.svg`;
};

// 返回该分类的图标数组（1-3个），用于在卡片中同时显示多个图标
export const getCategoryIcons = (code) => {
  const key = typeof code === 'string' ? code.toLowerCase() : 'other';
  switch (key) {
    case 'electronics':
      return [
        '/images/category/smartphone_1180304.svg',
        '/images/category/computer_10631615.svg',
        '/images/category/headphones_5188513.svg',
      ];
    case 'books':
      return [
        '/images/category/reading_10368713.svg',
        '/images/category/book_7933808.svg',
        '/images/category/document_8961213.svg',
      ];
    case 'daily':
      return [
        '/images/category/washing-machine_2478298.svg',
        '/images/category/dryer_7129304.svg',
        '/images/category/vacancy_6854560.svg',
      ];
    case 'other':
    default:
      return [
        '/images/category/pen_7927184.svg',
        '/images/category/bike_1211026.svg',
        '/images/category/toolkit_11230638.svg',
      ];
  }
};