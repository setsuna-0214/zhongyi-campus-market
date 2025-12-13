package org.example.campusmarket.DTO;

import lombok.Data;
import jakarta.validation.constraints.NotNull;


@Data
public class CreateConversationRequest {
    /** 对方用户ID */
    @NotNull(message = "对方用户ID不能为空")
    private Integer userId; // 对应接口的userId（对方ID）
    /** 关联订单ID */
    private Long orderId;
    /** 关联商品ID */
    private Long productId;
    /** 对方昵称 */
    private String partnerName;
    /** 对方头像 */
    private String partnerAvatar;
}