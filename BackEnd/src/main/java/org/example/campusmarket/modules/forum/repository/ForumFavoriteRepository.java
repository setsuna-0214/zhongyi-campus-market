package org.example.campusmarket.modules.forum.repository;

import org.example.campusmarket.modules.forum.entity.ForumFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ForumFavorite JPA Repository
 */
@Repository
public interface ForumFavoriteRepository extends JpaRepository<ForumFavorite, Long> {

    /** 查询用户是否已收藏某帖子 */
    Optional<ForumFavorite> findByUserIdAndPostId(Integer userId, Long postId);

    /** 查询用户收藏列表（按收藏时间倒序） */
    List<ForumFavorite> findByUserIdOrderByCreatedAtDesc(Integer userId);

    /** 统计帖子收藏数 */
    long countByPostId(Long postId);

    /** 删除收藏 */
    void deleteByUserIdAndPostId(Integer userId, Long postId);
}
