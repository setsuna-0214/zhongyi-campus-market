package org.example.campusmarket.modules.want.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 求购模块 DTO 集合
 */
public class WantDto {

    /** 发布/编辑求购请求 */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaveWantRequest {
        private String title;
        private String description;
        private String category;
        private BigDecimal minPrice;
        private BigDecimal maxPrice;
        /** 多个关键词用逗号分隔，示例：耳机,蓝牙,降噪 */
        private String keywords;
        private String expectedCondition;
        private String urgency;
    }

    /** 求购大厅/详情基础数据 */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WantItem {
        private Long id;
        private Integer userId;
        private String username;
        private String title;
        private String description;
        private String category;
        private BigDecimal minPrice;
        private BigDecimal maxPrice;
        private String keywords;
        private String expectedCondition;
        private String urgency;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    /** 匹配商品卡片 */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchItem {
        private Integer productId;
        private String title;
        private String picture;
        private String category;
        private BigDecimal price;
        private Integer sellerId;
        private String sellerName;
        private Integer matchScore;
        private List<String> matchReasons;
    }

    /** 分页结果 */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WantPageResult {
        private List<WantItem> items;
        private long total;
        private int page;
        private int pageSize;
    }
}