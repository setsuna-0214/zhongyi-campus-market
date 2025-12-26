# 中易校园二手交易平台前后端接口文档

本前端已接入后端接口。以下为接口约定，用于后端对接与联调。

## 认证 Authentication

### 登录
- `POST /auth/login`
  - Request（支持邮箱或用户名二选一）：
    ```json
    {
      "email": "1234567@email.com",
      "password": "yourpassword"
    }
    ```
    或
    ```json
    {
      "username": "zhangsan",
      "password": "yourpassword"
    }
    ```
  - Response:
    ```json
    {
      "code": 200,
      "message": "登录成功",
      "data": {
        "token": "jwt-token-string",
        "user": {
          "id": 1,
          "username": "张同学",
          "email": "1234567@email.com"
        }
      }
    }
    ```

### 注册
- `POST /auth/register`
  - Request: 
    ```json
    {
      "username": "zhangsan",
      "email": "1234567@email.com",
      "password": "yourpassword",
      "confirmPassword": "yourpassword",
      "verificationCode": "123456"
    }
    ```
  - Response: 
    ```json
    {
      "code": 200,
      "message": "注册成功",
      "data": {}
    }
    ```

### 获取验证码
- `POST /auth/send-code`
  - Request:
    ```json
    {
      "email": "1234567@email.com"
    }
    ```
  - Response:
    ```json
    {
      "code": 200,
      "message": "验证码发送成功",
      "data": {}
    }
    ```

### 忘记密码
- `POST /auth/forgot-password`
  - Request:
    ```json
    {
      "username": "zhangsan",
      "email": "1234567@email.com",
      "verificationCode": "123456",
      "newPassword": "newpassword",
      "confirmPassword": "newpassword"
    }
    ```
  - Response:
    ```json
    {
      "code": 200,
      "message": "密码重置成功",
      "data": {}
    }
    ```

### 检查用户名是否已存在
- `GET /auth/check-username`
  - Query Params:
    - `username` - 要检查的用户名
  - Response:
    ```json
    {
      "code": 200,
      "data": {
        "exists": true
      }
    }
    ```
  - 说明：用于注册时检查用户名是否已被占用，`exists` 为 `true` 表示已存在

### 检查邮箱是否已存在
- `GET /auth/check-email`
  - Query Params:
    - `email` - 要检查的邮箱
  - Response:
    ```json
    {
      "code": 200,
      "data": {
        "exists": true
      }
    }
    ```
  - 说明：用于注册时检查邮箱是否已被注册，`exists` 为 `true` 表示已存在

### 认证说明
认证通过后，前端将 `token` 存储在 `localStorage.authToken`，并将 `user` 存储在 `localStorage.authUser`。当未找到 `authToken` 时，前端会回退读取 `localStorage.authUser.token`。
后续请求中，前端会在请求头自动附加 `Authorization: Bearer <token>`。Axios 基础配置包含 `baseURL` 与 `timeout: 10000` 毫秒。

## 商品 Products

### 搜索商品
- `GET /products`
  - Query Params:
    - `keyword` - 搜索关键词
    - `category` - 商品分类（electronics/books/daily/other）
    - `location` - 地点
    - `status` - 状态（在售/已下架/已售出/全部）
    - `excludeSold` - 是否排除已售出商品（true/false，默认true）
    - `priceMin` - 最低价格
    - `priceMax` - 最高价格
    - `sort` - 排序方式（latest/price-low/price-high/popular）
    - `page` - 页码（默认1）
    - `pageSize` - 每页数量（默认12）
  - Response:
    ```json
    {
      "items": [
        {
          "id": 1,
          "title": "iPhone 14 Pro 128GB",
          "price": 6999,
          "originalPrice": 7999,
          "images": ["/images/products/product-1.jpg"],
          "category": "electronics",
          "condition": "like-new",
          "location": "北京大学",
          "seller": {
            "id": 1,
            "name": "张同学",
            "avatar": "/images/avatars/avatar-1.svg",
            "rating": 4.8
          },
          "views": 156,
          "likes": 23,
          "publishTime": "2024-01-15T10:30:00Z",
          "status": "在售",
          "description": "九成新iPhone 14 Pro，128GB深空黑"
        }
      ],
      "total": 100
    }
    ```
  - 说明：也支持直接返回数组 `Product[]`，前端会自动兼容

