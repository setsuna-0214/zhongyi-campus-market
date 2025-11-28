package org.example.campusmarket.Mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.example.campusmarket.entity.ChatMessage;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatMessageMapper {

    // 插入消息：新增 msg_id 字段（关键！匹配数据库表和实体类）
    @Insert("INSERT INTO chat_message (sender_id, receiver_id, content, send_time, is_read, msg_id) " +
            "VALUES (#{senderId}, #{receiverId}, #{content}, #{sendTime}, #{isRead}, #{msgId})")
    int insert(ChatMessage message);

    // 查询历史消息：基于索引优化（无需改，因为查询不需要msg_id）
    @Select("SELECT id, sender_id as senderId, receiver_id as receiverId, content, send_time as sendTime, is_read as isRead, msg_id as msgId " +
            "FROM chat_message " +
            "WHERE (sender_id = #{userId1} AND receiver_id = #{userId2}) " +
            "   OR (sender_id = #{userId2} AND receiver_id = #{userId1}) " +
            "ORDER BY send_time ASC") // 按发送时间升序
    List<ChatMessage> selectHistory(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}