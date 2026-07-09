# 中易校园二手交易平台

<p align="center">
  <strong>🎓 专为高校学生打造的安全、便捷二手交易平台</strong>
</p>

<p align="center">
  <a href="https://react.dev/" target="_blank"><img src="https://img.shields.io/badge/React-18.2-blue?logo=react" alt="React"></a>
  <a href="https://spring.io/projects/spring-boot" target="_blank"><img src="https://img.shields.io/badge/Spring%20Boot-3.5-green?logo=springboot" alt="Spring Boot"></a>
  <a href="https://www.mysql.com/" target="_blank"><img src="https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql" alt="MySQL"></a>
  <a href="https://redis.io/" target="_blank"><img src="https://img.shields.io/badge/Redis-7-red?logo=redis" alt="Redis"></a>
</p>

---

## 📖 项目概述

**中易** 是一个专为校园学生设计的二手交易平台，致力于为大学生提供一个安全、便捷的闲置物品交易环境。平台支持商品发布、搜索浏览、在线沟通、订单管理等完整交易流程，帮助学生实现闲置物品的价值转化。

### 🎯 核心目标

- **便捷交易**：简化发布和购买流程，让交易更加轻松
- **校园社交**：支持用户关注、私信聊天，构建校园交易社区
- **安全可靠**：完善的用户认证和交易保护机制
- **智能辅助**：AI 驱动的商品描述生成，提升发布效率

### 📋 项目文档