### 获取商品详情
- `GET /products/:id`
  - Response:
    ```json
    {
      "id": 1,
      "title": "iPhone 14 Pro 128GB",
      "price": 6999,
      "originalPrice": 7999,
      "images": ["/images/products/product-1.jpg", "/images/products/product-2.jpg"],
      "category": "electronics",
      "condition": "like-new",
      "location": "北京大学",
      "seller": {
        "id": 1,
        "name": "张同学",
        "avatar": "/images/avatars/avatar-1.svg",
        "rating": 4.8
      },
      "views": 156,
      "likes": 23,
      "publishTime": "2024-01-15T10:30:00Z",
      "status": "在售",
      "description": "九成新iPhone 14 Pro，128GB深空黑，无磕碰，功能完好"
    }
    ```
  - 说明：前端会自动将 `saleStatus` 字段映射为 `status`

### 获取相关商品
- `GET /products/:id/related`
  - Response:
    ```json
    [
      {
        "id": 2,
        "title": "iPhone 13 Pro 256GB",
        "price": 5999,
        "images": ["/images/products/product-3.jpg"],
        "category": "electronics",
        "location": "清华大学",
        "seller": {
          "id": 2,
          "name": "李同学"
        },
        "status": "在售"
      }
    ]
    ```
  - 说明：也支持返回 `{ items: Product[] }`，前端会自动兼容

### 创建商品
- `POST /products`
  - Content-Type: `multipart/form-data`
  - Request:
    - `pro_name` - 商品标题
    - `price` - 价格
    - `category` - 分类
    - `discription` - 描述
    - `location` - 交易地址
    - `tradeMethod` - 交易方式（逗号分隔：campus,express）
    - `negotiable` - 是否支持议价（true/false）
    - `images` - 图片文件（多个）
  - Response:
    ```json
    {
      "code": 200,
      "message": "商品发布成功",
      "data": {
        "id": 123
      }
    }
    ```

### 更新商品
- `PUT /products/:id`
  - Content-Type: `multipart/form-data`
  - Request: 同创建商品，额外支持：
    - `existingImages` - 保留的已有图片URL列表（JSON字符串）
  - Response:
    ```json
    {
      "code": 200,
      "message": "商品更新成功",
      "data": {
        "id": 123
      }
    }
    ```

### 更新商品状态
- `PATCH /products/:id/status`
  - Request:
    ```json
    {
      "status": "在售"
    }
    ```
  - 说明：status 可选值：`在售`、`已下架`、`已售出`
  - Response:
    ```json
    {
      "code": 200,
      "message": "状态更新成功",
      "data": {
        "id": 123,
        "status": "在售"
      }
    }
    ```

## 首页 Home

### 获取热门商品
- `GET /home/hot`
  - Query Params:
    - `excludeSold` - 是否排除已售出商品（true/false，默认true）
  - Response:
    ```json
    [
      {
        "id": 1,
        "title": "热销台灯",
        "image": "/images/products/lamp.jpg",
        "price": 59,
        "publishedAt": "2024-01-15",
        "seller": "张同学",
        "location": "北京大学",
        "category": "electronics",
        "status": "在售",
        "views": 120
      }
    ]
    ```
  - 说明：也支持返回 `{ items: HomeProduct[] }`，前端会自动兼容

### 获取最新发布
- `GET /home/latest`
  - Query Params:
    - `excludeSold` - 是否排除已售出商品（true/false，默认true）
  - Response:
    ```json
    [
      {
        "id": 2,
        "title": "全新耳机",
        "image": "/images/products/headphone.jpg",
        "price": 199,
        "publishTime": "2024-01-16T08:30:00Z",
        "seller": "李同学",
        "location": "清华大学",
        "category": "electronics",
        "status": "在售",
        "views": 45
      }
    ]
    ```
  - 说明：也支持返回 `{ items: HomeProduct[] }`，前端会自动兼容

## 收藏 Favorites

### 获取收藏列表
- `GET /favorites`
  - Response:
    ```json
    [
      {
        "id": 1,
        "productId": 123,
        "product": {
          "id": 123,
          "title": "iPhone 14 Pro",
          "price": 6999,
          "image": "/images/products/product-1.jpg",
          "status": "在售"
        },
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
    ```
  - 说明：也支持返回 `{ items: FavoriteItem[] }`，前端会自动兼容

