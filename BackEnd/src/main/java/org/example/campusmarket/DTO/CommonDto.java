package org.example.campusmarket.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 通用 DTO：跨模块共享的数据结构
 */
public class CommonDto {

    // 通用成功响应（用于简单的操作结果）
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuccessResponse {
        private boolean success;
    }

    // 带消息的响应（用于需要返回提示信息的场景）
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageResponse {
        private boolean success;
        private String message;
    }

    // 商品摘要（收藏、订单等模块共用）
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
}
