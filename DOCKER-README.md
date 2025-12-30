# Docker 部署指南

## 前置要求

- 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Windows 用户安装后需重启电脑

## 配置镜像加速（国内用户必须）

1. 打开 Docker Desktop → 设置 → Docker Engine
2. 在 JSON 配置中添加：
```json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
```
3. 点击 Apply & Restart

## 快速启动

```bash
# 1. 复制环境变量文件
copy .env.example .env

# 2. 编辑 .env 文件，填写必要配置（至少修改 JWT_SECRET）

# 3. 启动所有服务
docker-compose up -d

# 4. 查看服务状态
docker-compose ps

# 5. 访问应用
# 前端: http://localhost
# 后端 API: http://localhost:8080
```

## 服务说明

| 服务 | 端口 | 说明 |
|------|------|------|
| frontend | 80 | React 前端 (Nginx) |
| backend | 8080 | Spring Boot 后端 |
| mysql | 3306 | MySQL 8.0 数据库 |
| redis | 6379 | Redis 缓存 |

## 常用命令

```bash
# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 重启服务
docker-compose restart backend

# 停止所有服务
docker-compose down

# 停止并删除数据卷（清空数据库）
docker-compose down -v

# 重新构建镜像
docker-compose build --no-cache
```

## 环境变量说明

| 变量 | 必填 | 说明 |
|------|------|------|
| JWT_SECRET | ✅ | JWT 密钥，生产环境必须修改 |
| DB_USERNAME | ❌ | 数据库用户名，默认 campus |
| DB_PASSWORD | ❌ | 数据库密码，默认 campus123 |
| MAIL_USERNAME | ❌ | 邮箱账号（用于发送验证码） |
| MAIL_PASSWORD | ❌ | 邮箱授权码 |
| OSS_* | ❌ | 阿里云 OSS 配置（图片上传） |

## 故障排查

1. **后端启动失败**: 检查 MySQL 是否完全启动
   ```bash
   docker-compose logs mysql
   ```

2. **数据库连接失败**: 等待 MySQL 健康检查通过后再启动后端
   ```bash
   docker-compose up -d mysql redis
   # 等待 30 秒
   docker-compose up -d backend frontend
   ```

3. **前端无法访问后端**: 检查 Nginx 代理配置和后端服务状态


## 导出镜像（离线部署）

如果对方网络不好，可以导出镜像：

```bash
# 导出镜像
docker save zhongyi-new-backend zhongyi-new-frontend mysql:8.0 redis:7-alpine -o campus-market-images.tar

# 对方加载镜像
docker load -i campus-market-images.tar
docker-compose up -d
```

## 注意事项

- 如果本地已运行 MySQL，需要先停止或修改 docker-compose.yml 中的端口映射
- 首次构建需要下载依赖，可能需要 5-10 分钟
- 数据存储在 Docker volumes 中，`docker-compose down -v` 会清空数据
