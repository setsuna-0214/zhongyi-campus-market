package org.example.campusmarket.Mapper;

import org.apache.ibatis.annotations.*;

@Mapper
public interface CartMapper {

    @Select("SELECT COUNT(*) FROM cart_products WHERE user_id = #{userId} AND pro_id = #{productId}")
    int countByUserAndProduct(@Param("userId") Integer userId, @Param("productId") Integer productId);

    @Insert("INSERT INTO cart_products (user_id, pro_id, quantity) VALUES (#{userId}, #{productId}, #{quantity})")
    int insertCartItem(@Param("userId") Integer userId, @Param("productId") Integer productId, @Param("quantity") Integer quantity);

    @Update("UPDATE cart_products SET quantity = quantity + #{delta} WHERE user_id = #{userId} AND pro_id = #{productId}")
    int incrementCartItem(@Param("userId") Integer userId, @Param("productId") Integer productId, @Param("delta") Integer delta);
}