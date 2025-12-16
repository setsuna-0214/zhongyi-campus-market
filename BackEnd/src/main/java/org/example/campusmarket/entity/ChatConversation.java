package org.example.campusmarket.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.Date;

@Data
public class ChatConversation {
    /** 会话ID */
    private Integer id;
    
    /** 当前用户ID（会话所属者） */
    private Integer userId;
    
    /** 对方用户ID */
    private Integer partnerId;
    
    /** 对方昵称 - 数据库字段为 user_name，JSON 输出为 userName */
    @JsonProperty("userName")
    private String userName;
    
    /** 对方头像 - 数据库字段为 user_avatar，JSON 输出为 userAvatar */
    @JsonProperty("userAvatar")
    private String userAvatar;
    
    /** 最后一条消息 */
    private String lastMessage;
    
    /** 最后一条消息时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private Date lastMessageTime;
    
    /** 未读消息数 */
    private Integer unreadCount;
    
    /** 关联订单ID */
    private Integer orderId;
    
    /** 关联商品ID */
    private Integer productId;
    
    /** 会话创建时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private Date createdAt;
    
    /** 会话更新时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private Date updatedAt;
}