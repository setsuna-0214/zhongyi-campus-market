package org.example.campusmarket.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

//收藏相关 DTO 汇总：统一管理添加收藏请求和响应。


public class FavoriteDto {
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddRequest {
        private Integer productId;
    }

    // 收藏列表中的商品摘要
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductSummary {
        private Integer id;
        private String title;
        private Integer price;
        private String image;
        private String status;
    }

    // 收藏列表响应项
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FavoriteItem {
        private Integer id;
        private Integer productId;
        private ProductSummary product;
        private LocalDateTime createdAt;
    }

    // 添加收藏的响应
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddResponse {
        private Integer id;
        private Integer productId;
        private LocalDateTime createdAt;
    }

    // 删除收藏的响应
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeleteResponse {
        private boolean success;
    }
}