package org.example.campusmarket.modules.forum.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * 论坛帖子收藏实体
 * 对应数据库 forum_favorites 表
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "forum_favorites",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "post_id"})
)
public class ForumFavorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 用户ID */
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    /** 帖子ID */
    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
