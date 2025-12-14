package org.example.campusmarket.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.util.Date;

@Data
public class ChatMessage {
    /** 消息ID */
    private Integer id;
    /** 会话ID */
    private Integer conversationId;
    /** 发送者ID */
    private Integer senderId;
    /** 消息内容 */
    private String content;
    /** 消息类型（text/图片等） */
    private String type;
    /** 消息创建时间 */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private Date createdAt;
}