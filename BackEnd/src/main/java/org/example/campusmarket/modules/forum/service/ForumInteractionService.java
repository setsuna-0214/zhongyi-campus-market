package org.example.campusmarket.modules.forum.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * 论坛互动 Service（点赞 & 浏览量）
 * 全部走 Redis，禁止高频直写 MySQL
 *
 * Redis Key 设计：
 *   - 帖子点赞 Set：  forum:post:{postId}:likes   (存储 userId)
 *   - 帖子浏览量 String：forum:post:{postId}:views  (INCR)
 *   - 评论点赞 Set：  forum:comment:{commentId}:likes
 */
@Service
@RequiredArgsConstructor
public class ForumInteractionService {

    private static final String POST_LIKES_KEY    = "forum:post:%d:likes";
    private static final String POST_VIEWS_KEY    = "forum:post:%d:views";
    private static final String POST_VIEWERS_KEY  = "forum:post:%d:viewers"; // 访问过的用户集合，用于去重
    private static final String COMMENT_LIKES_KEY = "forum:comment:%d:likes";

    private final StringRedisTemplate redisTemplate;

    // ----------------------------------------------------------------
    // 帖子点赞
    // ----------------------------------------------------------------

    /**
     * 切换帖子点赞状态（已赞则取消，未赞则点赞）
     *
     * @return true - 点赞成功；false - 取消点赞成功
     */
    public boolean togglePostLike(Long postId, Integer userId) {
        String key = String.format(POST_LIKES_KEY, postId);
        String member = userId.toString();
        Boolean isMember = redisTemplate.opsForSet().isMember(key, member);
        if (Boolean.TRUE.equals(isMember)) {
            redisTemplate.opsForSet().remove(key, member);
            return false;
        } else {
            redisTemplate.opsForSet().add(key, member);
            return true;
        }
    }

    /**
     * 查询当前用户是否已点赞帖子
     */
    public boolean isPostLiked(Long postId, Integer userId) {
        String key = String.format(POST_LIKES_KEY, postId);
        return Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(key, userId.toString()));
    }

    /**
     * 获取帖子点赞数（从 Redis Set 计数）
     */
    public long getPostLikeCount(Long postId) {
        String key = String.format(POST_LIKES_KEY, postId);
        Long size = redisTemplate.opsForSet().size(key);
        return size != null ? size : 0L;
    }

    // ----------------------------------------------------------------
    // 帖子浏览量
    // ----------------------------------------------------------------

    /**
     * 记录浏览，每个访客（userId 或 IP）仅计一次
     *
     * @param postId    帖子ID
     * @param visitorId 已登录用户传 "u:{userId}";未登录传 "ip:{ip}"
     * @return 最新浏览量（无论是否首次访问）
     */
    public long incrementPostView(Long postId, String visitorId) {
        String viewersKey = String.format(POST_VIEWERS_KEY, postId);
        String viewsKey   = String.format(POST_VIEWS_KEY, postId);

        // SADD 返回 1 表示首次加入（未访问过）
        Long added = redisTemplate.opsForSet().add(viewersKey, visitorId);
        if (Long.valueOf(1L).equals(added)) {
            Long count = redisTemplate.opsForValue().increment(viewsKey);
            return count != null ? count : 0L;
        }
        // 已经访问过，直接返回当前值
        String val = redisTemplate.opsForValue().get(viewsKey);
        return val != null ? Long.parseLong(val) : 0L;
    }

    /**
     * 获取帖子浏览量
     */
    public long getPostViewCount(Long postId) {
        String key = String.format(POST_VIEWS_KEY, postId);
        String val = redisTemplate.opsForValue().get(key);
        return val != null ? Long.parseLong(val) : 0L;
    }

    /**
     * 初始化帖子浏览量（首次访问时从 DB 加载到 Redis）
     */
    public void initPostViewCount(Long postId, int dbCount) {
        String key = String.format(POST_VIEWS_KEY, postId);
        // 只在 Redis 中不存在时才初始化，避免覆盖累积值
        redisTemplate.opsForValue().setIfAbsent(key, String.valueOf(dbCount));
    }

    // ----------------------------------------------------------------
    // 评论点赞
    // ----------------------------------------------------------------

    /**
     * 切换评论点赞状态
     */
    public boolean toggleCommentLike(Long commentId, Integer userId) {
        String key = String.format(COMMENT_LIKES_KEY, commentId);
        String member = userId.toString();
        Boolean isMember = redisTemplate.opsForSet().isMember(key, member);
        if (Boolean.TRUE.equals(isMember)) {
            redisTemplate.opsForSet().remove(key, member);
            return false;
        } else {
            redisTemplate.opsForSet().add(key, member);
            return true;
        }
    }

    /**
     * 查询当前用户是否已点赞评论
     */
    public boolean isCommentLiked(Long commentId, Integer userId) {
        String key = String.format(COMMENT_LIKES_KEY, commentId);
        return Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(key, userId.toString()));
    }

    /**
     * 获取评论点赞数
     */
    public long getCommentLikeCount(Long commentId) {
        String key = String.format(COMMENT_LIKES_KEY, commentId);
        Long size = redisTemplate.opsForSet().size(key);
        return size != null ? size : 0L;
    }
}
