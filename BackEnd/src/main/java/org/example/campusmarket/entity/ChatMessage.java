package org.example.campusmarket.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    
    /** 发送者昵称（非数据库字段，用于前端展示） */
    @JsonProperty("senderName")
    private String senderName;
    
    /** 消息内容 */
    private String content;
    
    /** 消息类型：text-文本, image-图片, product-商品卡片 */
    private String type;
    
    /** 消息创建时间 - 作为 timestamp 输出给前端 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    @JsonProperty("timestamp")
    private Date createdAt;
    
    /** 是否为当前用户发送的消息（非数据库字段，由后端计算） */
    @JsonProperty("isOwn")
    private Boolean isOwn;
}