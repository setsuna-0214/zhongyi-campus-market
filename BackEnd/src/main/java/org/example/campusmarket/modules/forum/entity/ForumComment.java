package org.example.campusmarket.modules.forum.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * 论坛评论实体
 * 对应数据库 forum_comments 表，支持多级楼中楼结构
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "forum_comments")
public class ForumComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 所属帖子ID */
    @Column(name = "post_id", nullable = false)
    private Long postId;

    /** 评论用户ID */
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    /** 评论内容 */
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    /** 评论图片（仅一级评论支持，JSON数组字符串） */
    @Column(name = "images", length = 1000)
    private String images;

    /**
     * 父评论ID：
     * - NULL 表示本评论是顶层评论（楼）
     * - 非NULL 表示回复某条评论（楼中楼）
     */
    @Column(name = "parent_id")
    private Long parentId;

    /**
     * 根评论ID：
     * - NULL 表示本评论本身是顶层
     * - 非NULL 指向所属的那层一级评论
     */
    @Column(name = "root_id")
    private Long rootId;

    /** 楼中楼时被回复的用户ID */
    @Column(name = "reply_to_user_id")
    private Integer replyToUserId;

    /** 点赞数 */
    @Column(name = "like_count")
    private Integer likeCount = 0;

    /** 是否已删除 */
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
