package org.example.campusmarket.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Order {
    private Integer id;
    private Integer userId;      // 买家ID
    private Integer sellerId;    // 卖家ID
    private Integer productId;
    private Integer quantity;
    private BigDecimal totalPrice;
    private String status; // pending, seller_processed, completed, cancelled
    private LocalDateTime createdAt;
    // 可选评价字段
    private Integer rating;
    private String comment;
    // 卖家处理信息
    private String sellerMessage;
    private String sellerImages; // 逗号分隔的图片URL
}