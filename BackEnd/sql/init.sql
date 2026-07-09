-- 校园二手交易平台数据库初始化脚本
-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS campus_market DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campus_market;

-- ============================================
-- 1. 用户认证表（基础表，无依赖）
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
    `user_id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名（登录用）',
    `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '邮箱（登录用）',
    `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码（BCrypt加密）',
    `role` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'user' COMMENT '角色：admin-管理员, user-普通用户',
    `status` tinyint(1) DEFAULT '1' COMMENT '账号状态：0-禁用, 1-正常',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    `last_login_at` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
    `is_deleted` tinyint(1) DEFAULT '0',
    `deleted_at` datetime DEFAULT NULL,
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_email` (`email`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户认证表（敏感信息）';

-- ============================================
-- 2. 用户信息表（依赖 users）
-- ============================================
CREATE TABLE IF NOT EXISTS `userinfo` (
    `user_id` int NOT NULL COMMENT '用户ID（关联users表）',
    `username` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户名',
    `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户邮箱（冗余字段）',
    `role` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'user' COMMENT '用户角色：user-普通用户，admin-管理员',
    `nickname` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '昵称（展示用）',
    `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '头像URL',
    `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '手机号',
    `address` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '地址/学校信息',
    `bio` text COLLATE utf8mb4_unicode_ci COMMENT '个人简介',
    `gender` tinyint(1) DEFAULT NULL COMMENT '性别：0-女, 1-男, NULL-未设置',
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `last_login_at` datetime DEFAULT NULL COMMENT '最后登录时间',
    `is_deleted` tinyint(1) DEFAULT '0',
    `deleted_at` datetime DEFAULT NULL,
    PRIMARY KEY (`user_id`),
    KEY `idx_nickname` (`nickname`),
    KEY `idx_address` (`address`),
    KEY `idx_email` (`email`),
    CONSTRAINT `userinfo_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户信息表（公开资料）';

-- ============================================
-- 3. 商品表（依赖 users）
-- ============================================
CREATE TABLE IF NOT EXISTS `products` (
    `pro_id` int NOT NULL AUTO_INCREMENT COMMENT '商品ID',
    `pro_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '商品名称',
    `price` decimal(10,2) NOT NULL COMMENT '价格',
    `is_seal` tinyint(1) DEFAULT '0' COMMENT '是否已售出：0-在售, 1-已售',
    `discription` text COLLATE utf8mb4_unicode_ci COMMENT '商品描述',
    `picture` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '商品图片URL',
    `saler_id` int NOT NULL COMMENT '卖家用户ID',
    `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '商品类目',
    `view_count` int DEFAULT '0' COMMENT '浏览次数',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`pro_id`),
    KEY `idx_saler_id` (`saler_id`),
    KEY `idx_is_seal` (`is_seal`),
    KEY `idx_category` (`category`),
    KEY `idx_created_at` (`created_at`),
    KEY `idx_view_count` (`view_count`),
    CONSTRAINT `products_ibfk_1` FOREIGN KEY (`saler_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

-- ============================================
-- 4. 订单表（依赖 users, products）
-- ============================================
CREATE TABLE IF NOT EXISTS `orders` (
    `id` int NOT NULL AUTO_INCREMENT COMMENT '订单ID',
    `user_id` int NOT NULL COMMENT '买家用户ID',
    `product_id` int NOT NULL COMMENT '商品ID',
    `quantity` int DEFAULT '1' COMMENT '购买数量',
    `total_price` decimal(10,2) NOT NULL COMMENT '总价',
    `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT '订单状态：pending-待处理, completed-已完成, cancelled-已取消',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `rating` int DEFAULT NULL COMMENT '评分（1-5星）',
    `comment` text COLLATE utf8mb4_unicode_ci COMMENT '评价内容',
    `seller_message` text COLLATE utf8mb4_unicode_ci COMMENT '卖家留言',
    `seller_images` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '卖家上传的图片URL，逗号分隔',
    `seller_id` int DEFAULT NULL COMMENT '卖家用户ID',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_product_id` (`product_id`),
    KEY `idx_status` (`status`),
    KEY `idx_created_at` (`created_at`),
    CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`pro_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- ============================================
-- 5. 收藏表（依赖 users, products）
-- ============================================
CREATE TABLE IF NOT EXISTS `fav_products` (
    `id` int NOT NULL AUTO_INCREMENT COMMENT '收藏ID',
    `user_id` int NOT NULL COMMENT '用户ID',
    `pro_id` int NOT NULL COMMENT '商品ID',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_product` (`user_id`,`pro_id`) COMMENT '用户-商品唯一约束',
    KEY `idx_user_id` (`user_id`),
    KEY `idx_pro_id` (`pro_id`),
    CONSTRAINT `fav_products_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fav_products_ibfk_2` FOREIGN KEY (`pro_id`) REFERENCES `products` (`pro_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- ============================================
-- 6. 购物车表（依赖 users, products）
-- ============================================
CREATE TABLE IF NOT EXISTS `cart_products` (
    `id` int NOT NULL AUTO_INCREMENT COMMENT '购物车ID',
    `user_id` int NOT NULL COMMENT '用户ID',
    `pro_id` int NOT NULL COMMENT '商品ID',
    `quantity` int DEFAULT '1' COMMENT '数量',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_product` (`user_id`,`pro_id`) COMMENT '用户-商品唯一约束',
    KEY `idx_user_id` (`user_id`),
    KEY `idx_pro_id` (`pro_id`),
    CONSTRAINT `cart_products_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `cart_products_ibfk_2` FOREIGN KEY (`pro_id`) REFERENCES `products` (`pro_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='购物车表';

-- ============================================
-- 7. 已购买商品表（依赖 users, products）
-- ============================================
CREATE TABLE IF NOT EXISTS `buy_products` (
    `id` int NOT NULL AUTO_INCREMENT COMMENT '购买记录ID',
    `user_id` int NOT NULL COMMENT '买家用户ID',
    `pro_id` int NOT NULL COMMENT '商品ID',
    `purchase_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '购买时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_pro_id` (`pro_id`),
    KEY `idx_purchase_time` (`purchase_time`),
    CONSTRAINT `buy_products_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `buy_products_ibfk_2` FOREIGN KEY (`pro_id`) REFERENCES `products` (`pro_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='已购买商品表';


-- ============================================
-- 8. 聊天会话表
-- ============================================
CREATE TABLE IF NOT EXISTS `chat_conversation` (
    `id` int NOT NULL AUTO_INCREMENT COMMENT '会话ID',
    `user_id` int NOT NULL COMMENT '当前用户ID（会话所属者）',
    `partner_id` int NOT NULL COMMENT '对方用户ID',
    `user_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '对方昵称（冗余字段，便于展示）',
    `user_avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '对方头像URL（冗余字段）',
    `last_message` text COLLATE utf8mb4_unicode_ci COMMENT '最后一条消息内容',
    `last_message_time` datetime DEFAULT NULL COMMENT '最后一条消息时间',
    `unread_count` int DEFAULT '0' COMMENT '未读消息数',
    `order_id` int DEFAULT NULL COMMENT '关联订单ID（可选）',
    `product_id` int DEFAULT NULL COMMENT '关联商品ID（可选）',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '会话创建时间',
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '会话更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_partner_order` (`user_id`,`partner_id`,`order_id`) COMMENT '同一用户与同一对方在同一订单下只能有一个会话',
    KEY `idx_user_id` (`user_id`),
    KEY `idx_partner_id` (`partner_id`),
    KEY `idx_order_id` (`order_id`),
    KEY `idx_updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天会话表';

-- ============================================
-- 9. 聊天消息表（依赖 chat_conversation）
-- ============================================
CREATE TABLE IF NOT EXISTS `chat_message` (
    `id` int NOT NULL AUTO_INCREMENT COMMENT '消息ID',
    `conversation_id` int NOT NULL COMMENT '所属会话ID',
    `sender_id` int NOT NULL COMMENT '发送者用户ID',
    `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '消息内容（文本或JSON格式）',
    `type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'text' COMMENT '消息类型：text-文本, image-图片, product-商品卡片',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '消息创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_conversation_id` (`conversation_id`),
    KEY `idx_sender_id` (`sender_id`),
    KEY `idx_created_at` (`created_at`),
    CONSTRAINT `fk_message_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversation` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息表';

-- ============================================
-- 10. 商品评论表
-- ============================================
CREATE TABLE IF NOT EXISTS `comments` (
    `id` int NOT NULL AUTO_INCREMENT,
    `product_id` int NOT NULL,
    `user_id` int NOT NULL,
    `content` varchar(500) NOT NULL,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- 11. 系统消息表
-- ============================================
CREATE TABLE IF NOT EXISTS `system_messages` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int NOT NULL COMMENT '接收用户ID',
    `type` varchar(50) NOT NULL COMMENT '消息类型',
    `title` varchar(200) NOT NULL COMMENT '标题',
    `content` text COMMENT '内容',
    `link` varchar(500) DEFAULT NULL COMMENT '跳转链接',
    `link_text` varchar(100) DEFAULT NULL COMMENT '链接文字',
    `is_read` tinyint DEFAULT '0' COMMENT '是否已读: 0-未读, 1-已读',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_user_read` (`user_id`,`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='系统消息表';

-- ============================================
-- 12. 用户通知设置表
-- ============================================
CREATE TABLE IF NOT EXISTS `user_notification_settings` (
    `user_id` int NOT NULL COMMENT '用户ID',
    `notify_product` tinyint DEFAULT '1' COMMENT '商品通知: 0-关闭, 1-开启',
    `notify_order` tinyint DEFAULT '1' COMMENT '订单通知: 0-关闭, 1-开启',
    `notify_social` tinyint DEFAULT '1' COMMENT '社交通知: 0-关闭, 1-开启',
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户通知设置表';

-- ============================================
-- 13. 用户关注表（依赖 userinfo）
-- ============================================
CREATE TABLE IF NOT EXISTS `user_follows` (
    `id` int NOT NULL AUTO_INCREMENT COMMENT '关注ID',
    `follower_id` int NOT NULL COMMENT '关注者用户ID',
    `followee_id` int NOT NULL COMMENT '被关注者用户ID',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '关注时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_follower_followee` (`follower_id`,`followee_id`) COMMENT '关注关系唯一约束',
    KEY `idx_follower_id` (`follower_id`),
    KEY `idx_followee_id` (`followee_id`),
    CONSTRAINT `user_follows_ibfk_1` FOREIGN KEY (`follower_id`) REFERENCES `userinfo` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `user_follows_ibfk_2` FOREIGN KEY (`followee_id`) REFERENCES `userinfo` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `chk_no_self_follow` CHECK ((`follower_id` <> `followee_id`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户关注表（不能关注自己）';

-- ============================================
-- 14. 论坛帖子表（Forum 模块独立，依赖 users）
-- ============================================
CREATE TABLE IF NOT EXISTS `forum_posts` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '帖子ID',
    `user_id` int NOT NULL COMMENT '发帖用户ID',
    `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '帖子标题',
    `content` text COLLATE utf8mb4_unicode_ci COMMENT '帖子正文内容',
    `post_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'normal' COMMENT '帖子形态类型：normal-普通帖, resource-资源帖, help-求助帖',
    `category` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '内容分类：闲置交流/求购互助/避坑经验/校园拼单/失物招领/交易反馈',
    `images` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '图片URL列表，JSON数组格式',
    `view_count` int DEFAULT '0' COMMENT '浏览量（从Redis同步）',
    `like_count` int DEFAULT '0' COMMENT '点赞数（从Redis同步）',
    `comment_count` int DEFAULT '0' COMMENT '评论数（冗余字段，实时更新）',
    `share_count` int DEFAULT '0' COMMENT '分享数',
    `is_deleted` tinyint(1) DEFAULT '0' COMMENT '是否已删除：0-正常, 1-已删除',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发帖时间',
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_post_type` (`post_type`),
    KEY `idx_category` (`category`),
    KEY `idx_created_at` (`created_at`),
    KEY `idx_like_count` (`like_count`),
    KEY `idx_view_count` (`view_count`),
    CONSTRAINT `forum_posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='论坛帖子表';

-- ============================================
-- 15. 论坛多级评论表（Forum 模块独立，依赖 forum_posts 和 users）
-- ============================================
CREATE TABLE IF NOT EXISTS `forum_comments` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '评论ID',
    `post_id` bigint NOT NULL COMMENT '所属帖子ID',
    `user_id` int NOT NULL COMMENT '评论用户ID',
    `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '评论内容',
    `images` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '评论图片URL列表（仅一级评论支持）',
    `parent_id` bigint DEFAULT NULL COMMENT '父评论ID（NULL表示是顶层评论）',
    `root_id` bigint DEFAULT NULL COMMENT '根评论ID（楼中楼时指向最顶层评论，NULL表示本身是顶层）',
    `reply_to_user_id` int DEFAULT NULL COMMENT '回复目标用户ID（楼中楼时记录@的对象）',
    `like_count` int DEFAULT '0' COMMENT '评论点赞数',
    `is_deleted` tinyint(1) DEFAULT '0' COMMENT '是否已删除：0-正常, 1-已删除',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '评论时间',
    PRIMARY KEY (`id`),
    KEY `idx_post_id` (`post_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_root_id` (`root_id`),
    KEY `idx_created_at` (`created_at`),
    CONSTRAINT `forum_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `forum_posts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `forum_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='论坛评论表（支持多级楼中楼）';

-- ============================================
-- 16. 论坛帖子收藏表（Forum 模块独立，依赖 forum_posts 和 users）
-- ============================================
CREATE TABLE IF NOT EXISTS `forum_favorites` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '收藏ID',
    `user_id` int NOT NULL COMMENT '用户ID',
    `post_id` bigint NOT NULL COMMENT '帖子ID',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_post` (`user_id`, `post_id`) COMMENT '用户-帖子唯一约束',
    KEY `idx_user_id` (`user_id`),
    KEY `idx_post_id` (`post_id`),
    CONSTRAINT `forum_favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `forum_favorites_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `forum_posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='论坛帖子收藏表';

-- ============================================
-- 17. 管理员后台新增字段：商品管理员下架标记
-- ============================================
-- 说明：admin_offline 与 is_seal 语义独立。
--   is_seal 表示交易结果（0=在售,1=已售）；
--   admin_offline 表示治理动作（0=正常,1=被管理员下架）。
-- 注意：MySQL 不支持 ADD COLUMN IF NOT EXISTS，对已存在的旧库需手动执行下面的 ALTER 语句；
--       首次建库时 docker-entrypoint-initdb.d 会自动执行本脚本，无需额外操作。
ALTER TABLE `products` ADD COLUMN `admin_offline` TINYINT(1) DEFAULT '0' COMMENT '管理员下架：0-正常,1-已下架';
ALTER TABLE `products` ADD KEY `idx_admin_offline` (`admin_offline`);

-- 论坛帖子新增"内容分类"列（与 post_type 形态分类独立，旧库需手动执行）
ALTER TABLE `forum_posts` ADD COLUMN `category` VARCHAR(40) DEFAULT NULL COMMENT '内容分类：闲置交流/求购互助/避坑经验/校园拼单/失物招领/交易反馈';
ALTER TABLE `forum_posts` ADD KEY `idx_category` (`category`);
