package org.example.campusmarket.Mapper;

import org.apache.ibatis.annotations.*;
import org.example.campusmarket.DTO.ProductDto;
import org.example.campusmarket.entity.Product;

import java.util.List;

@Mapper
public interface ProductMapper {
    // 根据ID查询商品基本信息
    @Select("SELECT pro_id, pro_name, price, picture, is_seal, saler_id FROM products WHERE pro_id = #{id}")
    Product findProductBasicById(@Param("id") Integer id);
    
    // 更新商品状态（锁定/解锁）
    @Update("UPDATE products SET is_seal = #{isSeal} WHERE pro_id = #{productId}")
    int updateProductStatus(@Param("productId") Integer productId, @Param("isSeal") boolean isSeal);

    // 综合搜索商品列表
    // 支持多条件过滤：关键词、分类、位置、状态、价格范围
    // 支持多种排序方式：最新、价格升降序、热度
    @Select("""
        <script>
        SELECT 
            p.pro_id as id,
            p.pro_name as title,
            p.price,
            p.price as originalPrice,
            p.picture as tempImage,
            p.category,
            NULL as "condition",
            ui.address as location,
            p.created_at as publishTime,
            p.discription as description,
            CASE WHEN p.is_seal = 1 THEN '已下架' ELSE '在售' END as status,
            COALESCE(f.cnt,0) + COALESCE(b.cnt,0) as views,
            COALESCE(f.cnt,0) as likes,
            
            ui.user_id as tempSellerId,
            ui.nickname as tempSellerName,
            ui.avatar as tempSellerAvatar,
            4.8 as tempSellerRating
            
        FROM products p
        LEFT JOIN userinfo ui ON p.saler_id = ui.user_id
        LEFT JOIN (SELECT pro_id, COUNT(*) as cnt FROM fav_products GROUP BY pro_id) f ON f.pro_id = p.pro_id
        LEFT JOIN (SELECT pro_id, COUNT(*) as cnt FROM buy_products GROUP BY pro_id) b ON b.pro_id = p.pro_id
        <where>
            <if test="keyword != null and keyword != ''">
                AND (p.pro_name LIKE CONCAT('%', #{keyword}, '%') OR p.discription LIKE CONCAT('%', #{keyword}, '%'))
            </if>
            <if test="category != null and category != ''">
                AND p.category = #{category}
            </if>
            <if test="location != null and location != ''">
                AND ui.address LIKE CONCAT('%', #{location}, '%')
            </if>
            <if test="status != null and status != ''">
                <choose>
                    <when test="status == '在售'">AND p.is_seal = 0</when>
                    <when test="status == '已下架'">AND p.is_seal = 1</when>
                    <!-- '全部' case: do nothing -->
                </choose>
            </if>
            <if test="priceMin != null">
                AND CAST(p.price AS DECIMAL(10,2)) &gt;= #{priceMin}
            </if>
            <if test="priceMax != null">
                AND CAST(p.price AS DECIMAL(10,2)) &lt;= #{priceMax}
            </if>
        </where>
        <choose>
            <when test="sort == 'price-low'">ORDER BY CAST(p.price AS DECIMAL(10,2)) ASC</when>
            <when test="sort == 'price-high'">ORDER BY CAST(p.price AS DECIMAL(10,2)) DESC</when>
            <when test="sort == 'popular'">ORDER BY views DESC</when>
            <otherwise>ORDER BY p.pro_id DESC</otherwise>
        </choose>
        LIMIT #{limit} OFFSET #{offset}
        </script>
    """)
    @Results(id = "productDetailMap", value = {
        @Result(property = "id", column = "id"),
        @Result(property = "title", column = "title"),
        @Result(property = "price", column = "price"),
        @Result(property = "originalPrice", column = "originalPrice"),
        @Result(property = "category", column = "category"),
        @Result(property = "condition", column = "condition"),
        @Result(property = "location", column = "location"),
        @Result(property = "publishTime", column = "publishTime"),
        @Result(property = "description", column = "description"),
        @Result(property = "status", column = "status"),
        @Result(property = "views", column = "views"),
        @Result(property = "likes", column = "likes"),
        @Result(property = "tempImage", column = "tempImage"),
        @Result(property = "tempSellerId", column = "tempSellerId"),
        @Result(property = "tempSellerName", column = "tempSellerName"),
        @Result(property = "tempSellerAvatar", column = "tempSellerAvatar"),
        @Result(property = "tempSellerRating", column = "tempSellerRating")
    })
    List<ProductDto.ProductDetail> searchProducts(
        @Param("keyword") String keyword,
        @Param("category") String category,
        @Param("location") String location,
        @Param("status") String status,
        @Param("priceMin") Double priceMin,
        @Param("priceMax") Double priceMax,
        @Param("sort") String sort,
        @Param("offset") int offset,
        @Param("limit") int limit
    );

