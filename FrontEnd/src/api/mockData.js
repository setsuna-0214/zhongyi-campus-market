// 本地 Mock 数据，用于未接入后端时前端展示示例
import { FALLBACK_IMAGE } from '../utils/images';

// 卖家示例
export const mockSellers = [
  {
    id: 's1',
    username: 'zhang_student',
    nickname: '张同学',
    avatar: '/images/avatars/avatar-1.svg',
    school: '中山大学',
    bio: '数码类好物，诚信交易，支持面交',
    phone: '138****1234',
    address: '珠海校区',
    joinDate: '2023-09-01',
    gender: '男',
    lastLoginAt: '2025-11-05T10:00:00.000Z'
  },
  {
    id: 's2',
    username: 'li_study',
    nickname: '李同学',
    avatar: '/images/avatars/avatar-1.svg',
    school: '中山大学',
    bio: '教材资料齐全，价格实惠，祝大家考试顺利',
    phone: '139****5678',
    address: '广州校区',
    joinDate: '2024-02-15',
    gender: '女',
    lastLoginAt: '2025-11-04T15:30:00.000Z'
  },
  {
    id: 's3',
    username: 'wang_life',
    nickname: '王同学',
    avatar: '/images/avatars/avatar-1.svg',
    school: '中山大学',
    bio: '生活好物，九成新，毕业清仓',
    phone: '137****9012',
    address: '深圳校区',
    joinDate: '2023-11-20',
    gender: '保密',
    lastLoginAt: '2025-11-01T09:20:00.000Z'
  }
];

