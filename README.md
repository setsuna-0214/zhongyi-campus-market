# 中易校园二手交易平台

校园交易平台 - 中易（zhongyi-campus-market）

项目开发日志：https://lcnm6c2kbobk.feishu.cn/wiki/Q0fswcKsViN5D4kDAK6c17n3n5g?from=from_copylink

## 技术栈

### 前端
- React 18 + React Router 6
- Vite 7 构建工具
- Ant Design 5 UI组件库
- Axios HTTP客户端
- Socket.io 实时通信

### 后端
- Spring Boot 3.5
- Spring Security + JWT认证
- MyBatis + Spring Data JPA
- MySQL 8 数据库
- Redis 缓存
- Java 17

## 项目结构

```
zhongyi-campus-market/
├── FrontEnd/                 # 前端项目
│   ├── public/               # 静态资源
│   │   └── images/           # 图片资源
│   ├── src/
│   │   ├── api/              # API接口层（含Mock实现）
│   │   ├── components/       # 通用组件
│   │   ├── config/           # 配置文件
│   │   ├── contexts/         # React Context
│   │   ├── pages/            # 页面组件
│   │   │   ├── Admin/        # 管理后台
│   │   │   ├── Auth/         # 认证（登录/注册/找回密码）
│   │   │   ├── Chat/         # 聊天
│   │   │   ├── Home/         # 首页
│   │   │   ├── Products/     # 商品（详情/发布）
│   │   │   ├── Search/       # 搜索
│   │   │   └── User/         # 用户中心
│   │   ├── utils/            # 工具函数
│   │   └── __tests__/        # 测试文件
│   ├── .env                  # 环境变量
│   ├── .env.example          # 环境变量示例
│   ├── package.json
│   └── vite.config.js        # Vite配置
├── BackEnd/                  # 后端项目（Spring Boot）
│   ├── src/main/java/        # Java源码
│   ├── src/main/resources/   # 配置文件
│   └── pom.xml               # Maven配置
└── docs/                     # 文档
    ├── API.md                # 接口文档
    └── 软件需求规格说明书_v0.md
```

## 运行与启动指南

### 一、前端 Mock 快速启动（无需后端）

适合快速预览和前端开发调试。

**前置要求：**
- Node.js >= 16.x（推荐 18.x 或更高）
- npm 或 yarn

**步骤：**
```bash
# 进入前端目录
cd FrontEnd

# 复制环境变量示例
# Windows CMD
copy .env.example .env
# macOS/Linux
cp .env.example .env

# 编辑 .env 文件，设置 Mock 模式
# VITE_USE_MOCK=true
# VITE_API_BASE_URL=http://localhost:8080/api

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 或
npm start

# 访问 http://localhost:5173/
```

Mock 模式下，前端使用内置示例数据（`src/api/mockData.js`），包括商品、收藏、订单、聊天等，无需连接后端与数据库。

**Mock 测试账号：**
- 用户名/邮箱：任意非空值
- 密码：任意非空值
- 快速登录：用户名 `1`，密码 `1`

### 二、前后端联调启动

**前置要求：**
- JDK 17
- Maven 3.9+
- MySQL 8
- Redis（可选，用于缓存）

**启动后端：**
```bash
# 进入后端目录
cd BackEnd

# 配置数据库连接（编辑 src/main/resources/application.properties）

# 运行
mvn -DskipTests spring-boot:run

# 默认后端地址：http://localhost:8080
```

**启动前端：**
```bash
cd FrontEnd

# 编辑 .env 文件
# VITE_USE_MOCK=false
# VITE_API_BASE_URL=http://localhost:8080

# 安装依赖
npm install

# 启动
npm run dev

# 访问 http://localhost:5173/
```

## 环境变量说明（前端）

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_USE_MOCK` | 是否使用Mock数据 | `true` |
| `VITE_API_BASE_URL` | 后端API地址 | `http://localhost:8080` |
| `VITE_DEBUG` | 是否启用调试日志 | 开发环境自动启用 |

## 常用命令

### 前端（FrontEnd）
```bash
npm run dev      # 开发启动
npm run build    # 生产构建
npm run preview  # 预览构建产物
npm run lint     # 代码检查
npm run lint:fix # 自动修复
```

### 后端（BackEnd）
```bash
mvn spring-boot:run  # 开发启动
mvn package          # 打包构建
mvn test             # 运行测试
```

## API 接口

详细接口文档请参考 [docs/API.md](docs/API.md)

主要模块：
- 认证：登录、注册、验证码、找回密码
- 商品：搜索、详情、发布、相关推荐
- 收藏：添加、删除、列表
- 订单：创建、确认、取消、评价
- 用户：个人信息、头像、关注
- 聊天：会话、消息

## 常见问题

**端口占用：**
- 前端默认端口 5173，可在 `vite.config.js` 中修改
- 后端默认端口 8080，可在 `application.properties` 中修改

**接口 404 或跨域：**
- 确认 `.env` 中 `VITE_API_BASE_URL` 指向正确的后端地址
- 后端需配置 CORS 允许跨域

**Mock 与真实后端切换：**
- 修改 `.env` 中 `VITE_USE_MOCK` 为 `true` 或 `false`
- 重启开发服务器生效

---

## 提交规范

### 提交信息格式

| 类型前缀 | 说明 | 示例 |
|----------|------|------|
| `feat` | 新功能 | `feat: 添加用户登录功能` |
| `fix` | 修复bug | `fix: 修复首页图片无法加载的问题` |
| `docs` | 文档更新 | `docs: 更新API接口文档` |
| `style` | 代码格式（非CSS） | `style: 按照ESLint规则格式化代码` |
| `refactor` | 代码重构 | `refactor: 重构用户模块以提高可读性` |
| `perf` | 性能优化 | `perf: 优化图片懒加载算法` |
| `test` | 测试相关 | `test: 为用户登录功能添加单元测试` |
| `chore` | 构建/工具 | `chore: 更新webpack配置` |
| `ci` | CI配置 | `ci: 在GitHub Actions中增加Node.js版本` |
| `revert` | 回滚提交 | `revert: 回滚某次提交` |

### 提交方式

请不要直接在 `main` 分支上进行开发。可采用以下方式：

**分支开发：**
1. 从 `main` 创建开发分支（如 `dev-frontend`、`dev-backend`）
2. 完成开发后执行 `git rebase main` 同步主分支
3. 发起 Pull Request 合并

**Fork 开发：**
1. Fork 本项目到自己账号
2. 在 Fork 仓库中开发
3. 同步主仓库后发起 Pull Request
