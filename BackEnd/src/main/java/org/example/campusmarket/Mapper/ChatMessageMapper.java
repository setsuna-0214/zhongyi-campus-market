package org.example.campusmarket.Mapper;

import org.example.campusmarket.entity.ChatMessage;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface ChatMessageMapper {
    /** 获取会话内的所有消息 */
    @Select("SELECT * FROM chat_message WHERE conversation_id = #{conversationId} ORDER BY created_at ASC")
    List<ChatMessage> listMessages(Integer conversationId);

    /** 发送消息（插入数据库） */
    @Insert("INSERT INTO chat_message (conversation_id, sender_id, content, type, created_at) " +
            "VALUES (#{conversationId}, #{senderId}, #{content}, #{type}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int sendMessage(ChatMessage message);
}