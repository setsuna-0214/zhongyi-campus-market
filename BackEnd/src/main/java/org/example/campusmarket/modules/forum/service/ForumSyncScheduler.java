package org.example.campusmarket.modules.forum.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.campusmarket.modules.forum.repository.ForumPostRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/**
 * 论坛数据定时同步任务
 * 定期将 Redis 中的浏览量和点赞数刷盘到 MySQL
 * 频率：每 5 分钟执行一次
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ForumSyncScheduler {

    private static final String POST_VIEWS_PATTERN = "forum:post:*:views";
    private static final String POST_LIKES_PATTERN = "forum:post:*:likes";

    private final StringRedisTemplate redisTemplate;
    private final ForumPostRepository postRepository;

    /**
     * 每 5 分钟将 Redis 帖子浏览量同步到 MySQL
     */
    @Scheduled(fixedDelay = 5 * 60 * 1000)
    @Transactional
    public void syncViewCounts() {
        Set<String> viewKeys = redisTemplate.keys(POST_VIEWS_PATTERN);
        if (viewKeys == null || viewKeys.isEmpty()) return;

        int synced = 0;
        for (String key : viewKeys) {
            try {
                // 从 key 中提取 postId：forum:post:{postId}:views
                Long postId = extractPostId(key, "views");
                if (postId == null) continue;

                String val = redisTemplate.opsForValue().get(key);
                if (val == null) continue;

                int viewCount = Integer.parseInt(val);
                postRepository.updateViewCount(postId, viewCount);
                synced++;
            } catch (Exception e) {
                log.warn("[ForumSync] 浏览量同步异常, key={}", key, e);
            }
        }
        if (synced > 0) {
            log.info("[ForumSync] 浏览量同步完成，共同步 {} 条", synced);
        }
    }

    /**
     * 每 5 分钟将 Redis 帖子点赞数同步到 MySQL
     */
    @Scheduled(fixedDelay = 5 * 60 * 1000, initialDelay = 30 * 1000)
    @Transactional
    public void syncLikeCounts() {
        Set<String> likeKeys = redisTemplate.keys(POST_LIKES_PATTERN);
        if (likeKeys == null || likeKeys.isEmpty()) return;

        int synced = 0;
        for (String key : likeKeys) {
            try {
                Long postId = extractPostId(key, "likes");
                if (postId == null) continue;

                Long size = redisTemplate.opsForSet().size(key);
                if (size == null) continue;

                postRepository.updateLikeCount(postId, size.intValue());
                synced++;
            } catch (Exception e) {
                log.warn("[ForumSync] 点赞数同步异常, key={}", key, e);
            }
        }
        if (synced > 0) {
            log.info("[ForumSync] 点赞数同步完成，共同步 {} 条", synced);
        }
    }

    /**
     * 从 Redis key 中提取帖子 ID
     * 格式：forum:post:{postId}:{suffix}
     */
    private Long extractPostId(String key, String suffix) {
        try {
            // forum:post:123:views → ["forum", "post", "123", "views"]
            String[] parts = key.split(":");
            if (parts.length < 4) return null;
            return Long.parseLong(parts[2]);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
