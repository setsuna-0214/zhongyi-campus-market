package org.example.campusmarket.Mapper;

import org.apache.ibatis.annotations.*;
import org.example.campusmarket.entity.ChatMessage;

import java.util.List;

@Mapper
public interface ChatMessageMapper {

    // 1. 根据会话ID查询消息列表（Service 调用的核心方法）
    @Select("SELECT * FROM chat_message WHERE conversation_id = #{conversationId} ORDER BY created_at ASC")
    List<ChatMessage> selectByConversationId(Long conversationId);

    // 2. 插入消息（原生 MyBatis 插入，自增主键回填）
    @Insert("INSERT INTO chat_message (conversation_id, sender_id, receiver_id, content, type, is_read, created_at) " +
            "VALUES (#{conversationId}, #{senderId}, #{receiverId}, #{content}, #{type}, #{isRead}, #{createdAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(ChatMessage message);

    // 3. 其他可选方法（按需添加）
    @Select("SELECT * FROM chat_message WHERE id = #{id}")
    ChatMessage selectById(Long id);

    @Update("UPDATE chat_message SET is_read = 1 WHERE id = #{id}")
    int markAsRead(Long id);

    @Delete("DELETE FROM chat_message WHERE id = #{id}")
    int deleteById(Long id);
}