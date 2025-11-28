package org.example.campusmarket.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 发送消息请求DTO
 */
@Data
public class SendMessageDTO {
    @NotBlank(message = "消息内容不能为空")
    private String content;       // 消息内容
    private String type = "text"; // 消息类型（默认文本）
}