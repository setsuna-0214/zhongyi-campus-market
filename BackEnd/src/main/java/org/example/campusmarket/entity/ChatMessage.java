package org.example.campusmarket.entity;

import lombok.Data;
import java.util.Date;

@Data // 确保有lombok的@Data注解（自动生成get/set）
public class ChatMessage {
    private Long id; // 主键
    private Long senderId; // 发送人ID
    private Long receiverId; // 接收人ID
    private String content; // 消息内容
    private Date sendTime; // 发送时间
    private Integer isRead; // 是否已读
    private String msgId; // 新增：消息唯一ID（对应数据库的msg_id字段）
}