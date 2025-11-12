// 用户个人页背景图配置
// 使用 public 下的静态资源路径，避免打包器模块解析
export const PROFILE_BANNER_OPTIONS = [
  { key: 'classic', label: '蓝紫', path: '/images/carousel/carousel-1.svg' },
  { key: 'gradient', label: '浅绿', path: '/images/carousel/carousel-2.svg' },
  { key: 'geometry', label: '橙黄', path: '/images/carousel/carousel-3.svg' },
  { key: 'none', label: '无背景', path: null },
];

export const DEFAULT_PROFILE_BANNER_KEY = 'classic';