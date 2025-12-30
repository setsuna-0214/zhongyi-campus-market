package org.example.campusmarket.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class AiDto {

    /**
     * 生成商品描述请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GenerateDescriptionRequest {
        private String title;
        private String category;
        private List<ImageData> images;
    }

    /**
     * 图片数据
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageData {
        private String type; // "url" 或 "base64"
        private String data;
    }

    /**
     * 生成商品描述响应
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GenerateDescriptionResponse {
        private String description;
    }
}
