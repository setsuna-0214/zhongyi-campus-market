package org.example.campusmarket.modules.forum.mapper;

import org.apache.ibatis.annotations.*;
import org.example.campusmarket.config.StringListTypeHandler;
import org.example.campusmarket.modules.forum.dto.ForumPostDto;

import java.util.List;

/**
 * 论坛帖子 MyBatis Mapper
 * 负责帖子列表的多条件动态 SQL 分页查询（复杂查询）
 */
@Mapper
public interface ForumPostMapper {

    /**
     * 多条件动态 SQL 分页查询帖子列表
     * 支持：帖子类型筛选、排序（时间/热度）
     * 关联 userinfo 表获取用户昵称和头像
     */
    @Select("""
        <script>
        SELECT
            fp.id,
            fp.user_id as userId,
            COALESCE(ui.nickname, ui.username, '匿名用户') as userNickname,
            ui.avatar as userAvatar,
            fp.title,
            LEFT(fp.content, 200) as summary,
            fp.post_type as postType,
            fp.images,
            fp.view_count as viewCount,
            fp.like_count as likeCount,
            fp.comment_count as commentCount,
            fp.share_count as shareCount,
            fp.created_at as createdAt
        FROM forum_posts fp
        LEFT JOIN userinfo ui ON fp.user_id = ui.user_id
        <where>
            fp.is_deleted = 0
            <if test="postType != null and postType != '' and postType != 'all'">
                AND fp.post_type = #{postType}
            </if>
            <if test="keyword != null and keyword != ''">
                AND (fp.title LIKE CONCAT('%', #{keyword}, '%')
                    OR fp.content LIKE CONCAT('%', #{keyword}, '%'))
            </if>
            <if test="userId != null">
                AND fp.user_id = #{userId}
            </if>
        </where>
        <choose>
            <when test="sort == 'hot'">ORDER BY (fp.like_count * 2 + fp.view_count + fp.comment_count * 3) DESC, fp.created_at DESC</when>
            <when test="sort == 'views'">ORDER BY fp.view_count DESC, fp.created_at DESC</when>
            <otherwise>ORDER BY fp.created_at DESC</otherwise>
        </choose>
        LIMIT #{limit} OFFSET #{offset}
        </script>
    """)
    @Results(id = "postListItemMap", value = {
        @Result(property = "id", column = "id"),
        @Result(property = "userId", column = "userId"),
        @Result(property = "userNickname", column = "userNickname"),
        @Result(property = "userAvatar", column = "userAvatar"),
        @Result(property = "title", column = "title"),
        @Result(property = "summary", column = "summary"),
        @Result(property = "postType", column = "postType"),
        @Result(property = "images", column = "images", typeHandler = StringListTypeHandler.class),
        @Result(property = "viewCount", column = "viewCount"),
        @Result(property = "likeCount", column = "likeCount"),
        @Result(property = "commentCount", column = "commentCount"),
        @Result(property = "shareCount", column = "shareCount"),
        @Result(property = "createdAt", column = "createdAt")
    })
    List<ForumPostDto.PostListItem> searchPosts(
        @Param("postType") String postType,
        @Param("keyword") String keyword,
        @Param("userId") Integer userId,
        @Param("sort") String sort,
        @Param("offset") int offset,
        @Param("limit") int limit
    );

    /**
     * 统计符合条件的帖子总数（用于分页计算）
     */
    @Select("""
        <script>
        SELECT COUNT(*)
        FROM forum_posts fp
        <where>
            fp.is_deleted = 0
            <if test="postType != null and postType != '' and postType != 'all'">
                AND fp.post_type = #{postType}
            </if>
            <if test="keyword != null and keyword != ''">
                AND (fp.title LIKE CONCAT('%', #{keyword}, '%')
                    OR fp.content LIKE CONCAT('%', #{keyword}, '%'))
            </if>
            <if test="userId != null">
                AND fp.user_id = #{userId}
            </if>
        </where>
        </script>
    """)
    long countPosts(
        @Param("postType") String postType,
        @Param("keyword") String keyword,
        @Param("userId") Integer userId
    );