// 示例商品数据（用于首页、搜索与详情）
export const mockProducts = [
  {
    id: 'p1001',
    title: '苹果 iPad 2019 128G Wi-Fi 版',
    category: 'electronics',
    price: 1599,
    location: '珠海校区 - 榕园9号',
    images: ['/images/products/ipad.jpg'],
    views: 236,
    seller: mockSellers[0],
    status: '在售',
    publishTime: '2025-11-01T10:15:00.000Z',
    tags: ['平板', '学习', '娱乐'],
    description: '成色很好，使用次数不多，配件齐全。\n适合线上课堂、记笔记与娱乐。\n支持当面交易，价格可小刀。',
    tradeMethod: 'campus,express',
    negotiable: true
  },
  {
    id: 'p1002',
    title: '高等数学（第七版）上下册教材',
    category: 'books',
    price: 28,
    location: '珠海校区 - 荔园2号',
    images: ['/images/products/math-textbook.jpg'],
    views: 98,
    seller: mockSellers[1],
    status: '已下架',
    publishTime: '2025-11-03T08:00:00.000Z',
    tags: ['教材', '数学', '考试'],
    description: '书本无缺页，部分章节有铅笔标注，已擦拭。\n赠送考研真题一本。\n同城自取优先。',
    tradeMethod: 'campus',
    negotiable: false
  },
  {
    id: 'p1003',
    title: '小米电风扇 静音款',
    category: 'daily',
    price: 89,
    location: '珠海校区 - 榕园8号',
    images: ['/images/products/fan.jpg'],
    views: 172,
    seller: mockSellers[2],
    status: '已下架',
    publishTime: '2025-10-30T12:30:00.000Z',
    tags: ['生活', '家用', '夏季'],
    description: '搬宿舍出，功能正常，风力稳定。\n支持送货到楼下。',
    tradeMethod: 'campus',
    negotiable: true
  },
  {
    id: 'p1004',
    title: '机械键盘 青轴 带灯',
    category: 'electronics',
    price: 159,
    location: '广州校区 - 162栋',
    images: ['/images/products/keyboard.jpg'],
    views: 64,
    seller: mockSellers[0],
    status: '在售',
    publishTime: '2025-11-04T02:30:00.000Z',
    tags: ['键盘', '外设', '机械'],
    description: '几乎全新，敲击手感好，灯效可调。\n支持试用后购买。',
    tradeMethod: 'campus,express',
    negotiable: true
  },
  {
    id: 'p1005',
    title: 'Kindle Paperwhite 电子书阅读器',
    category: 'electronics',
    price: 399,
    location: '珠海校区 - 榕园5号',
    images: ['/images/products/kindle.jpg'],
    views: 87,
    seller: mockSellers[1],
    status: '在售',
    publishTime: '2025-11-02T09:40:00.000Z',
    tags: ['阅读', '电子书', '学习'],
    description: '屏幕无划痕，续航给力，支持随书赠送几本经典教材电子版。',
    tradeMethod: 'campus',
    negotiable: true
  },
  {
    id: 'p1006',
    title: 'ThinkPad E14 笔记本 i5/16G/512G',
    category: 'electronics',
    price: 2599,
    location: '广州校区 - 163栋',
    images: ['/images/products/thinkpad.jpg'],
    views: 142,
    seller: mockSellers[0],
    status: '在售',
    publishTime: '2025-11-01T18:15:00.000Z',
    tags: ['笔记本', '办公', '课程设计'],
    description: '键盘轻微磨损，性能稳定，适合课程设计与论文排版。',
    tradeMethod: 'campus',
    negotiable: true
  },
  {
    id: 'p1007',
    title: '高等代数（第三版）教材',
    category: 'books',
    price: 22,
    location: '珠海校区 - 荔园3号',
    images: ['/images/products/algebra.jpg'],
    views: 58,
    seller: mockSellers[1],
    status: '在售',
    publishTime: '2025-10-28T14:10:00.000Z',
    tags: ['教材', '代数', '考试'],
    description: '封面有包书皮，内页干净，附带少量笔记。',
    tradeMethod: 'campus',
    negotiable: false
  },
  {
    id: 'p1008',
    title: '四六级词汇书 + 真题套装',
    category: 'books',
    price: 38,
    location: '广州校区 - 101栋',
    images: ['/images/products/cet-vocab.jpg'],
    views: 96,
    seller: mockSellers[2],
    status: '在售',
    publishTime: '2025-10-31T07:30:00.000Z',
    tags: ['英语', '考试', '资料'],
    description: '几乎未使用，附赠听力材料下载链接。打包更优惠。',
    tradeMethod: 'campus,express',
    negotiable: true
  },
  {
    id: 'p1009',
    title: '宿舍电热水壶 1.7L',
    category: 'daily',
    price: 39,
    location: '珠海校区 - 榕园7号',
    images: ['/images/products/kettle.jpg'],
    views: 121,
    seller: mockSellers[2],
    status: '在售',
    publishTime: '2025-10-29T20:10:00.000Z',
    tags: ['生活', '宿舍', '家电'],
    description: '加热快速，自动断电，宿舍必备。可面交。',
    tradeMethod: 'campus',
    negotiable: false
  },
  {
    id: 'p1010',
    title: '台灯 护眼款 三色温',
    category: 'daily',
    price: 49,
    location: '广州校区 - 164栋',
    images: ['/images/products/lamp.jpg'],
    views: 75,
    seller: mockSellers[0],
    status: '在售',
    publishTime: '2025-11-03T21:05:00.000Z',
    tags: ['照明', '学习', '宿舍'],
    description: '护眼光源，亮度可调，适合看书与写作业。',
    tradeMethod: 'campus,express',
    negotiable: true
  },
  {
    id: 'p1011',
    title: '线性代数强化习题集',
    category: 'books',
    price: 16,
    location: '珠海校区 - 荔园4号',
    images: ['/images/products/linear-algebra.jpg'],
    views: 83,
    seller: mockSellers[1],
    status: '在售',
    publishTime: '2025-10-26T11:25:00.000Z',
    tags: ['线代', '题库', '考试'],
    description: '题目解析详细，有少量笔记标注，不影响阅读。',
    tradeMethod: 'campus',
    negotiable: false
  },
  {
    id: 'p1012',
    title: '罗技无线鼠标 M590',
    category: 'electronics',
    price: 79,
    location: '广州校区 - 105栋',
    images: ['/images/products/mouse.jpg'],
    views: 110,
    seller: mockSellers[0],
    status: '在售',
    publishTime: '2025-11-04T08:55:00.000Z',
    tags: ['外设', '鼠标', '静音'],
    description: '双蓝牙支持，静音按键，移动办公佳选。',
    tradeMethod: 'express',
    negotiable: true
  },
  {
    id: 'p1013',
    title: '不锈钢保温杯 500ml',
    category: 'daily',
    price: 29,
    location: '珠海校区 - 榕园6号',
    images: ['/images/products/bottle.jpg'],
    views: 52,
    seller: mockSellers[2],
    status: '在售',
    publishTime: '2025-10-25T09:05:00.000Z',
    tags: ['保温杯', '生活', '出行'],
    description: '保温效果好，杯口顺滑，送原装杯套。',
    tradeMethod: 'campus',
    negotiable: false
  },
  {
    id: 'p1014',
    title: 'C++ 程序设计实践（第二版）',
    category: 'books',
    price: 25,
    location: '广州校区 - 102栋',
    images: ['/images/products/cpp-book.jpg'],
    views: 67,
    seller: mockSellers[1],
    status: '在售',
    publishTime: '2025-11-02T13:45:00.000Z',
    tags: ['编程', 'C++', '教材'],
    description: '封面有轻微折痕，内容完整，附带课程笔记。',
    tradeMethod: 'campus,express',
    negotiable: true
  }
];


