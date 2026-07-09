package org.example.campusmarket.modules.forum.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * 论坛收藏 DTO
 */
public class ForumFavoriteDto {

    /**
     * 收藏状态响应
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FavoriteStatus {
        private boolean favorited;
        private long totalCount;
    }

    /**
     * 收藏的帖子列表项
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FavoritePostItem {
        private Long favoriteId;
        private Long postId;
        private String title;
        private String postType;
        private String coverImage;
        private Integer commentCount;
        private Integer likeCount;
        /** 发帖用户昵称 */
        private String authorNickname;
        /** 发帖用户头像 */
        private String authorAvatar;
        private LocalDateTime postCreatedAt;
        private LocalDateTime favoritedAt;
    }
}
