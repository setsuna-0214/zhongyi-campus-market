package org.example.campusmarket.entity;

import lombok.Data;
import java.util.Date;

/**
 * 聊天会话实体（原生 MyBatis 版，移除所有 MP 注解）
 */
@Data // 仅保留 Lombok 的 @Data 注解，简化 get/set
public class ChatConversation {
    // 建议将 Integer 改为 Long，避免数据库主键超出 Integer 范围（数据库主键推荐 BIGINT 类型）
    private Long id;                // 主键ID
    private Long userId;            // 当前用户ID（对应数据库 user_id）
    private Long targetUserId;      // 目标用户ID（对应数据库 target_user_id）
    private String targetUserName;  // 目标用户名（对应数据库 target_user_name）
    private String targetUserAvatar;// 目标用户头像（对应数据库 target_user_avatar）
    private Long orderId;           // 关联订单ID（对应数据库 order_id）
    private Long productId;         // 关联商品ID（对应数据库 product_id）
    private String lastMessage;     // 最后一条消息（对应数据库 last_message）
    private Integer unreadCount;    // 未读数（对应数据库 unread_count）
    private Date createdAt;         // 创建时间（对应数据库 created_at）
    private Date updatedAt;         // 更新时间（对应数据库 updated_at）
}