### 添加收藏
- `POST /favorites`
  - Request:
    ```json
    {
      "productId": 123
    }
    ```
  - Response:
    ```json
    {
      "id": 1,
      "productId": 123,
      "createdAt": "2024-01-15T10:30:00Z"
    }
    ```

### 取消收藏
- `DELETE /favorites/:id`
  - Response:
    ```json
    {
      "success": true
    }
    ```

### 根据商品ID取消收藏（可选）
- `DELETE /favorites/by-product/:productId`
  - Response:
    ```json
    {
      "success": true
    }
    ```

## 订单 Orders

### 获取订单列表
- `GET /orders`
  - Query Params:
    - `status` - 订单状态
    - `keyword` - 搜索关键词
    - `startDate` - 开始日期
    - `endDate` - 结束日期
  - Response:
    ```json
    [
      {
        "id": 1,
        "productId": 123,
        "product": {
          "id": 123,
          "title": "iPhone 14 Pro",
          "price": 6999,
          "image": "/images/products/product-1.jpg"
        },
        "quantity": 1,
        "totalPrice": 6999,
        "status": "pending",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
    ```
  - 说明：也支持返回 `{ items: Order[] }`，前端会自动兼容

### 创建订单
- `POST /orders`
  - Request:
    ```json
    {
      "productId": 123,
      "quantity": 1
    }
    ```
  - Response:
    ```json
    {
      "id": 1,
      "productId": 123,
      "quantity": 1,
      "totalPrice": 6999,
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00Z"
    }
    ```
  - 说明：
    - 前端会预检查是否存在同一商品的未完成订单（`pending_seller` 或 `pending_buyer` 状态），如有则拒绝创建
    - 建议后端也实现此检查，返回错误信息：`{ "code": 400, "message": "您已对该商品下过订单，请勿重复下单" }`

### 获取订单统计
- `GET /orders/stats`
  - Response:
    ```json
    {
      "total": 10,
      "pending": 3,
      "completed": 6,
      "cancelled": 1
    }
    ```

### 确认收货
- `POST /orders/:id/confirm`
  - Response:
    ```json
    {
      "success": true
    }
    ```

### 取消订单
- `POST /orders/:id/cancel`
  - 说明：仅买家可以取消订单，且只能在买家确认收货前取消（即 `pending_seller` 或 `pending_buyer` 状态）
  - Response:
    ```json
    {
      "success": true
    }
    ```

### 删除订单
- `DELETE /orders/:id`
  - 说明：仅可删除已取消（`cancelled`）状态的订单，删除后无法恢复
  - Response:
    ```json
    {
      "success": true
    }
    ```

### 提交评价
- `POST /orders/:id/review`
  - Request:
    ```json
    {
      "rating": 5,
      "comment": "物品很好"
    }
    ```
  - Response:
    ```json
    {
      "success": true
    }
    ```

### 获取订单详情
- `GET /orders/:id`
  - Response:
    ```json
    {
      "id": 1,
      "status": "pending",
      "orderTime": "2024-01-15T10:30:00Z",
      "product": {
        "id": 123,
        "title": "iPhone 14 Pro",
        "price": 6999,
        "image": "/images/products/product-1.jpg"
      },
      "buyer": {
        "id": 1,
        "nickname": "买家昵称"
      },
      "seller": {
        "id": 2,
        "nickname": "卖家昵称"
      },
      "sellerMessage": "卖家留言内容",
      "sellerImages": ["/images/order/img1.jpg"]
    }
    ```
  - 说明：status 可选值：
    - `pending_seller`（待卖家处理）- 订单创建后的初始状态
    - `pending_buyer`（待买家确认）- 卖家已处理，等待买家确认收货
    - `completed`（已完成）- 买家已确认收货
    - `cancelled`（已取消）- 订单已取消
  - 兼容旧状态值：`pending` 映射为 `pending_seller`，`seller_processed` 映射为 `pending_buyer`

### 更新订单状态
- `PATCH /orders/:id/status`
  - Request:
    ```json
    {
      "status": "seller_processed",
      "sellerMessage": "卖家留言",
      "sellerImages": ["/images/order/img1.jpg"]
    }
    ```
  - Response:
    ```json
    {
      "code": 200,
      "message": "更新成功"
    }
    ```

### 上传订单图片
- `POST /orders/:id/images`
  - Content-Type: `multipart/form-data`
  - Request:
    - `image` - 图片文件
  - Response:
    ```json
    {
      "code": 200,
      "url": "/images/order/uploaded-image.jpg"
    }
    ```

