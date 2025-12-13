package org.example.campusmarket.Mapper;

import org.example.campusmarket.entity.ChatConversation;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface ChatConversationMapper {
    /** 获取当前用户的所有会话 */
    @Select("SELECT * FROM chat_conversation WHERE user_id = #{userId} ORDER BY updated_at DESC")
    List<ChatConversation> listConversations(@Param("userId") Integer userId);

    /** 创建会话 */
    @Insert("INSERT INTO chat_conversation (user_id, partner_id, partner_name, partner_avatar, order_id, product_id, created_at, updated_at) " +
            "VALUES (#{userId}, #{partnerId}, #{partnerName}, #{partnerAvatar}, #{orderId}, #{productId}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int createConversation(@Param("conversation") ChatConversation conversation);

    /** 更新会话最后一条消息 */
    @Update("UPDATE chat_conversation SET last_message = #{lastMessage}, last_message_time = NOW(), unread_count = unread_count + #{unreadCount}, updated_at = NOW() WHERE id = #{id} AND user_id = #{userId}")
    int updateLastMessage(@Param("id") Integer id, @Param("lastMessage") String lastMessage, @Param("unreadCount") Integer unreadCount, @Param("userId") Integer userId);

    /** 删除会话 */
    @Delete("DELETE FROM chat_conversation WHERE id = #{id} AND user_id = #{userId}")
    int deleteConversation(@Param("id") Integer id, @Param("userId") Integer userId);

    /** 查询会话是否存在（避免重复创建） */
    @Select("SELECT id FROM chat_conversation WHERE user_id = #{userId} AND partner_id = #{partnerId} AND order_id = #{orderId} LIMIT 1")
    Integer findConversationId(@Param("userId") Integer userId, @Param("partnerId") Integer partnerId, @Param("orderId") Integer orderId);
}