package org.example.campusmarket.modules.forum.repository;

import org.example.campusmarket.modules.forum.entity.ForumComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ForumComment JPA Repository
 * 基础 CRUD，复杂树状查询由 ForumCommentMapper (MyBatis) 承担
 */
@Repository
public interface ForumCommentRepository extends JpaRepository<ForumComment, Long> {

    /** 获取帖子下所有顶层评论（分页由 Mapper 完成） */
    List<ForumComment> findByPostIdAndParentIdIsNullAndIsDeletedFalseOrderByCreatedAtAsc(Long postId);

    /** 获取某顶层评论下所有楼中楼回复 */
    List<ForumComment> findByRootIdAndParentIdIsNotNullAndIsDeletedFalseOrderByCreatedAtAsc(Long rootId);

    /** 软删除评论 */
    @Modifying
    @Query("UPDATE ForumComment c SET c.isDeleted = true WHERE c.id = :id AND c.userId = :userId")
    int softDeleteByIdAndUserId(@Param("id") Long id, @Param("userId") Integer userId);
}
