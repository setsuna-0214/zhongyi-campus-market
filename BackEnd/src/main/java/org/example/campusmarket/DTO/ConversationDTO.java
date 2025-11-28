package org.example.campusmarket.DTO;

import lombok.Data;
import java.util.Date;

/**
 * 会话列表响应 DTO（补充缺失字段，适配 Service 转换逻辑）
 */
@Data // 必须加 @Data，自动生成 set/get 方法
public class ConversationDTO {
    private Integer id;                // 会话ID
    private Integer userId;            // 当前用户ID
    private Integer targetUserId;      // 目标用户ID（关键：添加该字段，对应 setTargetUserId）
    private String targetUserName;     // 目标用户名
    private String targetUserAvatar;   // 目标用户头像
    private Integer orderId;           // 关联订单ID
    private Integer productId;         // 关联商品ID
    private String lastMessage;        // 最后一条消息
    private Integer unreadCount;       // 未读数
    private Date createdAt;            // 创建时间
    private Date updatedAt;            // 更新时间
}