- **开发日志**：[飞书文档](https://lcnm6c2kbobk.feishu.cn/wiki/Q0fswcKsViN5D4kDAK6c17n3n5g?from=from_copylink)
- **API 接口文档**：[docs/API.md](docs/API.md)

---

## ✨ 功能特性

### 👤 用户系统
| 功能 | 描述 |
|------|------|
| 注册登录 | 支持邮箱注册，验证码验证，用户名/邮箱均可登录 |
| 个人中心 | 编辑个人信息、头像上传、修改密码、修改邮箱 |
| 账号安全 | JWT Token 认证、密码加密存储、账号注销支持 |
| 社交功能 | 关注/粉丝系统、用户主页浏览 |

### 🛒 商品交易
| 功能 | 描述 |
|------|------|
| 商品发布 | 多图上传、分类选择、价格设置、交易地点 |
| 商品搜索 | 关键词搜索、分类筛选、价格区间、多种排序 |
| 商品详情 | 图片浏览、卖家信息、相关推荐、收藏功能 |
| AI 描述生成 | 基于标题和图片智能生成商品描述 |

### 📦 订单管理
| 功能 | 描述 |
|------|------|
| 订单创建 | 一键下单、订单确认、状态追踪 |
| 订单处理 | 卖家发货确认、买家收货确认、订单评价 |
| 订单筛选 | 按状态筛选、关键词搜索、时间范围查询 |

### 💬 即时通讯
| 功能 | 描述 |
|------|------|
| 私信聊天 | 买卖双方实时沟通、消息已读状态 |
| 多媒体消息 | 支持文字、图片、商品卡片分享 |
| 系统消息 | 订单通知、关注通知、商品状态变更提醒 |

### ❤️ 个人收藏
| 功能 | 描述 |
|------|------|
| 收藏管理 | 添加/取消收藏、收藏列表查看 |
| 批量操作 | 批量取消收藏 |

---

## 🛠️ 技术栈

### 前端技术
| 技术 | 版本 | 说明 |
|------|------|------|
| React | 18.2 | 前端框架 |
| React Router | 6.x | 路由管理 |
| Vite | 7.x | 构建工具 |
| Ant Design | 5.x | UI 组件库 |
| Axios | 1.x | HTTP 客户端 |
| Socket.io Client | 4.x | 实时通信 |

### 后端技术
| 技术 | 版本 | 说明 |
|------|------|------|
| Spring Boot | 3.5.7 | 应用框架 |
| Spring Security | - | 安全认证 |
| Spring Data JPA | - | 数据持久化 |
| MyBatis | 3.0.5 | ORM 框架 |
| JWT (java-jwt) | 4.4.0 | Token 认证 |
| MySQL | 8.0 | 关系数据库 |
| Redis | 7.x | 缓存服务 |
| Java | 17 | 运行环境 |

### 第三方服务
| 服务 | 说明 |
|------|------|
| 阿里云 OSS | 图片存储 |
| 邮件服务 (SMTP) | 验证码发送 |
| 阿里云 DashScope | AI 描述生成 |

---

## 📁 项目结构

```
zhongyi-campus-market/
├── FrontEnd/                       # 前端项目
│   ├── public/                     # 静态资源
│   │   └── images/                 # 图片资源
│   ├── src/
│   │   ├── api/                    # API 接口层
│   │   ├── components/             # 通用组件
│   │   │   ├── Auth/               # 认证相关组件
│   │   │   ├── AvatarUpload/       # 头像上传组件
│   │   │   ├── Layout/             # 布局组件（Header）
│   │   │   ├── ProductCard/        # 商品卡片组件
│   │   ├── pages/                  # 页面组件
│   │   │   ├── Auth/               # 认证（登录/注册/找回密码）
│   │   │   ├── Chat/               # 聊天（含系统消息）
│   │   │   ├── Home/               # 首页
│   │   │   ├── Orders/             # 订单处理
│   │   │   ├── Products/           # 商品（详情/发布/编辑）
│   │   │   ├── Search/             # 搜索
│   │   │   └── User/               # 用户中心
│   │   ├── styles/                 # 全局样式
│   │   └── utils/                  # 工具函数
│   ├── .env.example                # 环境变量示例
│   ├── package.json                # 依赖配置
│   └── vite.config.js              # Vite 配置
├── BackEnd/                        # 后端项目
│   ├── src/main/java/org/example/campusmarket/
│   │   ├── Controller/             # 控制器层
│   │   ├── Service/                # 业务逻辑层
│   │   ├── Mapper/                 # 数据访问层
│   │   ├── DTO/                    # 数据传输对象
│   │   ├── entity/                 # 实体类
│   │   ├── config/                 # 配置类
│   │   ├── exception/              # 异常处理
│   │   ├── util/                   # 工具类
│   │   └── websocket/              # WebSocket 配置
│   ├── src/main/resources/         # 配置文件
│   ├── sql/                        # 数据库初始化脚本
│   ├── Dockerfile                  # Docker 构建文件
│   └── pom.xml                     # Maven 配置
├── docs/                           # 文档
│   ├── API.md                      # 接口文档
│   └── 软件需求规格说明书_v0.md
├── docker-compose.yml              # Docker Compose 配置
├── .env.example                    # 环境变量示例
└── README.md                       # 项目说明
```

---

## 🚀 安装指南

### 环境要求

| 环境 | 版本要求 |
|------|----------|
| Node.js | >= 16.x（推荐 18.x） |
| npm/yarn | 最新版 |
| JDK | 17 |
| Maven | 3.9+ |
| MySQL | 8.0 |
| Redis | 7.x（可选） |

### 方式一：前端 Mock 快速启动（无需后端）

适合快速预览和前端开发调试。

```bash
# 1. 进入前端目录
cd FrontEnd

# 2. 复制环境变量文件
# Windows
copy .env.example .env
# macOS/Linux
cp .env.example .env

# 3. 编辑 .env 文件，启用 Mock 模式
# VITE_USE_MOCK=true
# VITE_API_BASE_URL=http://localhost:8080

# 4. 安装依赖
npm install

# 5. 启动开发服务器
npm run dev

# 6. 访问 http://localhost:3000/
```

**Mock 测试账号：**
- 用户名/邮箱：任意非空值
- 密码：任意非空值
- 快速登录：用户名 `1`，密码 `1`

### 方式二：前后端联调启动

#### 1. 启动后端服务

```bash
# 进入后端目录
cd BackEnd

# 配置数据库连接
# 编辑 src/main/resources/application.properties
# 设置 MySQL 和 Redis 连接信息

# 运行（跳过测试）
mvn -DskipTests spring-boot:run

# 后端地址：http://localhost:8080
```

#### 2. 启动前端服务

```bash
# 进入前端目录
cd FrontEnd

# 编辑 .env 文件
# VITE_USE_MOCK=false
# VITE_API_BASE_URL=http://localhost:8080

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 前端地址：http://localhost:3000/
```

### 方式三：Docker 一键部署

详细说明请参考 [DOCKER-README.md](DOCKER-README.md)

```bash
# 1. 复制环境变量文件
copy .env.example .env

# 2. 编辑 .env 文件，至少修改 JWT_SECRET

# 3. 启动所有服务
docker-compose up -d

# 4. 访问应用
# 前端: http://localhost
# 后端 API: http://localhost:8080
```

**Docker 服务说明：**

| 服务 | 端口 | 说明 |
|------|------|------|
| frontend | 80 | React 前端 (Nginx) |
| backend | 8080 | Spring Boot 后端 |
| mysql | 3307 | MySQL 8.0 数据库 |
| redis | 6379 | Redis 缓存 |

---

## ⚙️ 配置说明

### 前端环境变量（FrontEnd/.env）

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_USE_MOCK` | 是否使用 Mock 数据 | `true` |
| `VITE_API_BASE_URL` | 后端 API 地址 | `http://localhost:8080` |
| `VITE_DEBUG` | 是否启用调试日志 | 开发环境自动启用 |

### 后端/Docker 环境变量（.env）

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `JWT_SECRET` | ✅ | JWT 密钥，生产环境必须修改 |
| `DB_USERNAME` | ❌ | 数据库用户名，默认 `campus` |
| `DB_PASSWORD` | ❌ | 数据库密码，默认 `campus123` |
| `MAIL_HOST` | ❌ | 邮件服务器地址，默认 `smtp.163.com` |
| `MAIL_PORT` | ❌ | 邮件服务端口，默认 `465` |
| `MAIL_USERNAME` | ❌ | 邮箱账号（用于发送验证码） |
| `MAIL_PASSWORD` | ❌ | 邮箱授权码 |
| `OSS_ENDPOINT` | ❌ | 阿里云 OSS 节点 |
| `OSS_ACCESS_KEY_ID` | ❌ | OSS Access Key |
| `OSS_ACCESS_KEY_SECRET` | ❌ | OSS Secret Key |
| `OSS_BUCKET_NAME` | ❌ | OSS Bucket 名称 |
| `OSS_CDN_DOMAIN` | ❌ | OSS CDN 域名 |
| `AI_DASHSCOPE_API_KEY` | ❌ | 阿里云 DashScope API Key（AI 功能） |

---

## 📋 常用命令

### 前端命令

```bash
npm run dev       # 开发模式启动
npm run build     # 生产环境构建
npm run preview   # 预览构建产物
npm run lint      # 代码检查
npm run lint:fix  # 自动修复代码问题
```

### 后端命令

```bash
mvn spring-boot:run   # 开发模式启动
mvn package           # 打包构建
mvn test              # 运行测试
mvn -DskipTests package  # 跳过测试打包
```

### Docker 命令

```bash
docker-compose up -d           # 启动所有服务
docker-compose down            # 停止所有服务
docker-compose down -v         # 停止并清除数据
docker-compose logs -f backend # 查看后端日志
docker-compose restart backend # 重启后端服务
docker-compose build --no-cache # 重新构建镜像
```

---

## ❓ 常见问题

### 端口占用

- **前端**：默认端口 `3000`，可在 `vite.config.js` 中修改（或用 `VITE_DEV_PORT/PORT` 覆盖）
- **后端**：默认端口 `8080`，可在 `application.properties` 中修改
- **Docker MySQL**：映射端口 `3307`，避免与本地 MySQL 冲突

### 接口 404 或跨域

1. 确认 `.env` 中 `VITE_API_BASE_URL` 指向正确的后端地址
2. 确认后端已正确配置 CORS 跨域
3. 检查后端服务是否正常启动

### Mock 与真实后端切换

1. 修改 `FrontEnd/.env` 中 `VITE_USE_MOCK` 为 `true` 或 `false`
2. 重启前端开发服务器生效

### Docker 部署问题

- **后端启动失败**：检查 MySQL 是否完全启动，可先运行 `docker-compose logs mysql` 查看
- **数据库连接失败**：等待 MySQL 健康检查通过后再启动后端
- **镜像拉取慢**：配置 Docker 镜像加速，详见 [DOCKER-README.md](DOCKER-README.md)

---

## 🤝 贡献指南

我们欢迎任何形式的贡献！请参考以下指南：

### 提交规范

使用语义化提交信息格式：

| 类型前缀 | 说明 | 示例 |
|----------|------|------|
| `feat` | 新功能 | `feat: 添加用户登录功能` |
| `fix` | 修复 Bug | `fix: 修复首页图片无法加载的问题` |
| `docs` | 文档更新 | `docs: 更新 API 接口文档` |
| `style` | 代码格式 | `style: 按照 ESLint 规则格式化代码` |
| `refactor` | 代码重构 | `refactor: 重构用户模块以提高可读性` |
| `perf` | 性能优化 | `perf: 优化图片懒加载算法` |
| `test` | 测试相关 | `test: 为用户登录功能添加单元测试` |
| `chore` | 构建/工具 | `chore: 更新 webpack 配置` |
| `ci` | CI 配置 | `ci: 在 GitHub Actions 中增加 Node.js 版本` |
| `revert` | 回滚提交 | `revert: 回滚某次提交` |

### 开发流程

**请不要直接在 `main` 分支上进行开发**，可采用以下方式：

#### 分支开发
1. 从 `main` 创建开发分支（如 `dev-frontend`、`dev-backend`、`feature/xxx`）
2. 在开发分支上完成功能开发
3. 开发完成后执行 `git rebase main` 同步主分支最新代码
4. 发起 Pull Request 请求合并

#### Fork 开发
1. Fork 本项目到自己的账号
2. 在 Fork 仓库中进行开发
3. 同步主仓库最新代码后发起 Pull Request

### 代码规范

- 前端：遵循 ESLint 规则，提交前运行 `npm run lint:fix`
- 后端：遵循 Java 代码规范，使用 Lombok 简化代码
- 提交前确保代码能正常编译运行


---

<p align="center">
  <strong>⭐ 如果这个项目对你有帮助，请给我们一个 Star！</strong>
</p>