## 用户 User

### 获取当前用户信息
- `GET /user/me`
  - Response:
    ```json
    {
      "id": 1,
      "username": "张同学",
      "nickname": "张同学",
      "email": "1234567@email.com",
      "avatar": "/images/avatars/avatar-1.svg",
      "phone": "13800138000",
      "address": "北京大学",
      "bio": "个人简介内容",
      "joinDate": "2024-01-01",
      "gender": "男",
      "lastLoginAt": "2024-01-15T10:30:00Z"
    }
    ```
  - 说明：前端统一显示以下字段：id, username, nickname, email, avatar, phone, address, bio, joinDate, gender, lastLoginAt。后端未返回的字段前端会显示为空。

### 更新当前用户信息
- `PUT /user/me`
  - Request（可编辑字段）:
    ```json
    {
      "nickname": "张同学",
      "phone": "13800138000",
      "address": "北京大学",
      "bio": "个人简介内容",
      "gender": 1
    }
    ```
  - 说明：gender 字段值：0=保密，1=男，2=女
  - Response:
    ```json
    {
      "id": 1,
      "username": "张同学",
      "nickname": "张同学",
      "email": "1234567@email.com",
      "avatar": "/images/avatars/avatar-1.svg",
      "phone": "13800138000",
      "address": "北京大学",
      "bio": "个人简介内容",
      "joinDate": "2024-01-01",
      "gender": "男",
      "lastLoginAt": "2024-01-15T10:30:00Z"
    }
    ```

### 上传头像
- `POST /user/me/avatar`
  - Request：`multipart/form-data`，字段名 `avatar`
  - Response:
    ```json
    {
      "avatarUrl": "/images/avatars/avatar-1.svg"
    }
    ```

### 获取用户收藏集合
- `GET /user/collections`
  - Response:
    ```json
    {
      "published": [],
      "purchases": [],
      "favorites": []
    }
    ```

### 获取我发布的商品
- `GET /user/published`
  - Response:
    ```json
    [
      {
        "id": 1,
        "title": "iPhone 14 Pro",
        "price": 6999,
        "image": "/images/products/product-1.jpg",
        "status": "在售",
        "views": 156,
        "publishTime": "2024-01-15T10:30:00Z"
      }
    ]
    ```
  - 说明：也支持返回 `{ items: Product[] }`，前端会自动兼容

### 获取我购买的商品
- `GET /user/purchases`
  - Response:
    ```json
    [
      {
        "id": 2,
        "title": "MacBook Pro",
        "price": 12999,
        "image": "/images/products/product-2.jpg",
        "status": "已售出",
        "purchaseTime": "2024-01-10T10:30:00Z"
      }
    ]
    ```
  - 说明：也支持返回 `{ items: Product[] }`，前端会自动兼容

### 请求修改邮箱
- `POST /user/me/email/change-request`
  - Request:
    ```json
    {
      "newEmail": "new@email.com"
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "message": "验证码已发送"
    }
    ```

### 确认修改邮箱
- `POST /user/me/email/change-confirm`
  - Request:
    ```json
    {
      "newEmail": "new@email.com",
      "verificationCode": "123456"
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "message": "邮箱修改成功"
    }
    ```

### 修改密码
- `POST /user/me/password`
  - Request:
    ```json
    {
      "currentPassword": "oldpassword",
      "newPassword": "newpassword",
      "verificationCode": "123456"
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "message": "密码修改成功"
    }
    ```

### 注销账号
- `POST /user/me/delete`
  - Request:
    ```json
    {
      "verificationCode": "123456"
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "message": "账号已注销"
    }
    ```
  - 说明：
    - 需要先调用 `/auth/send-code` 发送验证码到用户邮箱
    - 注销后账号数据将被删除，已发布的商品将被下架
    - 未完成的订单将被取消（已完成的订单记录保留）
    - 其他用户访问已注销用户的个人主页时，会显示"用户不存在"

### 获取指定用户信息
- `GET /user/:id`
  - Response:
    ```json
    {
      "id": 1,
      "username": "zhang_student",
      "nickname": "张同学",
      "avatar": "/images/avatars/avatar-1.svg",
      "joinDate": "2024-01-01",
      "bio": "个人简介内容",
      "followersCount": 128,
      "followingCount": 45
    }
    ```
  - 说明：`followersCount` 和 `followingCount` 为可选字段，前端会优雅处理缺失情况

