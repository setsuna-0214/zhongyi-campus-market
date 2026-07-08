# 生产环境部署说明

这份说明用于把“中易校园集市项目”部署到一台 Linux 服务器上。推荐使用 Docker Compose 部署，前端、后端、MySQL、Redis 会作为一组容器运行。

## 1. 服务器环境要求

服务器建议至少满足：

- Linux 系统（Ubuntu 22.04 / CentOS 7+ / Debian 12 均可）
- 2 核 CPU
- 4 GB 内存
- 20 GB 可用磁盘空间
- 已安装：
  - Docker
  - Docker Compose 插件
  - Git
- 可选：
  - 域名
  - 已安装的宿主机 Nginx（如果你想自己做 HTTPS 反向代理）

### Docker / Compose 检查命令

```bash
docker -v
docker compose version
```

## 2. 阿里云安全组 / 防火墙放行端口说明

至少放行：

- `80/tcp`：HTTP 访问
- `443/tcp`：如果后续配置 HTTPS，需要放行

如果宿主机已有 Nginx，且你把容器前端改为 `8088` 之类端口，那么还需要在安全组中按你的实际代理方式处理。

### 强烈不建议放行的端口

不要把这些端口直接开放到公网：

- `3306`：MySQL
- `6379`：Redis
- `8080`：后端容器内部服务端口

生产部署文件已经让它们只在 Docker 内部网络中访问。

## 3. 获取 / 上传项目代码

### 方式一：直接从 GitHub 拉取

```bash
git clone https://github.com/setsuna-0214/zhongyi-campus-market.git
cd zhongyi-campus-market
```

### 方式二：上传你本地改造后的项目

如果你当前机器上的代码已经完成了课程改造，可以把整个项目目录打包后上传到服务器，例如：

```bash
tar -czf zhongyi-campus-market.tar.gz zhongyi-campus-market
```

上传后在服务器解压：

```bash
tar -xzf zhongyi-campus-market.tar.gz
cd zhongyi-campus-market
```

## 4. 创建服务器环境变量文件

复制生产示例文件：

```bash
cp .env.production.example .env
nano .env
```

至少要修改这些值：

```env
MYSQL_ROOT_PASSWORD=你的强随机ROOT密码
DB_PASSWORD=你的强随机数据库密码
JWT_SECRET=至少32位的长随机JWT密钥
```

如果要启用完整功能，继续填写：

```env
MAIL_USERNAME=邮箱账号
MAIL_PASSWORD=邮箱授权码
OSS_ACCESS_KEY_ID=阿里云OSS访问密钥ID
OSS_ACCESS_KEY_SECRET=阿里云OSS访问密钥Secret
OSS_BUCKET_NAME=OSS桶名
AI_DASHSCOPE_API_KEY=通义千问DashScope密钥
```

`JWT_SECRET` 一定不要用示例值，建议使用至少 32 位的随机字符串。

## 5. 启动命令

### 一键构建并启动

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 查看容器状态

```bash
docker compose -f docker-compose.prod.yml ps
```

### 停止服务

```bash
docker compose -f docker-compose.prod.yml down
```

### 停止并删除匿名卷（谨慎）

```bash
docker compose -f docker-compose.prod.yml down -v
```

> `down -v` 会删除数据库 / Redis 对应的数据卷，除非你明确要清空数据，否则不要执行。

## 6. 查看日志命令

### 查看全部服务日志

```bash
docker compose -f docker-compose.prod.yml logs -f
```

### 只看后端日志

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

### 只看前端日志

```bash
docker compose -f docker-compose.prod.yml logs -f frontend
```

### 只看数据库日志

```bash
docker compose -f docker-compose.prod.yml logs -f mysql
```

### 只看 Redis 日志

```bash
docker compose -f docker-compose.prod.yml logs -f redis
```

## 7. 首次部署后的检查

### 7.1 检查后端健康状态

```bash
docker compose -f docker-compose.prod.yml exec backend wget -qO- http://localhost:8080/actuator/health
```

正常情况下应返回包含 `UP` 的结果。

### 7.2 检查前端是否可访问

```bash
curl http://localhost/
```

### 7.3 检查求购表是否创建成功

因为本项目新增了 `want_requests` 表，生产 compose 已自动挂载：

- `BackEnd/sql/init.sql`
- `BackEnd/sql/want_tables.sql`
- `BackEnd/sql/seed_data.sql`

所以**首次建库**时会自动创建求购表。

如果你是基于旧数据库升级，需手动执行：

```bash
docker compose -f docker-compose.prod.yml exec mysql sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' < BackEnd/sql/want_tables.sql
```

