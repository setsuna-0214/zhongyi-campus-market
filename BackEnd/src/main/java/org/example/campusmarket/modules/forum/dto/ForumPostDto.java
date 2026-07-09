package org.example.campusmarket.modules.forum.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 论坛帖子 DTO 集合
 */
public class ForumPostDto {

    /**
     * 帖子列表项 DTO（用于帖子流展示）
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PostListItem {
        private Long id;
        private Integer userId;
        private String userNickname;
        private String userAvatar;
        private String title;
        /** 内容摘要（超长截断，前端做省略） */
        private String summary;
        private String postType;
        /** 内容分类（闲置交流/求购互助/避坑经验/校园拼单/失物招领/交易反馈），与 postType 独立 */
        private String category;
        /** 第一张图片作为缩略图 */
        private String coverImage;
        /** 所有图片列表 */
        private List<String> images;
        private Integer viewCount;
        private Integer likeCount;
        private Integer commentCount;
        private Integer shareCount;
        /** 当前用户是否点赞（需要登录状态注入） */
        private Boolean liked;
        /** 当前用户是否收藏 */
        private Boolean favorited;
        private LocalDateTime createdAt;
    }

    /**
     * 帖子详情 DTO（用于详情页完整展示）
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PostDetail {
        private Long id;
        private Integer userId;
        private String userNickname;
        private String userAvatar;
        private String title;
        private String content;
        private String postType;
        /** 内容分类（与 postType 独立） */
        private String category;
        private List<String> images;
        private Integer viewCount;
        private Integer likeCount;
        private Integer commentCount;
        private Integer shareCount;
        private Boolean liked;
        private Boolean favorited;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    /**
     * 创建帖子请求 DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreatePostRequest {
        private String title;
        private String content;
        /** normal | resource | help */
        private String postType;
        /** 内容分类：闲置交流/求购互助/避坑经验/校园拼单/失物招领/交易反馈，可为空 */
        private String category;
        /** 已上传图片 URL 列表（前端先上传图片，再提交帖子） */
        private List<String> images;
    }

    /**
     * 更新帖子请求 DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdatePostRequest {
        private String title;
        private String content;
        private String postType;
        /** 内容分类，可为空（null 表示不修改） */
        private String category;
        private List<String> images;
    }

    /**
     * 帖子分页查询结果包装
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PostPageResult {
        private List<PostListItem> posts;
        private long total;
        private int page;
        private int pageSize;
    }
}