    // 统计符合条件的商品总数，用于分页计算
    @Select("""
        <script>
        SELECT COUNT(*)
        FROM products p
        LEFT JOIN userinfo ui ON p.saler_id = ui.user_id
        <where>
            <if test="keyword != null and keyword != ''">
                AND (p.pro_name LIKE CONCAT('%', #{keyword}, '%') OR p.discription LIKE CONCAT('%', #{keyword}, '%'))
            </if>
            <if test="category != null and category != ''">
                AND p.category = #{category}
            </if>
            <if test="location != null and location != ''">
                AND ui.address LIKE CONCAT('%', #{location}, '%')
            </if>
            <if test="status != null and status != ''">
                <choose>
                    <when test="status == '在售'">AND p.is_seal = 0</when>
                    <when test="status == '已下架'">AND p.is_seal = 1</when>
                </choose>
            </if>
            <if test="priceMin != null">
                AND CAST(p.price AS DECIMAL(10,2)) &gt;= #{priceMin}
            </if>
            <if test="priceMax != null">
                AND CAST(p.price AS DECIMAL(10,2)) &lt;= #{priceMax}
            </if>
        </where>
        </script>
    """)
    long countProducts(
        @Param("keyword") String keyword,
        @Param("category") String category,
        @Param("location") String location,
        @Param("status") String status,
        @Param("priceMin") Double priceMin,
        @Param("priceMax") Double priceMax
    );

    // 获取单个商品的详细信息
    // 包含卖家信息、收藏数、购买数等统计数据
    @Select("""
        SELECT 
            p.pro_id as id,
            p.pro_name as title,
            p.price,
            p.price as originalPrice,
            p.picture as tempImage,
            p.category,
            NULL as "condition",
            ui.address as location,
            p.created_at as publishTime,
            p.discription as description,
            CASE WHEN p.is_seal = 1 THEN '已下架' ELSE '在售' END as status,
            COALESCE(f.cnt,0) + COALESCE(b.cnt,0) as views,
            COALESCE(f.cnt,0) as likes,
            ui.user_id as tempSellerId,
            ui.nickname as tempSellerName,
            ui.avatar as tempSellerAvatar,
            4.8 as tempSellerRating
        FROM products p
        LEFT JOIN userinfo ui ON p.saler_id = ui.user_id
        LEFT JOIN (SELECT pro_id, COUNT(*) as cnt FROM fav_products GROUP BY pro_id) f ON f.pro_id = p.pro_id
        LEFT JOIN (SELECT pro_id, COUNT(*) as cnt FROM buy_products GROUP BY pro_id) b ON b.pro_id = p.pro_id
        WHERE p.pro_id = #{id}
    """)
    @ResultMap("productDetailMap")
    ProductDto.ProductDetail getProductDetail(@Param("id") Integer id);
    
    // 获取相关商品推荐
    // 基于同类目推荐，排除当前查看的商品ID
    @Select("""
        SELECT 
            p.pro_id as id,
            p.pro_name as title,
            p.price,
            p.picture as tempImage,
            p.category,
            ui.address as location,
            CASE WHEN p.is_seal = 1 THEN '已下架' ELSE '在售' END as status,
            ui.user_id as tempSellerId,
            ui.nickname as tempSellerName
        FROM products p
        LEFT JOIN userinfo ui ON p.saler_id = ui.user_id
        WHERE p.category = #{category} AND p.pro_id != #{excludeId}
        LIMIT 4
    """)
    @ResultMap("productDetailMap")
    List<ProductDto.ProductDetail> getRelatedProducts(@Param("category") String category, @Param("excludeId") Integer excludeId);

    // 插入新商品
    @Insert("""
        INSERT INTO products (pro_name, price, category, 
                             discription, picture, saler_id, is_seal, created_at)
        VALUES (#{pro_name}, #{price}, '其他', 
                #{discription}, #{picture}, #{saler_id}, 0, NOW())
    """)
    @Options(useGeneratedKeys = true, keyProperty = "pro_id", keyColumn = "pro_id")
    void insertProduct(Product product);

    // 删除商品
    @Delete("DELETE FROM products WHERE pro_id = #{id}")
    void deleteProduct(@Param("id") Integer id);

    // 更新商品信息
    @Update("""
        UPDATE products 
        SET pro_name = #{pro_name}, 
            price = #{price}, 
            discription = #{discription}, 
            picture = #{picture}
        WHERE pro_id = #{pro_id}
    """)
    void updateProduct(Product product);
}
