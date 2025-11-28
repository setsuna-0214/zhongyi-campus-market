package org.example.campusmarket.Mapper;

import org.apache.ibatis.annotations.*;
import org.example.campusmarket.entity.ChatConversation;

import java.util.List;

@Mapper
public interface ChatConversationMapper {

    // 1. 根据用户ID查询会话列表（替代 MP 的 selectList + Wrapper）
    @Select("SELECT * FROM chat_conversation WHERE user_id = #{userId} ORDER BY updated_at DESC")
    List<ChatConversation> selectByUserId(Long userId);

    // 2. 根据当前用户+目标用户+订单ID查询已有会话（替代 MP 的 selectOne + QueryWrapper）
    @Select("<script>" +
            "SELECT * FROM chat_conversation WHERE user_id = #{currentUserId} AND target_user_id = #{targetUserId} " +
            "<if test='orderId != null'>AND order_id = #{orderId}</if>" +
            "</script>")
    ChatConversation selectByUserAndTarget(
            @Param("currentUserId") Long currentUserId,
            @Param("targetUserId") Long targetUserId,
            @Param("orderId") Long orderId
    );

    // 3. 新增会话（原生 MyBatis 插入）
    @Insert("INSERT INTO chat_conversation (user_id, target_user_id, target_user_name, target_user_avatar, " +
            "order_id, product_id, last_message, unread_count, created_at, updated_at) " +
            "VALUES (#{userId}, #{targetUserId}, #{targetUserName}, #{targetUserAvatar}, " +
            "#{orderId}, #{productId}, #{lastMessage}, #{unreadCount}, #{createdAt}, #{updatedAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(ChatConversation conversation);

    // 4. 根据ID删除会话
    @Delete("DELETE FROM chat_conversation WHERE id = #{id}")
    int deleteById(Long id);

    // 5. 根据ID查询会话
    @Select("SELECT * FROM chat_conversation WHERE id = #{id}")
    ChatConversation selectById(Long id);

    // 6. 更新会话最后一条消息和未读数
    @Update("UPDATE chat_conversation SET " +
            "last_message = #{lastMessage}, " +
            "unread_count = unread_count + #{unreadIncrement}, " +
            "updated_at = NOW() " +
            "WHERE id = #{conversationId}")
    int updateConversationLastMessage(
            @Param("conversationId") Long conversationId,
            @Param("lastMessage") String lastMessage,
            @Param("unreadIncrement") Integer unreadIncrement
    );

    // 7. 清空未读数
    @Update("UPDATE chat_conversation SET unread_count = 0, updated_at = NOW() WHERE id = #{conversationId}")
    int clearUnreadCount(Long conversationId);
}