// 模拟当前登录用户
// 统一字段：id, username, nickname, email, avatar, phone, address, bio, joinDate, gender, lastLoginAt
export const mockUserDebug = {
  id: 'u1',
  username: 'student_01',
  nickname: '张三',
  email: 'zhangsan@example.com',
  avatar: '/images/avatars/avatar-1.svg',
  phone: '13800000000',
  address: '珠海校区 - 榕园9号',
  bio: '这是用于调试的用户，包含完整字段以便测试展示。',
  joinDate: '2023-09-01',
  gender: '男',
  lastLoginAt: new Date().toISOString(),
  token: 'debug-token'
};

// 收藏示例（为调试用户）
export const initialFavorites = [
  {
    id: 'w1',
    productId: 'p1001',
    productName: '苹果 iPad 2019 128G Wi-Fi 版',
    category: 'electronics',
    coverImage: '/images/products/ipad.jpg',
    currentPrice: 1599,
    addTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isAvailable: true
  },
  {
    id: 'w2',
    productId: 'p1002',
    productName: '高等数学（第七版）上下册教材',
    category: 'books',
    coverImage: '/images/products/math-textbook.jpg',
    currentPrice: 28,
    addTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isAvailable: true
  }
];

// 订单示例（为调试用户）
export const initialOrders = [
  {
    id: 'o1001',
    status: 'pending',
    hasReviewed: false,
    orderTime: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    product: {
      id: 'p1003',
      title: '小米电风扇 静音款',
      coverImage: '/images/products/fan.jpg',
      price: 89,
      quantity: 1
    },
    seller: mockSellers[2],
    buyer: { id: mockUserDebug.id, nickname: mockUserDebug.nickname || '调试用户' }
  },
  {
    id: 'o1002',
    status: 'completed',
    hasReviewed: true,
    orderTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    product: {
      id: 'p1002',
      title: '高等数学（第七版）上下册教材',
      coverImage: '/images/products/math-textbook.jpg',
      price: 28,
      quantity: 1
    },
    seller: mockSellers[1],
    buyer: { id: mockUserDebug.id, nickname: mockUserDebug.nickname || '调试用户' }
  }
];

