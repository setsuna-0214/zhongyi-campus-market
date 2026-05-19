package org.example.campusmarket.modules.forum.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 论坛评论 DTO 集合
 */
public class ForumCommentDto {

    /**
     * 楼中楼回复 DTO（嵌套在顶层评论内）
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReplyItem {
        private Long id;
        private Long postId;
        private Integer userId;
        private String userNickname;
        private String userAvatar;
        private String content;
        private Long parentId;
        private Long rootId;
        private Integer replyToUserId;
        private String replyToUserNickname;
        private Integer likeCount;
        private Boolean liked;
        private LocalDateTime createdAt;
    }

    /**
     * 顶层评论 DTO（包含嵌套的楼中楼列表）
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommentItem {
        private Long id;
        private Long postId;
        private Integer userId;
        private String userNickname;
        private String userAvatar;
        private String content;
        /** 评论图片列表（顶层评论支持图片） */
        private List<String> images;
        private Integer likeCount;
        private Boolean liked;
        private LocalDateTime createdAt;
        /** 楼中楼回复列表 */
        private List<ReplyItem> replies;
    }

    /**
     * 发表顶层评论请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateCommentRequest {
        private Long postId;
        private String content;
        /** 图片URL列表（顶层评论支持图片） */
        private List<String> images;
    }

    /**
     * 发表楼中楼回复请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateReplyRequest {
        private Long postId;
        private Long parentId;
        private Long rootId;
        /** 被回复的用户ID */
        private Integer replyToUserId;
        private String content;
        /** 楼中楼不支持图片，此字段保留但忽略 */
    }

    /**
     * 评论分页查询结果
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommentPageResult {
        private List<CommentItem> comments;
        private long total;
        private int page;
        private int pageSize;
    }
}
