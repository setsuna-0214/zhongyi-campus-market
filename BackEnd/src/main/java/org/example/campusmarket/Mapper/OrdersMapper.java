package org.example.campusmarket.Mapper;

import org.apache.ibatis.annotations.*;
import org.example.campusmarket.entity.Order;

import java.time.LocalDateTime;
import java.util.List;

@Mapper

public interface OrdersMapper {

    //插入订单

    @Insert("""
    INSERT INTO orders (user_id, seller_id, product_id, quantity, total_price, status, created_at)
    VALUES (#{userId}, #{sellerId}, #{productId}, #{quantity}, #{totalPrice}, #{status}, #{createdAt})
    """)
    @Options(useGeneratedKeys = true, keyProperty = "id")

    int insertOrder(Order order);


    //查询用户订单列表，支持按状态、关键词与时间范围进行可选过滤。当参数为 null 或空字符串时，对应过滤条件不会加入 WHERE 子句。
    @Select({
            "<script>",
            "SELECT o.id, o.user_id AS userId, o.seller_id AS sellerId, o.product_id AS productId, o.quantity, o.total_price AS totalPrice, o.status, o.created_at AS createdAt, o.rating, o.comment, o.seller_message AS sellerMessage, o.seller_images AS sellerImages",
            "FROM orders o",
            "<where>",
            "  o.user_id = #{userId}",
            "  <if test=\"status != null and status != ''\">AND o.status = #{status}</if>",
            "  <if test=\"startDate != null and startDate != ''\">AND o.created_at &gt;= #{startDate}</if>",
            "  <if test=\"endDate != null and endDate != ''\">AND o.created_at &lt;= #{endDate}</if>",
            "  <if test=\"keyword != null and keyword != ''\">AND EXISTS (SELECT 1 FROM products p WHERE p.pro_id = o.product_id AND (p.pro_name LIKE CONCAT('%',#{keyword},'%') OR p.discription LIKE CONCAT('%',#{keyword},'%')))</if>",
            "</where>",
            "ORDER BY o.created_at DESC",
            "</script>"
    })
    @Results({
            @Result(property = "id", column = "id"),
            @Result(property = "userId", column = "userId"),
            @Result(property = "sellerId", column = "sellerId"),
            @Result(property = "productId", column = "productId"),
            @Result(property = "quantity", column = "quantity"),
            @Result(property = "totalPrice", column = "totalPrice"),
            @Result(property = "status", column = "status"),
            @Result(property = "createdAt", column = "createdAt"),
            @Result(property = "rating", column = "rating"),
            @Result(property = "comment", column = "comment"),
            @Result(property = "sellerMessage", column = "sellerMessage"),
            @Result(property = "sellerImages", column = "sellerImages")
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

    //查询用户作为卖家的订单列表
    @Select({
            "<script>",
            "SELECT o.id, o.user_id AS userId, o.seller_id AS sellerId, o.product_id AS productId, o.quantity, o.total_price AS totalPrice, o.status, o.created_at AS createdAt, o.rating, o.comment, o.seller_message AS sellerMessage, o.seller_images AS sellerImages",
            "FROM orders o",
            "<where>",
            "  o.seller_id = #{userId}",
            "  <if test=\"status != null and status != ''\">AND o.status = #{status}</if>",
            "  <if test=\"startDate != null and startDate != ''\">AND o.created_at &gt;= #{startDate}</if>",
            "  <if test=\"endDate != null and endDate != ''\">AND o.created_at &lt;= #{endDate}</if>",
            "  <if test=\"keyword != null and keyword != ''\">AND EXISTS (SELECT 1 FROM products p WHERE p.pro_id = o.product_id AND (p.pro_name LIKE CONCAT('%',#{keyword},'%') OR p.discription LIKE CONCAT('%',#{keyword},'%')))</if>",
            "</where>",
            "ORDER BY o.created_at DESC",
            "</script>"
    })
    @Results({
            @Result(property = "id", column = "id"),
            @Result(property = "userId", column = "userId"),
            @Result(property = "sellerId", column = "sellerId"),
            @Result(property = "productId", column = "productId"),
            @Result(property = "quantity", column = "quantity"),
            @Result(property = "totalPrice", column = "totalPrice"),
            @Result(property = "status", column = "status"),
            @Result(property = "createdAt", column = "createdAt"),
            @Result(property = "rating", column = "rating"),
            @Result(property = "comment", column = "comment"),
            @Result(property = "sellerMessage", column = "sellerMessage"),
            @Result(property = "sellerImages", column = "sellerImages")
    })
    List<Order> getOrderListBySeller(@Param("userId") Integer userId,
                                     @Param("status") String status,
                                     @Param("keyword") String keyword,
                                     @Param("startDate") String startDate,
                                     @Param("endDate") String endDate);

    // 根据订单ID查询订单详情
    @Select("SELECT id, user_id AS userId, seller_id AS sellerId, product_id AS productId, quantity, total_price AS totalPrice, status, created_at AS createdAt, rating, comment, seller_message AS sellerMessage, seller_images AS sellerImages FROM orders WHERE id = #{orderId}")
    @Results({
            @Result(property = "id", column = "id"),
            @Result(property = "userId", column = "userId"),
            @Result(property = "sellerId", column = "sellerId"),
            @Result(property = "productId", column = "productId"),
            @Result(property = "quantity", column = "quantity"),
            @Result(property = "totalPrice", column = "totalPrice"),
            @Result(property = "status", column = "status"),
            @Result(property = "createdAt", column = "createdAt"),
            @Result(property = "rating", column = "rating"),
            @Result(property = "comment", column = "comment"),
            @Result(property = "sellerMessage", column = "sellerMessage"),
            @Result(property = "sellerImages", column = "sellerImages")
    })
    Order getOrderById(@Param("orderId") Integer orderId);

    // 更新订单状态（包含卖家留言和图片）
    @Update("UPDATE orders SET status = #{status}, seller_message = #{sellerMessage}, seller_images = #{sellerImages} WHERE id = #{orderId}")
    int updateOrderStatusWithMessage(@Param("orderId") Integer orderId, @Param("status") String status, @Param("sellerMessage") String sellerMessage, @Param("sellerImages") String sellerImages);
}