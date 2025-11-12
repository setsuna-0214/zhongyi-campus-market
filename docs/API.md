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

### 忘记密码
- `POST /auth/forgot-password`
  - Request:
    ```json
    {
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

### 认证说明
认证通过后，前端将 `token` 存储在 `localStorage.authToken`，并将 `user` 存储在 `localStorage.authUser`。当未找到 `authToken` 时，前端会回退读取 `localStorage.authUser.token`。
后续请求中，前端会在请求头自动附加 `Authorization: Bearer <token>`。Axios 基础配置包含 `baseURL` 与 `timeout: 10000` 毫秒。

## 商品 Products

- `GET /products`
  - Query Params:
    - `keyword`、`category`、`location`、`status`
    - `priceMin`、`priceMax`
    - `sort` (枚举：`latest | price-low | price-high | popular`)
    - `page`、`pageSize`
  - Response（两种兼容形态之一）：
    - `{ items: Product[], total: number }`
    - `Product[]`

- `GET /products/:id`
  - Response: `Product`

- `GET /products/:id/related`
  - Response（两种兼容形态之一）：
    - `{ items: Product[] }`
    - `Product[]`

### Product 类型示例
```
{
  id: 1,
  title: "iPhone 14 Pro 128GB",
  price: 6999,
  originalPrice?: 7999,
  images: ["/images/products/product-1.jpg"],
  category: "electronics",
  condition: "like-new",
  location: "北京大学",
  seller: { id: 1, name: "张同学", avatar: "/images/avatars/avatar-1.svg", rating?: 4.8 },
  views?: 156,
  likes?: 23,
  publishTime?: "2024-01-15T10:30:00Z",
  description?: "..."
}
```

## 首页 Home

- `GET /home/hot`
  - Response（两种兼容形态之一）：
    - `HomeProduct[]`
    - `{ items: HomeProduct[] }`
  - `HomeProduct` 示例：
    ```json
    {
      "id": 1,
      "title": "热销台灯",
      "image": "/images/products/lamp.jpg",
      "price": 59,
      "publishedAt": "2024-01-15",
      "seller": "张同学",
      "location": "北京大学",
      "category": "electronics",
      "status": "在售"
    }
    ```

- `GET /home/latest`
  - Response（两种兼容形态之一）：
    - `HomeProduct[]`
    - `{ items: HomeProduct[] }`

## 收藏 Favorites

- `GET /favorites`
  - Response（两种兼容形态之一）：
    - `FavoriteItem[]`
    - `{ items: FavoriteItem[] }`

- `POST /favorites`
  - Request:
    ```json
    { "productId": 123 }
    ```
  - Response:
    ```json
    {
      "id": 1,
      "productId": 123,
      "createdAt": "2024-01-15T10:30:00Z"
    }
    ```

- `DELETE /favorites/:id`
  - Response:
    ```json
    { "success": true }
    ```

- 兼容端点（可选）：`DELETE /favorites/by-product/:productId`

## 购物车 Cart

- `POST /cart`
  - Request:
    ```json
    { "productId": 123, "quantity": 1 }
    ```
  - Response:
    ```json
    { "success": true }
    ```

- `POST /cart/batch`
  - Request:
    ```json
    { "items": [ { "productId": 123, "quantity": 2 }, { "productId": 456, "quantity": 1 } ] }
    ```
  - Response:
    ```json
    { "success": true }
    ```

## 订单 Orders

- `GET /orders`
  - Query Params:
    - `status`、`keyword`、`startDate`、`endDate`
  - Response（两种兼容形态之一）：
    - `Order[]`
    - `{ items: Order[] }`

- `GET /orders/stats`
  - Response:
    ```json
    { "total": 10, "pending": 3, "completed": 6, "cancelled": 1 }
    ```

- `POST /orders/:id/confirm`
  - Response:
    ```json
    { "success": true }
    ```

- `POST /orders/:id/cancel`
  - Response:
    ```json
    { "success": true }
    ```

- `POST /orders/:id/review`
  - Request:
    ```json
    { "rating": 5, "comment": "物品很好" }
    ```

## 用户 User

- `GET /user/me`
  - Response: `User`

- `PUT /user/me`
  - Request：`User` 
  - Response: `User`

- `POST /user/me/avatar`
  - Request：`multipart/form-data`，字段名 `avatar`
  - Response：
    ```json
    { "avatarUrl": "/images/avatars/avatar-1.svg" }
    ```

- `GET /user/collections`
  - Response：
    ```json
    { "published": [], "purchases": [], "favorites": [] }
    ```

- `GET /user/published`
  - Response（两种兼容形态之一）：
    - `Product[]`
    - `{ items: Product[] }`

- `GET /user/purchases`
  - Response（两种兼容形态之一）：
    - `Product[]`
    - `{ items: Product[] }`

- `POST /user/me/email/change-request`
  - Request：
    ```json
    { "newEmail": "new@email.com" }
    ```

- `POST /user/me/email/change-confirm`
  - Request：
    ```json
    { "newEmail": "new@email.com", "verificationCode": "123456" }
    ```

- `POST /user/me/password`
  - Request：
    ```json
    { "currentPassword": "old", "newPassword": "new", "verificationCode": "123456" }
    ```

## 聊天 Chat

- `GET /chat/conversations`
  - Response（两种兼容形态之一）：
    - `Conversation[]`
    - `{ items: Conversation[] }`

- `GET /chat/conversations/:id/messages`
  - Response（两种兼容形态之一）：
    - `Message[]`
    - `{ items: Message[] }`

- `POST /chat/conversations/:id/messages`
  - Request：
    ```json
    { "content": "你好", "type": "text" }
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
