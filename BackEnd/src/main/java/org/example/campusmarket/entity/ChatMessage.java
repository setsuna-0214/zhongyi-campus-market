package org.example.campusmarket.entity;

import lombok.Data;
import java.util.Date;

/**
 * 聊天消息实体（原生 MyBatis 版，移除所有 MP 注解）
 */
@Data // 仅保留 lombok 注解，无需 MP 的 @TableName
public class ChatMessage {
    // 1. 主键类型统一为 Long（适配数据库自增主键，避免 Integer 长度不足）
    private Long id;                // 主键ID
    private Long conversationId;    // 会话ID（对应数据库 conversation_id）
    private Long senderId;          // 发送者ID（对应数据库 sender_id）
    private Long receiverId;        // 接收者ID（对应数据库 receiver_id）
    private String content;         // 消息内容
    private String type;            // 消息类型（text/image）
    private Integer isRead;         // 是否已读（0-未读，1-已读）（对应数据库 is_read）
    private Date createdAt;         // 创建时间（对应数据库 created_at）
}