    /**
     * 查询帖子详情（含发帖用户信息）
     */
    @Select("""
        SELECT
            fp.id,
            fp.user_id as userId,
            COALESCE(ui.nickname, ui.username, '匿名用户') as userNickname,
            ui.avatar as userAvatar,
            fp.title,
            fp.content,
            fp.post_type as postType,
            fp.images,
            fp.view_count as viewCount,
            fp.like_count as likeCount,
            fp.comment_count as commentCount,
            fp.share_count as shareCount,
            fp.created_at as createdAt,
            fp.updated_at as updatedAt
        FROM forum_posts fp
        LEFT JOIN userinfo ui ON fp.user_id = ui.user_id
        WHERE fp.id = #{id} AND fp.is_deleted = 0
    """)
    @Results(id = "postDetailMap", value = {
        @Result(property = "id", column = "id"),
        @Result(property = "userId", column = "userId"),
        @Result(property = "userNickname", column = "userNickname"),
        @Result(property = "userAvatar", column = "userAvatar"),
        @Result(property = "title", column = "title"),
        @Result(property = "content", column = "content"),
        @Result(property = "postType", column = "postType"),
        @Result(property = "images", column = "images", typeHandler = StringListTypeHandler.class),
        @Result(property = "viewCount", column = "viewCount"),
        @Result(property = "likeCount", column = "likeCount"),
        @Result(property = "commentCount", column = "commentCount"),
        @Result(property = "shareCount", column = "shareCount"),
        @Result(property = "createdAt", column = "createdAt"),
        @Result(property = "updatedAt", column = "updatedAt")
    })
    ForumPostDto.PostDetail getPostDetail(@Param("id") Long id);

    /**
     * 获取某用户发布的帖子（用于个人中心和他人主页）
     */
    @Select("""
        SELECT
            fp.id,
            fp.user_id as userId,
            COALESCE(ui.nickname, ui.username, '匿名用户') as userNickname,
            ui.avatar as userAvatar,
            fp.title,
            LEFT(fp.content, 200) as summary,
            fp.post_type as postType,
            fp.images,
            fp.view_count as viewCount,
            fp.like_count as likeCount,
            fp.comment_count as commentCount,
            fp.share_count as shareCount,
            fp.created_at as createdAt
        FROM forum_posts fp
        LEFT JOIN userinfo ui ON fp.user_id = ui.user_id
        WHERE fp.user_id = #{userId} AND fp.is_deleted = 0
        ORDER BY fp.created_at DESC
        LIMIT #{limit} OFFSET #{offset}
    """)
    @ResultMap("postListItemMap")
    List<ForumPostDto.PostListItem> getPostsByUserId(
        @Param("userId") Integer userId,
        @Param("offset") int offset,
        @Param("limit") int limit
    );

    /**
     * 统计某用户发布的帖子数
     */
    @Select("SELECT COUNT(*) FROM forum_posts WHERE user_id = #{userId} AND is_deleted = 0")
    long countPostsByUserId(@Param("userId") Integer userId);

    /**
     * 查询用户收藏的帖子列表（关联 forum_favorites）
     */
    @Select("""
        SELECT
            ff.id as favoriteId,
            fp.id as postId,
            fp.title,
            fp.post_type as postType,
            fp.images,
            fp.comment_count as commentCount,
            fp.like_count as likeCount,
            COALESCE(ui.nickname, ui.username, '匿名用户') as authorNickname,
            ui.avatar as authorAvatar,
            fp.created_at as postCreatedAt,
            ff.created_at as favoritedAt
        FROM forum_favorites ff
        JOIN forum_posts fp ON ff.post_id = fp.id AND fp.is_deleted = 0
        LEFT JOIN userinfo ui ON fp.user_id = ui.user_id
        WHERE ff.user_id = #{userId}
        ORDER BY ff.created_at DESC
    """)
    @Results(id = "favoritePostItemMap", value = {
        @Result(property = "favoriteId", column = "favoriteId"),
        @Result(property = "postId", column = "postId"),
        @Result(property = "title", column = "title"),
        @Result(property = "postType", column = "postType"),
        @Result(property = "images", column = "images", typeHandler = StringListTypeHandler.class),
        @Result(property = "commentCount", column = "commentCount"),
        @Result(property = "likeCount", column = "likeCount"),
        @Result(property = "authorNickname", column = "authorNickname"),
        @Result(property = "authorAvatar", column = "authorAvatar"),
        @Result(property = "postCreatedAt", column = "postCreatedAt"),
        @Result(property = "favoritedAt", column = "favoritedAt")
    })
    List<org.example.campusmarket.modules.forum.dto.ForumFavoriteDto.FavoritePostItem> getFavoritePostsByUserId(
        @Param("userId") Integer userId
    );
}
