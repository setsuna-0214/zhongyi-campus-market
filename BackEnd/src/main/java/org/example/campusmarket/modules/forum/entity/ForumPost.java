package org.example.campusmarket.modules.forum.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * 论坛帖子实体
 * 对应数据库 forum_posts 表
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "forum_posts")
public class ForumPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 发帖用户ID，只存储 ID，不级联操作用户表 */
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    /** 帖子标题 */
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /** 帖子正文内容 */
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    /**
     * 帖子类型：normal-普通帖, resource-资源帖, help-求助帖
     */
    @Column(name = "post_type", length = 20)
    private String postType = "normal";

    /** 图片URL列表，JSON 数组字符串存储 */
    @Column(name = "images", length = 2000)
    private String images;

    /** 浏览量（由 Redis 定期同步） */
    @Column(name = "view_count")
    private Integer viewCount = 0;

    /** 点赞数（由 Redis 定期同步） */
    @Column(name = "like_count")
    private Integer likeCount = 0;

    /** 评论数（冗余字段，写评论时实时更新） */
    @Column(name = "comment_count")
    private Integer commentCount = 0;

    /** 分享数 */
    @Column(name = "share_count")
    private Integer shareCount = 0;

    /** 是否已删除：0-正常, 1-已删除 */
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
