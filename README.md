# zhongyi-campus-market
中级实训项目 校园二手交易平台 - 中易

项目开发日志：https://lcnm6c2kbobk.feishu.cn/wiki/Q0fswcKsViN5D4kDAK6c17n3n5g?from=from_copylink


# 提交规范

## 提交信息格式
提交信息需带有类型前缀，格式如下：
| 类型前缀    | 说明                                                         | 示例                                            |
| -------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| **`feat`**     | **新功能（feature）**：提交引入了一个新的功能。              | `feat: 添加用户登录功能`                        |
| **`fix`**      | **修复bug（bug fix）**：提交修复了一个代码中的错误或问题。   | `fix: 修复首页图片无法加载的问题`               |
| **`docs`**     | **文档（documentation）**：仅包含文档的更新，如README、CHANGELOG或其他说明文件的修改。 | `docs: 更新API接口文档`                         |
| **`style`**    | **代码格式（style）**：不影响代码含义的更改，如空格、格式化、缺少分号等（**注意：不是指CSS样式**）。 | `style: 按照ESLint规则格式化代码`               |
| **`refactor`** | **代码重构（refactor）**：既不是修复bug也不是添加新功能的代码更改，即优化代码结构、重命名变量等，但不改变其外部行为。 | `refactor: 重构用户模块以提高可读性`            |
| **`perf`**     | **性能优化（performance）**：提高性能的代码更改。            | `perf: 优化图片懒加载算法减少内存占用`          |
| **`test`**     | **测试（test）**：添加缺失的测试或更正现有的测试。           | `test: 为用户登录功能添加单元测试`              |
| **`chore`**    | **杂务（chore）**：其他不修改源代码或测试文件的更改，例如构建过程、依赖管理、工具配置（webpack、gitignore等）的变动。 | `chore: 更新webpack配置` `chore: 升级axios依赖` |
| **`build`**    | **构建系统（build）**：影响构建系统或外部依赖的更改（例如：gulp, broccoli, npm）。通常与`chore`类似，但更专注于构建。 | `build: 更新CI流水线配置`                       |
| **`ci`**       | **持续集成（continuous integration）**：更改CI配置文件和脚本（例如：Travis, Circle, GitHub Actions）。 | `ci: 在GitHub Actions中增加Node.js版本`         |
| **`revert`**   | **回滚（revert）**：回滚先前的某个提交。                     | `revert: 回滚某次提交：修复登录逻辑错误`        |

## 提交方式
请不要直接在本仓库`main`分支上进行开发。本仓库的`main`分支仅允许合并Pull Request。你可以采取以下两种方式之一进行开发。

### 分支开发
可以在`main`分支外建立自己的开发分支，例如`dev-backend`、`dev-frontend`等，完成后发起Pull Request合并。在发起Pull Request之前，请先执行`git rebase main`，确保分支与主分支同步。

### fork开发
也可以将本项目fork到自己的账号下进行开发。完成后，发起Pull Request合并。在发起Pull Request之前，请先同步主仓库的`main`分支到自己的fork分支。

## 运行与启动指南

以下提供两种方式启动项目：仅前端 Mock 快速体验，以及前后端联调运行。

### 一、前端 Mock 快速启动（无需后端）
- 前置要求：
  - 安装 Node.js（建议 `>=16.x`，推荐 `18.x`）与 npm
  - Windows/Mac/Linux 均可
- 步骤：
  - 进入前端目录：`cd FrontEnd`
  - 复制环境变量示例：`copy .env.example .env`（macOS/Linux 使用 `cp .env.example .env`）
  - 如需显式设置 Mock，新增或确认 `.env` 中：
    - `REACT_APP_USE_MOCK=true`
    - `REACT_APP_API_BASE_URL=http://localhost:3000/api`（默认同源占位）
  - 安装依赖：`npm install`
  - 启动开发服务器：`npm start`
  - 打开浏览器访问：`http://localhost:3000/`

说明：Mock 模式下，前端使用内置示例数据（`src/api/mockData.js`），包括商品、收藏、订单、聊天等，无需连接后端与数据库。

### 二、前后端联调启动（连接真实后端）
- 前置要求：
  - JDK 17（Spring Boot 3 需要）
  - Maven 3.9+
  - MySQL 8（如后端启用数据库持久化）
- 启动后端：
  - 进入后端目录：`cd BackEnd`
  - 运行：`mvn -DskipTests spring-boot:run`
  - 默认后端地址：`http://localhost:8080`，建议统一 API 前缀为 `/api`
- 启动前端：
  - `cd FrontEnd`
  - 创建/修改 `.env`，设置：
    - `REACT_APP_USE_MOCK=false`
    - `REACT_APP_API_BASE_URL=http://localhost:8080/api`
  - 安装依赖：`npm install`
  - 启动：`npm start`
  - 访问：`http://localhost:3000/`

### 环境变量说明（前端）
- `REACT_APP_USE_MOCK`：是否使用前端内置 Mock 数据（默认 `true`）。
  - `true`：所有页面走本地示例数据，便于无需后端快速预览。
  - `false`：通过 Axios 调用后端接口。
- `REACT_APP_API_BASE_URL`：后端接口 Base URL（例如 `http://localhost:8080/api`）。
- `PORT`：修改前端开发服务器端口（例如 Windows PowerShell：`$env:PORT=3001; npm start`）。

### 前后端常用命令
- 前端（`FrontEnd`）
  - 开发启动：`npm start`
  - 生产构建：`npm run build`
  - 单元测试：`npm test`
- 后端（`BackEnd`）
  - 开发启动：`mvn spring-boot:run`
  - 打包构建：`mvn package`

### 目录与静态资源
- 前端静态图片位于：`FrontEnd/public/images`，其中商品示例图已放在 `images/products` 并在 `mockData.js` 中引用。
- 前端构建产物输出到：`FrontEnd/build`（`npm run build` 后）。

### 常见问题
- 端口占用：
  - 前端 `3000` 端口被占用时，设置 `PORT` 环境变量重启。
- 接口 404 或跨域：
  - 确认前端 `.env` 的 `REACT_APP_API_BASE_URL` 指向后端正确地址与前缀；后端需开放对应路由并允许跨域（CORS）。
- Mock 与真实后端的切换：
  - 切换 `REACT_APP_USE_MOCK` 为 `true/false` 即可。
