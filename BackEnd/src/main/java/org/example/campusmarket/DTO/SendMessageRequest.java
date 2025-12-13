package org.example.campusmarket.DTO;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class SendMessageRequest {
    /** 消息内容 */
    @NotBlank(message = "消息内容不能为空")
    private String content;
    /** 消息类型 */
    @NotNull(message = "消息类型不能为空")
    private String type = "text"; // 默认文本类型
}