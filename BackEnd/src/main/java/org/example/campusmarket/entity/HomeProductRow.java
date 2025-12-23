package org.example.campusmarket.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HomeProductRow {
    // 商品 id（来自 products.pro_id）
    private Integer id;
    // 商品标题（来自 products.pro_name）
    private String title;
    // 图片地址（来自 products.picture）
    private String image;
    // 原始价格字符串（数据库存的是字符串，需要转换）
    private String price;
    // 卖家ID（来自 userinfo.user_id）
    private Integer sellerId;
    // 卖家昵称（来自 userinfo.nickname）
    private String seller;
    // 卖家用户名（来自 userinfo.username）
    private String sellerUsername;
    // 卖家地址/学校（来自 userinfo.address）
    private String location;
    // 类目（当前为占位，查询中返回 NULL）
    private String category;
    // 商品售卖状态（在售/已售），由 is_seal 推导
    private String status;
    // 估算的热度（收藏数 + 购买数）
    private Integer views;
}