package org.example.campusmarket.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;


//购物车相关 DTO 汇总：统一将添加与批量添加请求集中管理。

public class CartDto {
    // 单条加入购物车请求
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddRequest {
        private Integer productId;
        private Integer quantity;
    }

    // 购物车条目
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private Integer productId;
        private Integer quantity;
    }

    // 批量加入购物车请求
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchAddRequest {
        private List<Item> items;
    }
}