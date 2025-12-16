package org.example.campusmarket.Mapper;

import org.example.campusmarket.entity.ChatMessage;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface ChatMessageMapper {
    
    /** 获取会话内的所有消息（关联查询发送者昵称） */
    @Select("SELECT m.id, m.conversation_id, m.sender_id, m.content, m.type, m.created_at, " +
            "u.nickname AS sender_name " +
            "FROM chat_message m " +
            "LEFT JOIN userinfo u ON m.sender_id = u.user_id " +
            "WHERE m.conversation_id = #{conversationId} " +
            "ORDER BY m.created_at ASC")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "conversationId", column = "conversation_id"),
        @Result(property = "senderId", column = "sender_id"),
        @Result(property = "senderName", column = "sender_name"),
        @Result(property = "content", column = "content"),
        @Result(property = "type", column = "type"),
        @Result(property = "createdAt", column = "created_at")
    })
    List<ChatMessage> listMessages(@Param("conversationId") Integer conversationId);

    /** 发送消息（插入数据库） */
    @Insert("INSERT INTO chat_message (conversation_id, sender_id, content, type, created_at) " +
            "VALUES (#{conversationId}, #{senderId}, #{content}, #{type}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int sendMessage(ChatMessage message);
    
    /** 根据ID获取消息 */
    @Select("SELECT m.id, m.conversation_id, m.sender_id, m.content, m.type, m.created_at, " +
            "u.nickname AS sender_name " +
            "FROM chat_message m " +
            "LEFT JOIN userinfo u ON m.sender_id = u.user_id " +
            "WHERE m.id = #{id}")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "conversationId", column = "conversation_id"),
        @Result(property = "senderId", column = "sender_id"),
        @Result(property = "senderName", column = "sender_name"),
        @Result(property = "content", column = "content"),
        @Result(property = "type", column = "type"),
        @Result(property = "createdAt", column = "created_at")
    })
    ChatMessage getMessageById(@Param("id") Integer id);
}