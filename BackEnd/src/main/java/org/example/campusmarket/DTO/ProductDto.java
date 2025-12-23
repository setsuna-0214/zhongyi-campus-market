package org.example.campusmarket.DTO;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

// 商品模块的数据传输对象

public class ProductDto {

    // 商品详情数据结构
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductDetail {
        // 商品唯一标识符 (ID)
        private Integer id;
        
        // 商品标题 (Title)
        private String title;
        
        // 商品当前售价 (Current Price)
        private Double price;
        
        // 商品原始价格 (Original Price)，用于展示折扣或对比
        private Double originalPrice;
        
        // 商品图片列表 (List of Image URLs)，支持多图展示
        private List<String> images;
        
        // 商品分类 (Category)，如 electronics(电子), books(书籍) 等
        private String category;
        
        // 商品成色 (Condition)，如 like-new(九九新), used(二手) 等
        private String condition;
        

        private String location;
        
        // 卖家信息对象 (Seller Info)
        private SellerInfo seller;
        
        // 商品浏览量 (Views)，表示热度
        private Integer views;
        
        // 商品点赞/收藏数 (Likes)
        private Integer likes;
        
        // 发布时间
        private String publishTime;
        
        // 商品状态 (Status)，如 "在售", "已下架"
        private String status;
        
        // 商品详细描述 (Description)
        private String description;
        
        // --- 以下为数据库映射使用的临时字段，不会返回给前端 ---
        
        // 临时存储数据库查出的单张图片路径 (Temporary Image Path)
        // 因为数据库可能只存了一张图，或者是以逗号分隔的字符串，需要在 Service 层处理成 List
        @JsonIgnore
        private String tempImage;
        
        // 临时存储卖家的 ID (Temporary Seller ID)
        @JsonIgnore private Integer tempSellerId;
        
        // 临时存储卖家的昵称 (Temporary Seller Name)
        @JsonIgnore private String tempSellerName;
        
        // 临时存储卖家的用户名 (Temporary Seller Username)
        @JsonIgnore private String tempSellerUsername;
        
        // 临时存储卖家的头像 (Temporary Seller Avatar)
        @JsonIgnore private String tempSellerAvatar;
        
        // 临时存储卖家的评分 (Temporary Seller Rating)
        // 这里暂时硬编码或从数据库计算
        @JsonIgnore private Double tempSellerRating;
    }

    // 卖家信息数据结构
    // 用于在商品详情中嵌套展示卖家概况
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SellerInfo {
        // 卖家用户 ID (Seller ID)
        private Integer id;
        
        // 卖家昵称 (Seller Nickname)
        private String nickname;
        
        // 卖家用户名 (Seller Username)
        private String username;
        
        // 卖家头像 URL (Seller Avatar)
        private String avatar;
        
        // 卖家信用评分 (Seller Rating)
        private Double rating;
    }
    
    // 商品列表响应结构
    // 用于分页返回商品数据
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductListResponse {
        // 当前页的商品列表 (List of Products)
        private List<ProductDetail> items;
        
        // 符合条件的总记录数 (Total Count)，用于前端计算总页数
        private Long total;
    }

    // 商品状态更新请求
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        // 商品状态，如 "在售", "已下架", "已售出"
        private String status;
    }
}
