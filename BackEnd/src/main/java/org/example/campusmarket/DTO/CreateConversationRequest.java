package org.example.campusmarket.DTO;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class CreateConversationRequest {
    /** 对方用户ID */
    @NotNull(message = "对方用户ID不能为空")
    private Integer userId;
    
    /** 关联订单ID（可选） */
    private Integer orderId;
    
    /** 关联商品ID（可选） */
    private Integer productId;
    
    /** 对方昵称（可选，如果不传则从数据库查询） */
    private String partnerName;
    
    /** 对方头像（可选，如果不传则从数据库查询） */
    private String partnerAvatar;
}