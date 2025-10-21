# 图片资源文件夹说明

本文件夹用于存放校园二手交易平台的所有图片资源。

## 文件夹结构

### 📸 carousel/
存放首页轮播图片
- 建议尺寸：1200x400px
- 格式：JPG, PNG, WebP
- 命名规范：carousel-1.jpg, carousel-2.jpg 等

### 🛍️ products/
存放商品图片
- 建议尺寸：400x400px（正方形）
- 格式：JPG, PNG, WebP
- 命名规范：product-{id}-{序号}.jpg

### 👤 avatars/
存放用户头像
- 建议尺寸：200x200px（正方形）
- 格式：JPG, PNG
- 命名规范：avatar-{userId}.jpg 或 default-avatar.png

### 🎨 icons/
存放网站图标和小图标
- 建议尺寸：根据用途而定（16x16, 24x24, 32x32, 64x64px等）
- 格式：PNG, SVG（推荐）
- 命名规范：icon-{功能名}.svg

### 🌄 backgrounds/
存放背景图片
- 建议尺寸：1920x1080px或更高
- 格式：JPG, PNG, WebP
- 命名规范：bg-{页面名}.jpg

## 使用方法

在React组件中引用图片：

```jsx
// 引用轮播图
<img src="/images/carousel/carousel-1.jpg" alt="轮播图1" />

// 引用商品图片
<img src="/images/products/product-123-1.jpg" alt="商品图片" />

// 引用头像
<img src="/images/avatars/avatar-456.jpg" alt="用户头像" />

// 引用图标
<img src="/images/icons/icon-cart.svg" alt="购物车图标" />

// 引用背景图
<div style={{backgroundImage: 'url(/images/backgrounds/bg-home.jpg)'}} />
```

## 注意事项

1. 所有图片文件名请使用小写字母和连字符
2. 建议使用WebP格式以获得更好的压缩效果
3. 大图片请进行适当压缩以提高加载速度
4. SVG格式适合图标和简单图形
5. 请定期清理不再使用的图片文件