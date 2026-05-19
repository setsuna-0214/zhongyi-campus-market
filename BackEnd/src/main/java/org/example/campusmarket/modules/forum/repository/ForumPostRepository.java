package org.example.campusmarket.modules.forum.repository;

import org.example.campusmarket.modules.forum.entity.ForumPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * ForumPost JPA Repository
 * 提供基础 CRUD，复杂分页查询由 ForumPostMapper (MyBatis) 承担
 */
@Repository
public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {

    /** 统计用户的有效帖子数 */
    long countByUserIdAndIsDeleted(Integer userId, Boolean isDeleted);

    /** 软删除：仅将 is_deleted 置为 true */
    @Modifying
    @Query("UPDATE ForumPost p SET p.isDeleted = true WHERE p.id = :id AND p.userId = :userId")
    int softDeleteByIdAndUserId(@Param("id") Long id, @Param("userId") Integer userId);

    /** 管理员删除 */
    @Modifying
    @Query("UPDATE ForumPost p SET p.isDeleted = true WHERE p.id = :id")
    int softDeleteById(@Param("id") Long id);

    /** 批量同步浏览量 */
    @Modifying
    @Query("UPDATE ForumPost p SET p.viewCount = :viewCount WHERE p.id = :id")
    int updateViewCount(@Param("id") Long id, @Param("viewCount") Integer viewCount);

    /** 批量同步点赞数 */
    @Modifying
    @Query("UPDATE ForumPost p SET p.likeCount = :likeCount WHERE p.id = :id")
    int updateLikeCount(@Param("id") Long id, @Param("likeCount") Integer likeCount);

    /** 增加评论数 */
    @Modifying
    @Query("UPDATE ForumPost p SET p.commentCount = p.commentCount + 1 WHERE p.id = :id")
    int incrementCommentCount(@Param("id") Long id);

    /** 减少评论数 */
    @Modifying
    @Query("UPDATE ForumPost p SET p.commentCount = GREATEST(p.commentCount - 1, 0) WHERE p.id = :id")
    int decrementCommentCount(@Param("id") Long id);
}
