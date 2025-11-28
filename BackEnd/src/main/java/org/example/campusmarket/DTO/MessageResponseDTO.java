package org.example.campusmarket.DTO;
import lombok.Data;

@Data // 确保有这个注解（自动生成get/set）
public class MessageDTO {
    // 你原来的字段（senderId、receiverId、content）
    private Long senderId;
    private Long receiverId;
    private String content;

    // 新增这一行：消息唯一ID
    private String msgId;
}