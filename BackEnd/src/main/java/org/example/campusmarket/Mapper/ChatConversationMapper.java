package org.example.campusmarket.Mapper;

import org.example.campusmarket.entity.ChatConversation;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface ChatConversationMapper {
    
    /** 获取当前用户的所有会话（实时获取对方用户的最新昵称和头像） */
    @Select("SELECT c.id, c.user_id, c.partner_id, " +
            "COALESCE(NULLIF(ui.nickname, ''), ui.username, c.user_name, CONCAT('用户', c.partner_id)) as user_name, " +
            "COALESCE(ui.avatar, c.user_avatar) as user_avatar, " +
            "c.last_message, c.last_message_time, c.unread_count, c.order_id, c.product_id, c.created_at, c.updated_at " +
            "FROM chat_conversation c " +
            "LEFT JOIN userinfo ui ON c.partner_id = ui.user_id " +
            "WHERE c.user_id = #{userId} ORDER BY c.updated_at DESC")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "userId", column = "user_id"),
        @Result(property = "partnerId", column = "partner_id"),
        @Result(property = "userName", column = "user_name"),
        @Result(property = "userAvatar", column = "user_avatar"),
        @Result(property = "lastMessage", column = "last_message"),
        @Result(property = "lastMessageTime", column = "last_message_time"),
        @Result(property = "unreadCount", column = "unread_count"),
        @Result(property = "orderId", column = "order_id"),
        @Result(property = "productId", column = "product_id"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    List<ChatConversation> listConversations(@Param("userId") Integer userId);

    /** 根据ID获取会话 */
    @Select("SELECT id, user_id, partner_id, user_name, user_avatar, last_message, " +
            "last_message_time, unread_count, order_id, product_id, created_at, updated_at " +
            "FROM chat_conversation WHERE id = #{id}")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "userId", column = "user_id"),
        @Result(property = "partnerId", column = "partner_id"),
        @Result(property = "userName", column = "user_name"),
        @Result(property = "userAvatar", column = "user_avatar"),
        @Result(property = "lastMessage", column = "last_message"),
        @Result(property = "lastMessageTime", column = "last_message_time"),
        @Result(property = "unreadCount", column = "unread_count"),
        @Result(property = "orderId", column = "order_id"),
        @Result(property = "productId", column = "product_id"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    ChatConversation getConversationById(@Param("id") Integer id);

    /** 创建会话 - 注意字段名与数据库列名对应 */
    @Insert("INSERT INTO chat_conversation (user_id, partner_id, user_name, user_avatar, order_id, product_id, created_at, updated_at) " +
            "VALUES (#{userId}, #{partnerId}, #{userName}, #{userAvatar}, #{orderId}, #{productId}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int createConversation(ChatConversation conversation);

    /** 更新会话最后一条消息 - 修复：移除 user_id 条件，因为发送者可能是对方 */
    @Update("UPDATE chat_conversation SET last_message = #{lastMessage}, last_message_time = NOW(), " +
            "unread_count = unread_count + #{unreadCount}, updated_at = NOW() WHERE id = #{id}")
    int updateLastMessage(@Param("id") Integer id, @Param("lastMessage") String lastMessage, @Param("unreadCount") Integer unreadCount);

    /** 清除未读消息数 */
    @Update("UPDATE chat_conversation SET unread_count = 0, updated_at = NOW() WHERE id = #{id} AND user_id = #{userId}")
    int clearUnreadCount(@Param("id") Integer id, @Param("userId") Integer userId);

    /** 删除会话 */
    @Delete("DELETE FROM chat_conversation WHERE id = #{id} AND user_id = #{userId}")
    int deleteConversation(@Param("id") Integer id, @Param("userId") Integer userId);

    /** 查询会话是否存在（避免重复创建）- 支持 orderId 为 null 的情况 */
    @Select("<script>" +
            "SELECT id FROM chat_conversation WHERE user_id = #{userId} AND partner_id = #{partnerId} " +
            "<if test='orderId != null'> AND order_id = #{orderId} </if>" +
            "<if test='orderId == null'> AND order_id IS NULL </if>" +
            "LIMIT 1" +
            "</script>")
    Integer findConversationId(@Param("userId") Integer userId, @Param("partnerId") Integer partnerId, @Param("orderId") Integer orderId);
    
    /** 根据会话ID查找对方的会话ID（用于同步更新双方会话） */
    @Select("SELECT c2.id FROM chat_conversation c1 " +
            "JOIN chat_conversation c2 ON c1.user_id = c2.partner_id AND c1.partner_id = c2.user_id " +
            "AND ((c1.order_id IS NULL AND c2.order_id IS NULL) OR c1.order_id = c2.order_id) " +
            "WHERE c1.id = #{conversationId} LIMIT 1")
    Integer findPartnerConversationId(@Param("conversationId") Integer conversationId);
}