### 获取指定用户发布的商品
- `GET /user/:id/published`
  - Response:
    ```json
    [
      {
        "id": 1,
        "title": "iPhone 14 Pro",
        "price": 6999,
        "image": "/images/products/product-1.jpg",
        "status": "在售",
        "views": 156,
        "publishTime": "2024-01-15T10:30:00Z"
      }
    ]
    ```
  - 说明：也支持返回 `{ items: Product[] }`，前端会自动兼容

### 搜索用户
- `GET /user/search`
  - Query Params:
    - `keyword` - 搜索关键词（昵称/用户名/学校）
    - `page` - 页码
    - `pageSize` - 每页数量
  - Response:
    ```json
    {
      "items": [
        {
          "id": 1,
          "username": "zhang_student",
          "nickname": "张同学",
          "avatar": "/images/avatars/avatar-1.svg",
          "school": "北京大学",
          "bio": "个人简介",
          "followersCount": 128,
          "followingCount": 45
        }
      ],
      "total": 10
    }
    ```
  - 说明：`followersCount` 和 `followingCount` 为可选字段，前端会优雅处理缺失情况

### 获取关注列表
- `GET /user/follows`
  - Response:
    ```json
    [
      {
        "id": 2,
        "username": "li_student",
        "nickname": "李同学",
        "avatar": "/images/avatars/avatar-2.svg",
        "bio": "个人简介",
        "followersCount": 128,
        "followingCount": 45
      }
    ]
    ```
  - 说明：`followersCount` 和 `followingCount` 为可选字段，前端会优雅处理缺失情况

### 获取粉丝列表
- `GET /user/followers`
  - Response:
    ```json
    [
      {
        "id": 3,
        "username": "wang_student",
        "nickname": "王同学",
        "avatar": "/images/avatars/avatar-3.svg",
        "bio": "个人简介",
        "followersCount": 56,
        "followingCount": 32
      }
    ]
    ```
  - 说明：`followersCount` 和 `followingCount` 为可选字段，前端会优雅处理缺失情况

### 检查关注状态
- `GET /user/follows/:id/check`
  - Response:
    ```json
    {
      "isFollowing": true
    }
    ```

### 关注用户
- `POST /user/follows/:id`
  - Response:
    ```json
    {
      "success": true
    }
    ```

### 取消关注
- `DELETE /user/follows/:id`
  - Response:
    ```json
    {
      "success": true
    }
    ```

## 聊天 Chat

### 获取会话列表
- `GET /chat/conversations`
  - Response:
    ```json
    [
      {
        "id": 1,
        "userId": 2,
        "userName": "李同学",
        "userAvatar": "/images/avatars/avatar-2.svg",
        "lastMessage": "你好",
        "lastMessageTime": "2024-01-15T10:30:00Z",
        "unreadCount": 2,
        "orderId": 123
      }
    ]
    ```
  - 说明：也支持返回 `{ items: Conversation[] }`，前端会自动兼容并去重

### 创建会话
- `POST /chat/conversations`
  - Request:
    ```json
    {
      "userId": 2,
      "orderId": 123,
      "productId": 456,
      "partnerName": "李同学",
      "partnerAvatar": "/images/avatars/avatar-2.svg"
    }
    ```
  - Response:
    ```json
    {
      "id": 1,
      "userId": 2,
      "orderId": 123,
      "createdAt": "2024-01-15T10:30:00Z"
    }
    ```
  - 说明：如果与该用户的会话已存在，后端应返回已存在的会话而不是创建新的

### 获取会话消息
- `GET /chat/conversations/:id/messages`
  - Response:
    ```json
    [
      {
        "id": 1,
        "conversationId": 1,
        "senderId": 1,
        "content": "你好",
        "type": "text",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
    ```
  - 说明：也支持返回 `{ items: Message[] }`，前端会自动兼容

### 发送消息
- `POST /chat/conversations/:id/messages`
  - Request:
    ```json
    {
      "content": "你好",
      "type": "text"
    }
    ```
  - Response:
    ```json
    {
      "id": 1,
      "conversationId": 1,
      "senderId": 1,
      "content": "你好",
      "type": "text",
      "createdAt": "2024-01-15T10:30:00Z"
    }
    ```
  - 说明：
    - `type` 可选值：`text`（文本）、`image`（图片）、`product`（商品卡片）
    - 当 `type` 为 `product` 时，`content` 为商品卡片的 JSON 字符串

