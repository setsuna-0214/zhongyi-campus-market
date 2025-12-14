package org.example.campusmarket.Mapper;

import org.apache.ibatis.annotations.*;
import org.example.campusmarket.entity.Order;

import java.time.LocalDateTime;
import java.util.List;

@Mapper

public interface OrdersMapper {

    //插入订单

    @Insert("""
    INSERT INTO orders (user_id, pro_id, quantity, total_price, status, created_at)
    VALUES (#{userId}, #{productId}, #{quantity}, #{totalPrice}, #{status}, #{createdAt})
    """)
    @Options(useGeneratedKeys = true, keyProperty = "id")

    int insertOrder(Order order);


    //查询用户订单列表，支持按状态、关键词与时间范围进行可选过滤。当参数为 null 或空字符串时，对应过滤条件不会加入 WHERE 子句。
    @Select({
            "<script>",
            "SELECT o.id, o.user_id, o.pro_id AS productId, o.quantity, o.total_price, o.status, o.created_at",
            "FROM orders o",
            "<where>",
            "  o.user_id = #{userId}",
            "  <if test=\"status != null and status != ''\">AND o.status = #{status}</if>",
            "  <if test=\"startDate != null and startDate != ''\">AND o.created_at &gt;= #{startDate}</if>",
            "  <if test=\"endDate != null and endDate != ''\">AND o.created_at &lt;= #{endDate}</if>",
            "  <if test=\"keyword != null and keyword != ''\">AND EXISTS (SELECT 1 FROM products p WHERE p.pro_id = o.pro_id AND (p.pro_name LIKE CONCAT('%',#{keyword},'%') OR p.discription LIKE CONCAT('%',#{keyword},'%')))</if>",
            "</where>",
            "ORDER BY o.created_at DESC",
            "</script>"
    })

    List<Order> getOrderList(@Param("userId") Integer userId,
                           @Param("status") String status,
                           @Param("keyword") String keyword,
                           @Param("startDate") String startDate,
                           @Param("endDate") String endDate);


    //更新订单状态。
    @Update("UPDATE orders SET status = #{status} WHERE id = #{id} AND user_id = #{userId}")
    int updateStatus(@Param("id") Integer id, @Param("userId") Integer userId, @Param("status") String status);

    //更新订单评价（评分与评论）。
    @Update("UPDATE orders SET rating = #{rating}, comment = #{comment} WHERE id = #{id} AND user_id = #{userId}")
    int updateReview(@Param("id") Integer id, @Param("userId") Integer userId, @Param("rating") Integer rating, @Param("comment") String comment);


    //统计当前用户的订单总数。
    @Select("SELECT COUNT(*) FROM orders WHERE user_id = #{userId}")
    int countTotal(@Param("userId") Integer userId);

    //统计当前用户处于 pending 状态的订单数。
    @Select("SELECT COUNT(*) FROM orders WHERE user_id = #{userId} AND status = 'pending'")
    int countPending(@Param("userId") Integer userId);

    //统计当前用户处于 completed 状态的订单数。
    @Select("SELECT COUNT(*) FROM orders WHERE user_id = #{userId} AND status = 'completed'")
    int countCompleted(@Param("userId") Integer userId);

    //统计当前用户处于 cancelled 状态的订单数。
    @Select("SELECT COUNT(*) FROM orders WHERE user_id = #{userId} AND status = 'cancelled'")
    int countCancelled(@Param("userId") Integer userId);
}