package org.example.campusmarket.Mapper;

import org.apache.ibatis.annotations.*;
import org.example.campusmarket.entity.Comment;

import java.util.List;

@Mapper
public interface CommentMapper {
    
    @Insert("INSERT INTO comments (product_id, user_id, content, created_at) VALUES (#{productId}, #{userId}, #{content}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
    void insertComment(Comment comment);
    
    @Select("""
        SELECT c.id, c.product_id as productId, c.user_id as userId, c.content, c.created_at as createdAt,
               ui.nickname as userNickname, ui.avatar as userAvatar
        FROM comments c
        LEFT JOIN userinfo ui ON c.user_id = ui.user_id
        WHERE c.product_id = #{productId}
        ORDER BY c.created_at DESC
    """)
    List<Comment> findByProductId(@Param("productId") Integer productId);
    
    @Select("SELECT COUNT(*) FROM comments WHERE product_id = #{productId}")
    int countByProductId(@Param("productId") Integer productId);
    
    @Delete("DELETE FROM comments WHERE id = #{id}")
    void deleteById(@Param("id") Integer id);
    
    @Select("SELECT id, product_id as productId, user_id as userId, content, created_at as createdAt FROM comments WHERE id = #{id}")
    Comment findById(@Param("id") Integer id);
}
