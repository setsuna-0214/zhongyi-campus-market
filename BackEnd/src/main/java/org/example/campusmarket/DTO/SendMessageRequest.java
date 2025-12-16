package org.example.campusmarket.DTO;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class SendMessageRequest {
    /** 消息内容（文本、图片URL或JSON格式的商品卡片信息） */
    @NotNull(message = "消息内容不能为空")
    private String content;
    
    /** 消息类型：text-文本, image-图片, product-商品卡片 */
    private String type = "text";
}