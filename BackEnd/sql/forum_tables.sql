CREATE TABLE IF NOT EXISTS `forum_posts` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '帖子ID',
    `user_id` int NOT NULL COMMENT '发帖用户ID',
    `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '帖子标题',
    `content` text COLLATE utf8mb4_unicode_ci COMMENT '帖子正文内容',
    `post_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'normal' COMMENT '帖子形态类型：normal/resource/help',
    `category` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '内容分类：闲置交流/求购互助/避坑经验/校园拼单/失物招领/交易反馈',
    `images` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '图片URL列表，JSON数组格式',
    `view_count` int DEFAULT 0 COMMENT '浏览量',
    `like_count` int DEFAULT 0 COMMENT '点赞数',
    `comment_count` int DEFAULT 0 COMMENT '评论数',
    `share_count` int DEFAULT 0 COMMENT '分享数',
    `is_deleted` tinyint(1) DEFAULT 0 COMMENT '是否已删除',
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

CREATE TABLE IF NOT EXISTS `forum_comments` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '评论ID',
    `post_id` bigint NOT NULL COMMENT '所属帖子ID',
    `user_id` int NOT NULL COMMENT '评论用户ID',
    `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '评论内容',
    `images` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '评论图片',
    `parent_id` bigint DEFAULT NULL COMMENT '父评论ID',
    `root_id` bigint DEFAULT NULL COMMENT '根评论ID',
    `reply_to_user_id` int DEFAULT NULL COMMENT '回复目标用户ID',
    `like_count` int DEFAULT 0 COMMENT '点赞数',
    `is_deleted` tinyint(1) DEFAULT 0 COMMENT '是否已删除',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '评论时间',
    PRIMARY KEY (`id`),
    KEY `idx_post_id` (`post_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_root_id` (`root_id`),
    KEY `idx_created_at` (`created_at`),
    CONSTRAINT `forum_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `forum_posts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `forum_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='论坛评论表';

CREATE TABLE IF NOT EXISTS `forum_favorites` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '收藏ID',
    `user_id` int NOT NULL COMMENT '用户ID',
    `post_id` bigint NOT NULL COMMENT '帖子ID',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_post` (`user_id`, `post_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_post_id` (`post_id`),
    CONSTRAINT `forum_favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `forum_favorites_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `forum_posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='论坛帖子收藏表';
