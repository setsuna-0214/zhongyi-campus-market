package org.example.campusmarket.Mapper;

import org.apache.ibatis.annotations.*;
import org.example.campusmarket.entity.Product;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface FavoriteMapper {
    @Select("""
    SELECT p.pro_id, p.pro_name, p.price, p.is_seal, p.discription, p.picture, p.saler_id
    FROM fav_products fp
    JOIN products p ON p.pro_id = fp.pro_id
    WHERE fp.user_id = #{userId}
    ORDER BY p.pro_id DESC
    """)
    List<Product> getFavoritesByUserId(@Param("userId") Integer userId);

    // 获取收藏列表（包含收藏记录信息、卖家信息、浏览量等）
    @Select("""
    SELECT fp.id as fav_id, fp.pro_id, fp.created_at,
           p.pro_name, p.price, p.is_seal, p.picture,
           p.view_count, p.created_at as publish_time,
           ui.user_id as seller_id, ui.nickname as seller_nickname, 
           ui.username as seller_username, ui.avatar as seller_avatar,
           ui.address as location
    FROM fav_products fp
    JOIN products p ON p.pro_id = fp.pro_id
    LEFT JOIN userinfo ui ON p.saler_id = ui.user_id
    WHERE fp.user_id = #{userId}
    ORDER BY fp.created_at DESC
    """)
    List<Map<String, Object>> getFavoritesWithDetails(@Param("userId") Integer userId);

    @Select("SELECT COUNT(*) FROM fav_products WHERE user_id = #{userId} AND pro_id = #{productId}")
    int countByUserAndProduct(@Param("userId") Integer userId, @Param("productId") Integer productId);

    @Insert("INSERT INTO fav_products (user_id, pro_id, created_at) VALUES (#{userId}, #{productId}, #{createdAt})")
    int insertFavorite(@Param("userId") Integer userId, @Param("productId") Integer productId, @Param("createdAt") LocalDateTime createdAt);

    // 获取刚插入的收藏记录ID
    @Select("SELECT id FROM fav_products WHERE user_id = #{userId} AND pro_id = #{productId}")
    Integer getFavoriteId(@Param("userId") Integer userId, @Param("productId") Integer productId);

    @Delete("DELETE FROM fav_products WHERE user_id = #{userId} AND pro_id = #{productId}")
    int deleteFavorite(@Param("userId") Integer userId, @Param("productId") Integer productId);
}