### 删除会话
- `DELETE /chat/conversations/:id`
  - Response:
    ```json
    {
      "success": true
    }
    ```

### 上传聊天图片
- `POST /chat/upload-image`
  - Content-Type: `multipart/form-data`
  - Request:
    - `file` - 图片文件
  - Response:
    ```json
    {
      "url": "/images/chat/uploaded-image.jpg"
    }
    ```

### 标记会话为已读
- `PUT /chat/conversations/:id/read`
  - Response:
    ```json
    {
      "success": true
    }
    ```

## AI 功能

### AI 生成商品描述
- `POST /ai/generate-description`
  - Request:
    ```json
    {
      "title": "iPhone 14 Pro 128GB",
      "category": "electronics",
      "images": [
        { "type": "url", "data": "https://example.com/image1.jpg" },
        { "type": "base64", "data": "data:image/jpeg;base64,/9j/4AAQ..." }
      ]
    }
    ```
  - Response:
    ```json
    {
      "code": 200,
      "data": {
        "description": "【iPhone 14 Pro 128GB】\n\n这是一款性能优良的电子设备..."
      }
    }
    ```
  - 说明：
    - `title`：商品标题（可选，但建议提供）
    - `category`：商品分类代码（可选）
    - `images`：图片数组（可选），每个图片包含：
      - `type`：`url`（已有图片的URL）或 `base64`（新上传图片的base64数据）
      - `data`：图片URL或base64字符串
    - 后端可根据标题、分类和图片内容，使用 AI 模型生成商品描述
    - 前端会将生成的描述填入商品描述输入框，用户可以修改完善

## 系统消息 System Messages

### 获取系统消息列表
- `GET /system-messages`
  - Response:
    ```json
    [
      {
        "id": 1,
        "type": "new_order",
        "title": "收到新订单",
        "content": "用户「小明」购买了您的商品「MacBook Pro」",
        "timestamp": "2024-01-15T10:30:00Z",
        "isRead": false,
        "link": "/orders/456",
        "linkText": "处理订单"
      }
    ]
    ```
  - 说明：
    - `type` 可选值：
      - 商品相关：`product_published`、`product_sold`、`product_unlocked`
      - 订单相关（买家）：`order_created`、`order_processed`、`order_completed`、`order_cancelled`
      - 订单相关（卖家）：`new_order`、`buyer_confirmed`、`buyer_cancelled`
      - 社交相关：`new_follower`、`product_favorited`
    - 也支持返回 `{ items: Message[] }`，前端会自动兼容

### 获取未读系统消息数量
- `GET /system-messages/unread-count`
  - Response:
    ```json
    {
      "count": 5
    }
    ```

### 标记系统消息为已读
- `PUT /system-messages/:id/read`
  - Response:
    ```json
    {
      "success": true
    }
    ```

### 标记所有系统消息为已读
- `PUT /system-messages/read-all`
  - Response:
    ```json
    {
      "success": true
    }
    ```

### 删除系统消息
- `DELETE /system-messages/:id`
  - Response:
    ```json
    {
      "success": true
    }
    ```

### 清空所有系统消息
- `DELETE /system-messages/all`
  - Response:
    ```json
    {
      "success": true
    }
    ```

## 返回形态约定

- 列表接口兼容双返回形态：返回 `[]` 或 `{ items: [], total? }`；前端会自动兼容处理。

## 环境变量

- `REACT_APP_API_BASE_URL`：后端基础 URL（例如 `http://localhost:3000/api`）。
  - 前端默认值：`http://localhost:3000/api`
  - 可在 `.env` 文件中覆盖。

## 错误处理

前端会根据后端返回的 `message` 字段或 HTTP 错误信息统一提示。请保证后端错误响应体包含 `message` 字段以提升可读性。

## 认证拦截器说明

前端 `axios` 客户端会在请求头自动附加 `Authorization: Bearer <token>`。令牌读取顺序为：独立存储的 `localStorage.authToken` 优先，其次尝试从 `localStorage.authUser.token` 读取。错误统一处理为使用后端返回的 `message` 字段或 HTTP 错误信息进行提示。

## 备注

以上端点均已在前端 `src/api/` 中实现调用；若后端返回体存在字段名差异（如商品状态 `saleStatus` 与 `status`），前端会进行必要的归一化映射以保证展示一致。
