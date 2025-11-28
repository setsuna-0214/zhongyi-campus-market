package org.example.campusmarket.DTO;

import lombok.Data;

/**
 * 创建会话响应 DTO
 */
@Data
public class CreateConversationResponseDTO {
    private Integer id;                // 会话ID
    private Integer userId;            // 目标用户ID
    private String userName;           // 目标用户名
    private String userAvatar;         // 目标用户头像
    private Integer orderId;           // 关联订单ID
    private String createdAt;          // 创建时间（UTC格式）
}