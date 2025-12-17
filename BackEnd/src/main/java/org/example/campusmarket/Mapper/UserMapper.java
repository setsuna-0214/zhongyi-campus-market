package org.example.campusmarket.Mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.*;

import org.example.campusmarket.DTO.UserDto;
import org.example.campusmarket.entity.Product;
import org.example.campusmarket.entity.UserInfo;

import java.util.List;

@Mapper
public interface UserMapper {
    //通过id查找用户（联表查询获取注册时间）
    @Select("SELECT ui.*, u.created_at FROM userinfo ui JOIN users u ON ui.user_id = u.user_id WHERE ui.user_id = #{userId}")
    UserInfo findUserinfoById(@Param("userId") Integer userId);

    //更新用户信息
    @Update({
            "<script>",
            "UPDATE userinfo",
            "<set>",
            "  <if test='avatar != null'>avatar = #{avatar},</if>",
            "  <if test='nickname != null'>nickname = #{nickname},</if>",
            "  <if test='phone != null'>phone = #{phone},</if>",
            "  <if test='address != null'>address = #{address},</if>",
            "  <if test='bio != null'>bio = #{bio},</if>",
            "  <if test='gender != null'>gender = #{gender},</if>",
            "</set>",
            "WHERE user_id = #{userId}",
            "</script>"
    })
    int updateUserInfo(@Param("userId") Integer userId,
                       @Param("avatar") String avatar,
                       @Param("nickname") String nickname,
                       @Param("phone") String phone,
                       @Param("address") String address,
                       @Param("bio") String bio,
                       @Param("gender") Integer gender);


    //更新密码
    @Update("UPDATE userinfo SET password = #{newPassword} WHERE user_id = #{userId}")
    int updatePassword(@Param("userId") Integer userId, @Param("newPassword") String newPassword);

    //更新用户邮箱
    @Update("UPDATE userinfo SET email = #{newEmail} WHERE user_id = #{userId}")
    int updateEmail(@Param("userId") Integer userId, @Param("newEmail") String newEmail);

    //查找用户发布商品
    @Select("""
    SELECT pro_id, pro_name, price, is_seal, discription, picture, saler_id
    FROM products
    WHERE saler_id = #{userId}
    ORDER BY pro_id DESC
    """)
    List<Product> findPublishedProducts(@Param("userId") Integer userId);

    //查找用户已购买商品（从订单表查询，排除自己发布的商品）
    @Select("""
    SELECT DISTINCT p.pro_id, p.pro_name, p.price, p.is_seal, p.discription, p.picture, p.saler_id
    FROM orders o
    JOIN products p ON p.pro_id = o.product_id
    WHERE o.user_id = #{userId} AND p.saler_id != #{userId}
    ORDER BY p.pro_id DESC
    """)
    List<Product> findPurchasedProducts(@Param("userId") Integer userId);

    //查找用户收藏商品
    @Select("""
    SELECT p.pro_id, p.pro_name, p.price, p.is_seal, p.discription, p.picture, p.saler_id
    FROM fav_products fp
    JOIN products p ON p.pro_id = fp.pro_id
    WHERE fp.user_id = #{userId}
    ORDER BY p.pro_id DESC
    """)
    List<Product> findFavoriteProducts(@Param("userId") Integer userId);

    //更新用户头像
    @Update("UPDATE userinfo SET avatar = #{avatar} WHERE user_id = #{userId}")
    int updateAvatar(@Param("userId") Integer userId, @Param("avatar") String avatar);

    //搜索用户（支持关键词模糊匹配）
    @Select({
            "<script>",
            "SELECT user_id as id, username, nickname, avatar",
            "FROM userinfo",
            "<where>",
            "  <if test='keyword != null and keyword != \"\"'>",
            "    (username LIKE CONCAT('%', #{keyword}, '%')",
            "    OR nickname LIKE CONCAT('%', #{keyword}, '%'))",
            "  </if>",
            "</where>",
            "ORDER BY user_id DESC",
            "LIMIT #{offset}, #{pageSize}",
            "</script>"
    })
    List<UserDto.UserSearchItem> searchUsers(@Param("keyword") String keyword,
                                              @Param("offset") int offset,
                                              @Param("pageSize") int pageSize);

    //统计搜索结果总数
    @Select({
            "<script>",
            "SELECT COUNT(*) FROM userinfo",
            "<where>",
            "  <if test='keyword != null and keyword != \"\"'>",
            "    (username LIKE CONCAT('%', #{keyword}, '%')",
            "    OR nickname LIKE CONCAT('%', #{keyword}, '%'))",
            "  </if>",
            "</where>",
            "</script>"
    })
    long countSearchUsers(@Param("keyword") String keyword);

    //创建关注关系
    @Insert("INSERT INTO user_follows (follower_id, followee_id) VALUES (#{followerId}, #{followeeId})")
    int insertFollow(@Param("followerId") Integer followerId,
                     @Param("followeeId") Integer followeeId);

    //删除关注关系
    @Delete("DELETE FROM user_follows WHERE follower_id = #{followerId} AND followee_id = #{followeeId}")
    int deleteFollow(@Param("followerId") Integer followerId,
                     @Param("followeeId") Integer followeeId);

    //查询关注列表
    @Select("""
        SELECT ui.user_id as id, u.username, ui.nickname, ui.avatar
        FROM user_follows uf
        JOIN users u ON uf.followee_id = u.user_id
        LEFT JOIN userinfo ui ON u.user_id = ui.user_id
        WHERE uf.follower_id = #{userId}
        ORDER BY uf.id DESC
        """)
    List<UserDto.FollowItem> findFollowList(@Param("userId") Integer userId);

    //检查关注状态
    @Select("SELECT COUNT(*) FROM user_follows WHERE follower_id = #{followerId} AND followee_id = #{followeeId}")
    int checkFollowExists(@Param("followerId") Integer followerId,
                          @Param("followeeId") Integer followeeId);
}
