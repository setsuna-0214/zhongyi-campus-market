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
    private Integer userId;
    private Integer productId;
    private Integer quantity;
    private BigDecimal totalPrice;
    private String status; // pending, completed, cancelled
    private LocalDateTime createdAt;
    // 可选评价字段
    private Integer rating;
    private String comment;
}