此外，如果你的旧库是在阶段二之前创建的，还需要手动执行：

- `products.admin_offline` 的 ALTER
- `forum_posts.category` 的 ALTER

这些语句都已经写在 `BackEnd/sql/init.sql` 末尾。

## 8. 管理员账号创建方法

假设你要把 `user_id=1` 的用户提升为管理员：

```sql
UPDATE `users`    SET `role`='admin' WHERE `user_id`=1;
UPDATE `userinfo` SET `role`='admin' WHERE `user_id`=1;
```

进入数据库容器执行示例：

```bash
docker compose -f docker-compose.prod.yml exec mysql mysql -uroot -p
```

进入 MySQL 后：

```sql
USE campus_market;
UPDATE `users`    SET `role`='admin' WHERE `user_id`=1;
UPDATE `userinfo` SET `role`='admin' WHERE `user_id`=1;
```

修改后请让该用户**重新登录**，以获取带 `role` 的新 token。

## 9. 系统状态面板说明

管理员后台 `/admin/system` 会展示：

- 后端状态
- 数据库状态
- Redis 状态
- 当前环境 profile
- 服务器时间
- 用户数量
- 商品数量
- 订单数量
- 帖子数量
- 求购数量

这些字段的数据源来自后端接口：

- `GET /api/admin/system/status`

管理员首页 `/admin/dashboard` 会展示统计卡片，数据源来自：

- `GET /api/admin/statistics`

## 10. 更新部署

以后代码更新后，可以执行：

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## 11. 数据备份

建议定期备份 MySQL 数据：

```bash
docker compose -f docker-compose.prod.yml exec mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" campus_market' > campus_market_backup.sql
```

查看 Docker 数据卷：

```bash
docker volume ls | grep campus
```

## 12. HTTPS 建议

如果要公开给别人访问，建议配置 HTTPS。常见做法有两种：

- 使用服务器面板或云厂商负载均衡配置 HTTPS，然后转发到本应用端口。
- 在宿主机安装 Nginx 和 Certbot，把本项目的 `APP_PORT` 改为 `8088`，再让宿主机 Nginx 反向代理到 `http://127.0.0.1:8088`。

使用宿主机 Nginx 反向代理时，在 `.env` 中设置：

```env
APP_PORT=8088
```

然后重新启动：

```bash
docker compose -f docker-compose.prod.yml up -d
```

## 13. AI 和图片上传说明

### AI 功能

AI 商品描述生成依赖：

```env
AI_DASHSCOPE_API_KEY=
```

不配置该密钥时：

- 网站主体仍可运行
- 但 AI 描述生成会不可用

### OSS 图片上传

本项目已经修复为：

- **OSS 未配置时，后端仍可正常启动**
- 只有在用户真正调用图片上传接口时，才会返回中文提示：
  - `图片上传服务未配置，暂时不可用`

这意味着：

- 不配置 OSS 不会导致整站起不来
- 但生产环境如果需要长期保存图片，仍强烈建议配置 OSS

## 14. 常见问题

### 问题 1：前端能打开，但接口全是 404

排查：

1. 查看后端容器是否正常启动：
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```
2. 查看后端日志：
   ```bash
   docker compose -f docker-compose.prod.yml logs -f backend
   ```
3. 检查前端 Nginx 是否已经把 `/api/` 代理到 `backend:8080`
   - 配置文件：`FrontEnd/nginx.conf`

### 问题 2：数据库启动正常，但后端报表不存在

如果是旧数据库升级：

- 手动执行 `BackEnd/sql/want_tables.sql`
- 再执行 `BackEnd/sql/init.sql` 末尾新增的 ALTER

### 问题 3：管理员后台打不开

请确认：

1. 该账号在 `users.role` / `userinfo.role` 中都已是 `admin`
2. 修改角色后重新登录
3. JWT token 是新生成的

### 问题 4：图片上传失败

可能原因：

- 没有配置 OSS
- OSS 配置错误
- Bucket 权限 / 域名配置错误

如果完全未配置 OSS，系统不会崩，但图片上传功能不可用。

### 问题 5：页面正常但 WebSocket / 聊天异常

请确认：

- `FrontEnd/nginx.conf` 中 `/ws/` 已反向代理到 `backend:8080/ws/`
- 后端容器健康正常

### 问题 6：容器启动失败提示环境变量缺失

生产 compose 对一些关键变量使用了 `:?` 强校验，例如：

- `MYSQL_ROOT_PASSWORD`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`

请先检查 `.env` 是否已正确填写。
