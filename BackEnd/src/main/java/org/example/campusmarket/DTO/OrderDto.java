package org.example.campusmarket.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

//订单相关 DTO 汇总：统一收敛到一个文件中，包含创建请求、响应、统计与评价请求等。

public class OrderDto {
    // 创建订单请求体
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private Integer productId;
        private Integer quantity;
    }

    // 订单响应中的商品摘要
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductSummary {
        private Integer id;
        private String title;
        private Integer price;
        private String image;
        private String category;
        private String location;
    }

    // 用户摘要（买家/卖家信息）
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Integer id;
        private String nickname;
        private String username;
    }

    // 订单响应
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Integer id;
        private Integer productId;
        private ProductSummary product;
        private Integer quantity;
        private Integer totalPrice;
        private String status;
        private LocalDateTime orderTime;
        private LocalDateTime createdAt;
        private UserSummary buyer;
        private UserSummary seller;
    }

    // 订单统计响应
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Stats {
        private Integer total;
        private Integer pending;
        private Integer completed;
        private Integer cancelled;
    }

    // 提交订单评价请求体
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewRequest {
        private Integer rating; // 1-5
        private String comment;
    }

    // 通用成功响应
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuccessResponse {
        private boolean success;
    }

    // 订单详情响应（包含卖家留言和图片）
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailResponse {
        private Integer id;
        private String status;
        private java.time.LocalDateTime orderTime;
        private ProductSummary product;
        private UserSummary buyer;   // { id, nickname }
        private UserSummary seller;  // { id, nickname }
        private String sellerMessage;
        private java.util.List<String> sellerImages;
    }

    // 订单状态更新请求
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        private String status;
        private String sellerMessage;
        private java.util.List<String> sellerImages;
    }
}