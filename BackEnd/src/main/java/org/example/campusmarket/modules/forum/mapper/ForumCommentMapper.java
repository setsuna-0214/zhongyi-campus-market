package org.example.campusmarket.modules.forum.mapper;

import org.apache.ibatis.annotations.*;
import org.example.campusmarket.config.StringListTypeHandler;
import org.example.campusmarket.modules.forum.dto.ForumCommentDto;

import java.util.List;

/**
 * 论坛评论 MyBatis Mapper
 * 负责树状评论查询（顶层评论 + 楼中楼）
 */
@Mapper
public interface ForumCommentMapper {

    /**
     * 分页查询帖子下的顶层评论列表（含基础用户信息）
     * 楼中楼回复通过 getNestedRepliesByRootId 单独查询
     */
    @Select("""
        <script>
        SELECT
            fc.id,
            fc.post_id as postId,
            fc.user_id as userId,
            COALESCE(ui.nickname, ui.username, '匿名用户') as userNickname,
            ui.avatar as userAvatar,
            fc.content,
            fc.images,
            fc.like_count as likeCount,
            fc.created_at as createdAt
        FROM forum_comments fc
        LEFT JOIN userinfo ui ON fc.user_id = ui.user_id
        WHERE fc.post_id = #{postId}
            AND fc.parent_id IS NULL
            AND fc.is_deleted = 0
        <choose>
            <when test="sort == 'hot'">ORDER BY fc.like_count DESC, fc.created_at ASC</when>
            <when test="sort == 'desc'">ORDER BY fc.created_at DESC</when>
            <otherwise>ORDER BY fc.created_at ASC</otherwise>
        </choose>
        LIMIT #{limit} OFFSET #{offset}
        </script>
    """)
    @Results(id = "commentItemMap", value = {
        @Result(property = "id", column = "id"),
        @Result(property = "postId", column = "postId"),
        @Result(property = "userId", column = "userId"),
        @Result(property = "userNickname", column = "userNickname"),
        @Result(property = "userAvatar", column = "userAvatar"),
        @Result(property = "content", column = "content"),
        @Result(property = "images", column = "images", typeHandler = StringListTypeHandler.class),
        @Result(property = "likeCount", column = "likeCount"),
        @Result(property = "createdAt", column = "createdAt")
    })
    List<ForumCommentDto.CommentItem> getTopLevelComments(
        @Param("postId") Long postId,
        @Param("sort") String sort,
        @Param("offset") int offset,
        @Param("limit") int limit
    );

    /**
     * 统计帖子顶层评论数（用于分页）
     */
    @Select("""
        SELECT COUNT(*)
        FROM forum_comments
        WHERE post_id = #{postId} AND parent_id IS NULL AND is_deleted = 0
    """)
    long countTopLevelComments(@Param("postId") Long postId);

    /**
     * 查询某顶层评论的所有楼中楼回复
     * 按时间正序展示
     */
    @Select("""
        SELECT
            fc.id,
            fc.post_id as postId,
            fc.user_id as userId,
            COALESCE(ui.nickname, ui.username, '匿名用户') as userNickname,
            ui.avatar as userAvatar,
            fc.content,
            fc.parent_id as parentId,
            fc.root_id as rootId,
            fc.reply_to_user_id as replyToUserId,
            COALESCE(rui.nickname, rui.username, '') as replyToUserNickname,
            fc.like_count as likeCount,
            fc.created_at as createdAt
        FROM forum_comments fc
        LEFT JOIN userinfo ui ON fc.user_id = ui.user_id
        LEFT JOIN userinfo rui ON fc.reply_to_user_id = rui.user_id
        WHERE fc.root_id = #{rootId}
            AND fc.parent_id IS NOT NULL
            AND fc.is_deleted = 0
        ORDER BY fc.created_at ASC
    """)
    @Results(id = "replyItemMap", value = {
        @Result(property = "id", column = "id"),
        @Result(property = "postId", column = "postId"),
        @Result(property = "userId", column = "userId"),
        @Result(property = "userNickname", column = "userNickname"),
        @Result(property = "userAvatar", column = "userAvatar"),
        @Result(property = "content", column = "content"),
        @Result(property = "parentId", column = "parentId"),
        @Result(property = "rootId", column = "rootId"),
        @Result(property = "replyToUserId", column = "replyToUserId"),
        @Result(property = "replyToUserNickname", column = "replyToUserNickname"),
        @Result(property = "likeCount", column = "likeCount"),
        @Result(property = "createdAt", column = "createdAt")
    })
    List<ForumCommentDto.ReplyItem> getNestedRepliesByRootId(@Param("rootId") Long rootId);

    /**
     * 批量查询多个顶层评论的楼中楼（减少 N+1 查询）
     */
    @Select("""
        <script>
        SELECT
            fc.id,
            fc.post_id as postId,
            fc.user_id as userId,
            COALESCE(ui.nickname, ui.username, '匿名用户') as userNickname,
            ui.avatar as userAvatar,
            fc.content,
            fc.parent_id as parentId,
            fc.root_id as rootId,
            fc.reply_to_user_id as replyToUserId,
            COALESCE(rui.nickname, rui.username, '') as replyToUserNickname,
            fc.like_count as likeCount,
            fc.created_at as createdAt
        FROM forum_comments fc
        LEFT JOIN userinfo ui ON fc.user_id = ui.user_id
        LEFT JOIN userinfo rui ON fc.reply_to_user_id = rui.user_id
        WHERE fc.root_id IN
            <foreach item="rootId" collection="rootIds" open="(" separator="," close=")">
                #{rootId}
            </foreach>
            AND fc.parent_id IS NOT NULL
            AND fc.is_deleted = 0
        ORDER BY fc.root_id, fc.created_at ASC
        </script>
    """)
    @ResultMap("replyItemMap")
    List<ForumCommentDto.ReplyItem> getBatchNestedReplies(@Param("rootIds") List<Long> rootIds);
}
