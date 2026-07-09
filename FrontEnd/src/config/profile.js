/**
 * 个人中心配置
 * 定义个人页背景图选项
 */

export const PROFILE_BANNER_OPTIONS = [
  { key: 'none', label: '无背景', path: null },
  { key: 'classic', label: '蓝紫', path: '/images/carousel/carousel-1.svg' },
  { key: 'gradient', label: '浅绿', path: '/images/carousel/carousel-2.svg' },
  { key: 'geometry', label: '橙黄', path: '/images/carousel/carousel-3.svg' },
];

export const DEFAULT_PROFILE_BANNER_KEY = 'classic';