# 中易校园二手交易平台前后端接口文档

本前端已接入后端接口。以下为接口约定，用于后端对接与联调。

## 认证 Authentication

- `POST /auth/login`
  - Request: `{ username?: string, email?: string, password: string }`
  - Response: `{ token: string, user: { id, username, email, name, avatar, ... } }`

- `POST /auth/register`
  - Request: `{ username, email, password, phone?, studentId? }`
  - Response: `{ user: { id, username, email }, message?: string }`

认证通过后，前端将 `token` 存储在 `localStorage.authToken`，并将 `user` 存储在 `localStorage.authUser`。后续请求在 `Authorization: Bearer <token>` 中携带。

## 商品 Products

- `GET /products`
  - Query Params:
    - `keyword`、`category`、`condition`、`location`
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

## 环境变量

- `REACT_APP_API_BASE_URL`：后端基础 URL（例如 `http://localhost:3000/api`）。
  - 前端默认值：`http://localhost:3000/api`
  - 可在 `.env` 文件中覆盖。

## 错误处理

前端会根据后端返回的 `message` 字段或 HTTP 错误信息统一提示。请保证后端错误响应体包含 `message` 字段以提升可读性。

## 认证拦截器说明

前端 `axios` 客户端会在请求头自动附加 `Authorization`。如需自定义，请在登录响应中返回 `token` 并由前端保存；或在每次调用前端服务方法时传入自定义配置。

## 后续扩展

- 心愿单：`GET /wishlist`、`POST /wishlist`、`DELETE /wishlist/:id`
- 订单：`GET /orders`、`GET /orders/:id`、`POST /orders/:id/confirm`
- 用户：`GET /users/me`、`PUT /users/me`
- 聊天：`GET /conversations`、`GET /conversations/:id/messages`、`POST /messages`

以上接口待后端提供后，可在 `src/api/` 中增补对应服务，并在页面中接入。
