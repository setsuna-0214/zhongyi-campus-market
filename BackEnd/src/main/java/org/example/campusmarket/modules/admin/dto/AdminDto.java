package org.example.campusmarket.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 管理员后台 DTO 集合
 * 集中放置统计、系统状态、各业务分页列表等返回结构，沿用项目 Result 包装。
 */
public class AdminDto {

    /** 管理员首页统计数据 */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Statistics {
        private long userCount;          // 用户总数
        private long productCount;       // 商品总数
        private long orderCount;         // 订单总数
        private long forumPostCount;     // 论坛帖子数
        private long wantCount;          // 求购信息数（阶段四接入前固定为 0）
        private long pendingReportCount; // 待处理举报数（举报模块未实现，固定为 0）
        private long todayNewProducts;   // 今日新增商品数
        private long todayNewPosts;      // 今日新增帖子数
    }

    /** 系统状态面板数据 */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemStatus {
        private String backend;       // 后端状态：正常 / 异常
        private String database;      // 数据库状态
        private String redis;          // Redis 状态
        private String profile;        // 当前运行环境
        private String serverTime;     // 服务器时间
        private long userCount;
        private long productCount;
        private long orderCount;
        private long forumPostCount;
        private long wantCount;
    }

    /** 用户管理列表项 */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminUserItem {
        private Integer id;
        private String username;
        private String email;
        private String role;
        private Integer status;        // 0-禁用, 1-正常
        private LocalDateTime createdAt;
        private LocalDateTime lastLoginAt;
    }

    /** 用户启用/禁用请求 */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserStatusRequest {
        /** 1-启用, 0-禁用 */
        private Integer status;
    }

    /** 商品管理列表项 */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminProductItem {
        private Integer id;
        private String title;
        private String price;
        private String category;
        private String sellerName;
        private Integer sellerId;
        private String status;         // 在售 / 已售
        private boolean adminOffline;  // 是否被管理员下架
        private String picture;
        private LocalDateTime createdAt;
    }

    /** 订单管理列表项 */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminOrderItem {
        private Integer id;
        private Integer buyerId;
        private String buyerName;
        private Integer sellerId;
        private String sellerName;
        private Integer productId;
        private String productTitle;
        private String totalPrice;
        private String status;
        private LocalDateTime createdAt;
    }

    /** 论坛帖子管理列表项（含已隐藏） */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminForumPostItem {
        private Long id;
        private String title;
        private String postType;
        private String category;       // 内容分类：闲置交流/求购互助/避坑经验/校园拼单/失物招领/交易反馈
        private Integer userId;
        private String userNickname;
        private Integer viewCount;
        private Integer likeCount;
        private Integer commentCount;
        private boolean hidden;        // 是否被管理员隐藏
        private LocalDateTime createdAt;
    }

    /** 管理员求购列表项 */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminWantItem {
        private Long id;
        private Integer userId;
        private String username;
        private String title;
        private String category;
        private String status;
        private String urgency;
        private String keywords;
        private LocalDateTime createdAt;
    }

    /** 通用分页结果包装 */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PageResult<T> {
        private List<T> items;
        private long total;
        private int page;
        private int pageSize;
    }
}