// 聊天示例（为调试用户与卖家之间）
export const initialConversations = [
  {
    id: 'c1',
    userId: mockSellers[0].id,
    userName: mockSellers[0].nickname,
    userAvatar: mockSellers[0].avatar,
    lastMessage: '好的，明天图书馆见',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 20).toLocaleString(),
    unreadCount: 1,
    orderId: null
  },
  {
    id: 'c2',
    userId: mockSellers[1].id,
    userName: mockSellers[1].nickname,
    userAvatar: mockSellers[1].avatar,
    lastMessage: '教材还有吗？',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60).toLocaleString(),
    unreadCount: 0,
    orderId: 'o1002'
  }
];

export const initialMessages = {
  c1: [
    {
      id: 'm1',
      senderId: 'seller',
      senderName: mockSellers[0].nickname,
      content: '明天有空吗？',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toLocaleString(),
      isOwn: false
    },
    {
      id: 'm2',
      senderId: 'current',
      senderName: '我',
      content: '可以的，图书馆一楼。',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toLocaleString(),
      isOwn: true
    },
    {
      id: 'm3',
      senderId: 'seller',
      senderName: mockSellers[0].nickname,
      content: '好的，明天图书馆见',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 20).toLocaleString(),
      isOwn: false
    }
  ],
  c2: [
    {
      id: 'm4',
      senderId: 'current',
      senderName: '我',
      content: '教材还有吗？',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toLocaleString(),
      isOwn: true
    },
    {
      id: 'm5',
      senderId: 'seller',
      senderName: mockSellers[1].nickname,
      content: '还有一本，成色不错。',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 55).toLocaleString(),
      isOwn: false
    }
  ]
};

// 工具方法：在 localStorage 中初始化一次
export function ensureMockState() {
  try {
    // 迁移旧的心愿单到新的收藏列表
    const oldWishlist = localStorage.getItem('mock_wishlist');
    const hasFavorites = !!localStorage.getItem('mock_favorites');
    if (!hasFavorites) {
      if (oldWishlist) {
        localStorage.setItem('mock_favorites', oldWishlist);
      } else {
        localStorage.setItem('mock_favorites', JSON.stringify(initialFavorites));
      }
    }
    // 清理旧的收藏条目中的无效/过期 coverImage 与 productImage
    try {
      const rawFav = localStorage.getItem('mock_favorites');
      if (rawFav) {
        let items = [];
        try { items = JSON.parse(rawFav) || []; } catch { items = []; }
        let changed = false;
        items = items.map(item => {
          const pid = String(item.productId || item.product?.id || '').trim();
          const p = mockProducts.find(mp => String(mp.id) === pid);
          const primaryImage = Array.isArray(p?.images) ? p.images[0] : undefined;
          const isBadCover = /product-1\.svg$/.test(String(item.coverImage || ''));
          const isBadProduct = /product-1\.svg$/.test(String(item.productImage || ''));
          if (primaryImage && (item.coverImage !== primaryImage || item.productImage !== primaryImage || isBadCover || isBadProduct)) {
            changed = true;
            return { ...item, coverImage: primaryImage, productImage: primaryImage };
          }
          if (!primaryImage && (isBadCover || isBadProduct)) {
            const fallback = item.productImage || item.coverImage || (Array.isArray(item.images) ? item.images[0] : undefined) || FALLBACK_IMAGE;
            changed = true;
            return { ...item, coverImage: fallback, productImage: fallback };
          }
          return item;
        });
        if (changed) {
          try { localStorage.setItem('mock_favorites', JSON.stringify(items)); } catch {}
        }
      }
    } catch {}
    // 保留订单与消息初始化
    if (!localStorage.getItem('mock_orders')) {
      localStorage.setItem('mock_orders', JSON.stringify(initialOrders));
    }
    if (!localStorage.getItem('mock_conversations')) {
      localStorage.setItem('mock_conversations', JSON.stringify(initialConversations));
    }
    if (!localStorage.getItem('mock_messages')) {
      localStorage.setItem('mock_messages', JSON.stringify(initialMessages));
    }
  } catch {}
}

export function isMockEnabled() {
  return String(import.meta.env.VITE_USE_MOCK || 'true') === 'true';
}