package org.example.campusmarket.DTO;

import lombok.Data;

/**
 * 创建会话入参 DTO
 */
@Data
public class CreateConversationDTO {
    private Integer userId;            // 目标用户ID
    private Integer orderId;           // 关联订单ID
    private Integer productId;         // 关联商品ID
}