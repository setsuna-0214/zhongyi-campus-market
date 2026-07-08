package org.example.campusmarket.modules.admin.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import org.example.campusmarket.modules.admin.dto.AdminDto;

import java.util.List;

/**
 * 管理员后台专用 Mapper
 * 集中维护用户管理、商品管理、订单管理、论坛帖子管理等查询。
 * 这里只读 + 仅限管理员安全的写操作（启禁用户、商品下架恢复），不与业务 Mapper 耦合。
 */
@Mapper
public interface AdminMapper {

    // ==================== 统计 ====================

    @Select("SELECT COUNT(*) FROM users WHERE (is_deleted IS NULL OR is_deleted = 0)")
    long countUsers();

    @Select("SELECT COUNT(*) FROM products")
    long countProducts();

    @Select("SELECT COUNT(*) FROM orders")
    long countOrders();

    @Select("SELECT COUNT(*) FROM forum_posts")
    long countForumPosts();

    @Select("SELECT COUNT(*) FROM products WHERE DATE(created_at) = CURDATE()")
    long countTodayNewProducts();

    @Select("SELECT COUNT(*) FROM forum_posts WHERE DATE(created_at) = CURDATE()")
    long countTodayNewPosts();

    // ==================== 用户管理 ====================

    /**
     * 分页查询用户列表（联表 users + userinfo，取用户名、邮箱、角色、状态、注册时间、最后登录）
     */
    @Select("""
            SELECT u.user_id AS id,
                   u.username AS username,
                   u.email AS email,
                   u.role AS role,
                   u.status AS status,
                   u.created_at AS createdAt,
                   u.last_login_at AS lastLoginAt
            FROM users u
            WHERE (u.is_deleted IS NULL OR u.is_deleted = 0)
            ORDER BY u.user_id DESC
            LIMIT #{offset}, #{pageSize}
            """)
    List<AdminDto.AdminUserItem> listUsers(@Param("offset") int offset, @Param("pageSize") int pageSize);

    @Select("SELECT COUNT(*) FROM users WHERE (is_deleted IS NULL OR is_deleted = 0)")
    long countListUsers();

    /** 启用/禁用用户（status: 0-禁用, 1-正常） */
    @Update("UPDATE users SET status = #{status} WHERE user_id = #{userId}")
    int updateUserStatus(@Param("userId") Integer userId, @Param("status") Integer status);

    // ==================== 商品管理 ====================

    /**
     * 管理员商品列表（含被下架商品，普通列表会过滤 admin_offline=0）
     */
    @Select("""
            SELECT p.pro_id AS id,
                   p.pro_name AS title,
                   p.price AS price,
                   p.category AS category,
                   ui.nickname AS sellerName,
                   p.saler_id AS sellerId,
                   CASE WHEN p.is_seal = 1 THEN '已售' ELSE '在售' END AS status,
                   p.admin_offline AS adminOffline,
                   p.picture AS picture,
                   p.created_at AS createdAt
            FROM products p
            LEFT JOIN userinfo ui ON ui.user_id = p.saler_id
            ORDER BY p.pro_id DESC
            LIMIT #{offset}, #{pageSize}
            """)
    List<AdminDto.AdminProductItem> listProducts(@Param("offset") int offset, @Param("pageSize") int pageSize);

    @Select("SELECT COUNT(*) FROM products")
    long countListProducts();

    // ==================== 订单管理 ====================

    /**
     * 订单列表（联表买家/卖家/商品），seller_id 可能为 NULL 故使用 LEFT JOIN
     */
    @Select("""
            SELECT o.id AS id,
                   o.user_id AS buyerId,
                   buyer.nickname AS buyerName,
                   o.seller_id AS sellerId,
                   seller.nickname AS sellerName,
                   o.product_id AS productId,
                   p.pro_name AS productTitle,
                   o.total_price AS totalPrice,
                   o.status AS status,
                   o.created_at AS createdAt
            FROM orders o
            LEFT JOIN userinfo buyer ON buyer.user_id = o.user_id
            LEFT JOIN userinfo seller ON seller.user_id = o.seller_id
            LEFT JOIN products p ON p.pro_id = o.product_id
            ORDER BY o.created_at DESC
            LIMIT #{offset}, #{pageSize}
            """)
    List<AdminDto.AdminOrderItem> listOrders(@Param("offset") int offset, @Param("pageSize") int pageSize);

    @Select("SELECT COUNT(*) FROM orders")
    long countListOrders();

    // ==================== 论坛帖管理 ====================

    /**
     * 帖子管理列表（含已隐藏，按 is_deleted 判断是否隐藏）
     */
    @Select("""
            SELECT fp.id AS id,
                   fp.title AS title,
                   fp.post_type AS postType,
                   fp.category AS category,
                   fp.user_id AS userId,
                   ui.nickname AS userNickname,
                   fp.view_count AS viewCount,
                   fp.like_count AS likeCount,
                   fp.comment_count AS commentCount,
                   fp.is_deleted AS hidden,
                   fp.created_at AS createdAt
            FROM forum_posts fp
            LEFT JOIN userinfo ui ON ui.user_id = fp.user_id
            ORDER BY fp.id DESC
            LIMIT #{offset}, #{pageSize}
            """)
    List<AdminDto.AdminForumPostItem> listForumPosts(@Param("offset") int offset, @Param("pageSize") int pageSize);

    @Select("SELECT COUNT(*) FROM forum_posts")
    long countListForumPosts();
}