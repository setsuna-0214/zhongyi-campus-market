package org.example.campusmarket.DTO;

import lombok.Data;

/**
 * 消息响应DTO
 */
@Data
public class MessageResponseDTO {
    private Integer id;            // 消息ID
    private Integer conversationId;// 会话ID
    private Integer senderId;      // 发送者ID
    private String content;        // 消息内容
    private String type;           // 消息类型
    private String createdAt;      // 创建时间（UTC格式）
}