package org.example.campusmarket.modules.forum.service;

import lombok.RequiredArgsConstructor;
import org.example.campusmarket.modules.forum.dto.ForumFavoriteDto;
import org.example.campusmarket.modules.forum.entity.ForumFavorite;
import org.example.campusmarket.modules.forum.mapper.ForumPostMapper;
import org.example.campusmarket.modules.forum.repository.ForumFavoriteRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 论坛帖子收藏 Service
 */
@Service
@RequiredArgsConstructor
public class ForumFavoriteService {

    private final ForumFavoriteRepository favoriteRepository;
    private final ForumPostMapper postMapper;

    /**
     * 收藏帖子（幂等：已收藏则跳过）
     */
    @Transactional
    public ForumFavoriteDto.FavoriteStatus addFavorite(Integer userId, Long postId) {
        Optional<ForumFavorite> existing = favoriteRepository.findByUserIdAndPostId(userId, postId);
        if (existing.isEmpty()) {
            try {
                ForumFavorite fav = new ForumFavorite();
                fav.setUserId(userId);
                fav.setPostId(postId);
                favoriteRepository.save(fav);
            } catch (DataIntegrityViolationException ignored) {
                // 并发插入时唯一约束冲突，忽略
            }
        }
        long total = favoriteRepository.countByPostId(postId);
        return new ForumFavoriteDto.FavoriteStatus(true, total);
    }

    /**
     * 取消收藏
     */
    @Transactional
    public ForumFavoriteDto.FavoriteStatus removeFavorite(Integer userId, Long postId) {
        favoriteRepository.deleteByUserIdAndPostId(userId, postId);
        long total = favoriteRepository.countByPostId(postId);
        return new ForumFavoriteDto.FavoriteStatus(false, total);
    }

    /**
     * 查询收藏状态
     */
    public ForumFavoriteDto.FavoriteStatus getFavoriteStatus(Integer userId, Long postId) {
        boolean favorited = favoriteRepository.findByUserIdAndPostId(userId, postId).isPresent();
        long total = favoriteRepository.countByPostId(postId);
        return new ForumFavoriteDto.FavoriteStatus(favorited, total);
    }

    /**
     * 获取用户收藏的帖子列表
     */
    public List<ForumFavoriteDto.FavoritePostItem> getFavoritesByUserId(Integer userId) {
        return postMapper.getFavoritePostsByUserId(userId);
    }
}
