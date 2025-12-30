package org.example.campusmarket.Mapper;

import org.apache.ibatis.annotations.*;
import org.example.campusmarket.entity.SystemMessage;

import java.util.List;

@Mapper
public interface SystemMessageMapper {

    @Select("SELECT id, user_id, type, title, content, link, link_text, is_read, created_at " +
            "FROM system_messages WHERE user_id = #{userId} ORDER BY created_at DESC")
    @Results({
            @Result(property = "userId", column = "user_id"),
            @Result(property = "linkText", column = "link_text"),
            @Result(property = "isRead", column = "is_read"),
            @Result(property = "createdAt", column = "created_at")
    })
    List<SystemMessage> findByUserId(Integer userId);

    @Select("SELECT COUNT(*) FROM system_messages WHERE user_id = #{userId} AND is_read = 0")
    Integer countUnreadByUserId(Integer userId);

    @Update("UPDATE system_messages SET is_read = 1 WHERE user_id = #{userId}")
    void markAllAsRead(Integer userId);

    @Update("UPDATE system_messages SET is_read = 1 WHERE id = #{id} AND user_id = #{userId}")
    void markAsRead(@Param("id") Integer id, @Param("userId") Integer userId);

    @Delete("DELETE FROM system_messages WHERE id = #{id} AND user_id = #{userId}")
    void deleteById(@Param("id") Integer id, @Param("userId") Integer userId);

    @Delete("DELETE FROM system_messages WHERE user_id = #{userId}")
    void deleteAllByUserId(Integer userId);

    @Insert("INSERT INTO system_messages (user_id, type, title, content, link, link_text) " +
            "VALUES (#{userId}, #{type}, #{title}, #{content}, #{link}, #{linkText})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(SystemMessage message);
}
