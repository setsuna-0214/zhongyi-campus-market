package org.example.campusmarket.modules.want.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.example.campusmarket.modules.want.dto.WantDto;

import java.util.List;
import java.util.Map;

/**
 * 求购模块复杂查询 Mapper
 * 列表分页、商品候选集、商品详情关联求购等在这里实现。
 */
@Mapper
public interface WantMapper {

    @Select("""
            <script>
            SELECT wr.id AS id,
                   wr.user_id AS userId,
                   COALESCE(ui.nickname, ui.username, '匿名用户') AS username,
                   wr.title AS title,
                   wr.description AS description,
                   wr.category AS category,
                   wr.min_price AS minPrice,
                   wr.max_price AS maxPrice,
                   wr.keywords AS keywords,
                   wr.expected_condition AS expectedCondition,
                   wr.urgency AS urgency,
                   wr.status AS status,
                   wr.created_at AS createdAt,
                   wr.updated_at AS updatedAt
            FROM want_requests wr
            LEFT JOIN userinfo ui ON ui.user_id = wr.user_id
            <where>
                <if test='category != null and category != ""'>AND wr.category = #{category}</if>
                <if test='status != null and status != ""'>AND wr.status = #{status}</if>
                <if test='keyword != null and keyword != ""'>
                    AND (wr.title LIKE CONCAT('%', #{keyword}, '%')
                    OR wr.description LIKE CONCAT('%', #{keyword}, '%')
                    OR wr.keywords LIKE CONCAT('%', #{keyword}, '%'))
                </if>
                <if test='userId != null'>AND wr.user_id = #{userId}</if>
            </where>
            ORDER BY wr.created_at DESC
            LIMIT #{limit} OFFSET #{offset}
            </script>
            """)
    List<WantDto.WantItem> searchWants(@Param("category") String category,
                                       @Param("status") String status,
                                       @Param("keyword") String keyword,
                                       @Param("userId") Integer userId,
                                       @Param("offset") int offset,
                                       @Param("limit") int limit);

    @Select("""
            <script>
            SELECT COUNT(*)
            FROM want_requests wr
            <where>
                <if test='category != null and category != ""'>AND wr.category = #{category}</if>
                <if test='status != null and status != ""'>AND wr.status = #{status}</if>
                <if test='keyword != null and keyword != ""'>
                    AND (wr.title LIKE CONCAT('%', #{keyword}, '%')
                    OR wr.description LIKE CONCAT('%', #{keyword}, '%')
                    OR wr.keywords LIKE CONCAT('%', #{keyword}, '%'))
                </if>
                <if test='userId != null'>AND wr.user_id = #{userId}</if>
            </where>
            </script>
            """)
    long countWants(@Param("category") String category,
                    @Param("status") String status,
                    @Param("keyword") String keyword,
                    @Param("userId") Integer userId);

    @Select("""
            SELECT wr.id AS id,
                   wr.user_id AS userId,
                   COALESCE(ui.nickname, ui.username, '匿名用户') AS username,
                   wr.title AS title,
                   wr.description AS description,
                   wr.category AS category,
                   wr.min_price AS minPrice,
                   wr.max_price AS maxPrice,
                   wr.keywords AS keywords,
                   wr.expected_condition AS expectedCondition,
                   wr.urgency AS urgency,
                   wr.status AS status,
                   wr.created_at AS createdAt,
                   wr.updated_at AS updatedAt
            FROM want_requests wr
            LEFT JOIN userinfo ui ON ui.user_id = wr.user_id
            WHERE wr.id = #{id}
            """)
    WantDto.WantItem getWantDetail(@Param("id") Long id);

    /**
     * 获取匹配候选商品：仅未售出、未被管理员下架的商品。
     * 价格和分类不过早过滤太狠，让匹配算法自己算分，更适合少数据演示。
     */
    @Select("""
            SELECT p.pro_id AS productId,
                   p.pro_name AS title,
                   p.picture AS picture,
                   p.category AS category,
                   p.price AS price,
                   p.saler_id AS sellerId,
                   COALESCE(ui.nickname, ui.username, '卖家') AS sellerName,
                   p.discription AS description,
                   p.is_seal AS isSeal,
                   p.admin_offline AS adminOffline
            FROM products p
            LEFT JOIN userinfo ui ON ui.user_id = p.saler_id
            WHERE p.is_seal = 0 AND p.admin_offline = 0
            ORDER BY p.created_at DESC
            """)
    List<Map<String, Object>> listMatchCandidates();

    /** 商品详情页关联求购：根据商品类目 + 关键词做轻量相关查询 */
    @Select("""
            <script>
            SELECT wr.id AS id,
                   wr.user_id AS userId,
                   COALESCE(ui.nickname, ui.username, '匿名用户') AS username,
                   wr.title AS title,
                   wr.description AS description,
                   wr.category AS category,
                   wr.min_price AS minPrice,
                   wr.max_price AS maxPrice,
                   wr.keywords AS keywords,
                   wr.expected_condition AS expectedCondition,
                   wr.urgency AS urgency,
                   wr.status AS status,
                   wr.created_at AS createdAt,
                   wr.updated_at AS updatedAt
            FROM want_requests wr
            LEFT JOIN userinfo ui ON ui.user_id = wr.user_id
            <where>
                wr.status IN ('OPEN', 'MATCHED')
                <if test='category != null and category != ""'>AND wr.category = #{category}</if>
                <if test='keyword != null and keyword != ""'>
                    AND (wr.title LIKE CONCAT('%', #{keyword}, '%')
                    OR wr.description LIKE CONCAT('%', #{keyword}, '%')
                    OR wr.keywords LIKE CONCAT('%', #{keyword}, '%'))
                </if>
            </where>
            ORDER BY wr.created_at DESC
            LIMIT 5
            </script>
            """)
    List<WantDto.WantItem> findRelatedWants(@Param("category") String category,
                                            @Param("keyword") String keyword);

    @Select("""
            SELECT wr.id AS id,
                   wr.user_id AS userId,
                   COALESCE(ui.nickname, ui.username, '匿名用户') AS username,
                   wr.title AS title,
                   wr.category AS category,
                   wr.status AS status,
                   wr.urgency AS urgency,
                   wr.keywords AS keywords,
                   wr.created_at AS createdAt
            FROM want_requests wr
            LEFT JOIN userinfo ui ON ui.user_id = wr.user_id
            ORDER BY wr.created_at DESC
            LIMIT #{offset}, #{pageSize}
            """)
    List<org.example.campusmarket.modules.admin.dto.AdminDto.AdminWantItem> listAdminWants(@Param("offset") int offset,
                                                                                           @Param("pageSize") int pageSize);

    @Select("SELECT COUNT(*) FROM want_requests")
    long countAdminWants();
}