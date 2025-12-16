package org.example.campusmarket.Mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.example.campusmarket.entity.HomeProductRow;

import java.util.List;

@Mapper
public interface HomeMapper {
    // 根据商品ID列表查询商品信息（用于 Redis 热门排行榜）
    // ids：商品ID列表
    // 返回按传入ID顺序排列的商品列表
    @Select("""
    <script>
    SELECT p.pro_id AS id,
           p.pro_name AS title,
           p.picture AS image,
           p.price AS price,
           ui.nickname AS seller,
           ui.address AS location,
           p.category AS category,
           CASE WHEN p.is_seal THEN '已售' ELSE '在售' END AS status,
           COALESCE(p.view_count, 0) AS views
    FROM products p
    LEFT JOIN userinfo ui ON ui.user_id = p.saler_id
    WHERE p.pro_id IN
    <foreach item="id" collection="ids" open="(" separator="," close=")">
        #{id}
    </foreach>
    </script>
    """)
    List<HomeProductRow> findByIds(@Param("ids") List<Integer> ids);

    // 查询热门商品列表
    // limit：返回条目数量上限
    // 逻辑说明：
    // - 选取商品基础字段（id/title/image/price）
    // - 关联 userinfo 获取卖家昵称与地址
    // - 统计 fav_products 与 buy_products 的数量作为 views（热度）
    // - 依据 views 从高到低排序，次序用 pro_id 兜底，限制返回条目数
    @Select("""
    SELECT p.pro_id AS id,
           p.pro_name AS title,
           p.picture AS image,
           p.price AS price,
           ui.nickname AS seller,
           ui.address AS location,
           NULL AS category,
           CASE WHEN p.is_seal THEN '已售' ELSE '在售' END AS status,
           COALESCE(f.cnt,0) + COALESCE(b.cnt,0) AS views
    FROM products p
    LEFT JOIN (
        SELECT pro_id, COUNT(*) AS cnt FROM fav_products GROUP BY pro_id
    ) f ON f.pro_id = p.pro_id
    LEFT JOIN (
        SELECT pro_id, COUNT(*) AS cnt FROM buy_products GROUP BY pro_id
    ) b ON b.pro_id = p.pro_id
    LEFT JOIN userinfo ui ON ui.user_id = p.saler_id
    ORDER BY views DESC, p.pro_id DESC
    LIMIT #{limit}
    """)
    List<HomeProductRow> listHot(@Param("limit") Integer limit);

    // 查询最新发布商品列表
    // limit：返回条目数量上限
    // 逻辑说明：
    // - 字段同上，但改为按 pro_id 倒序（假设 pro_id 越新越大）
    @Select("""
    SELECT p.pro_id AS id,
           p.pro_name AS title,
           p.picture AS image,
           p.price AS price,
           ui.nickname AS seller,
           ui.address AS location,
           NULL AS category,
           CASE WHEN p.is_seal THEN '已售' ELSE '在售' END AS status,
           COALESCE(f.cnt,0) + COALESCE(b.cnt,0) AS views
    FROM products p
    LEFT JOIN (
        SELECT pro_id, COUNT(*) AS cnt FROM fav_products GROUP BY pro_id
    ) f ON f.pro_id = p.pro_id
    LEFT JOIN (
        SELECT pro_id, COUNT(*) AS cnt FROM buy_products GROUP BY pro_id
    ) b ON b.pro_id = p.pro_id
    LEFT JOIN userinfo ui ON ui.user_id = p.saler_id
    ORDER BY p.pro_id DESC
    LIMIT #{limit}
    """)
    List<HomeProductRow> listLatest(@Param("limit") Integer limit);
}