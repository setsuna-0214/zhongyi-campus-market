package org.example.campusmarket.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class HomeDto {
    // 首页展示用的商品数据结构，供 /home/hot 与 /home/latest 返回
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HomeProduct {
        // 商品唯一标识 id
        private Integer id;
        // 商品标题/名称
        private String title;
        // 商品展示图片 URL（首张图片，用于兼容）
        private String image;
        // 商品图片列表（支持多图轮播）
        private List<String> images;
        // 商品价格（整数，单位元）
        private Integer price;
        // 仅用于"热门"接口的可选发布日期字符串（YYYY-MM-DD），为空表示未提供
        private String publishedAt;
        // 仅用于"最新"接口的可选发布时间（ISO 字符串），为空表示未提供
        private String publishTime;
        // 卖家ID
        private Integer sellerId;
        // 卖家昵称/名称
        private String seller;
        // 学校或地点信息
        private String location;
        // 类目（当前后端未维护，可能为 null）
        private String category;
        // 状态（在售/已售）
        private String status;
        // 简单的曝光/热度指标（收藏数+购买数）
        private Integer views;
    }
}
