package org.example.campusmarket.modules.forum.controller;

import lombok.RequiredArgsConstructor;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.modules.forum.dto.ForumCommentDto;
import org.example.campusmarket.modules.forum.entity.ForumComment;
import org.example.campusmarket.modules.forum.service.ForumCommentService;
import org.example.campusmarket.modules.forum.service.ForumInteractionService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 论坛评论 Controller
 * 路由：/forum/comments/**
 */
@RestController
@RequestMapping("/forum/comments")
@RequiredArgsConstructor
public class ForumCommentController {

    private final ForumCommentService commentService;
    private final ForumInteractionService interactionService;

    /**
     * 分页获取帖子评论列表（含楼中楼）
     * GET /forum/comments?postId=1&sort=asc&page=1&pageSize=10
     */
    @GetMapping
    public Result getComments(
            @RequestParam Long postId,
            @RequestParam(defaultValue = "asc") String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            Authentication auth) {
        ForumCommentDto.CommentPageResult result = commentService.getComments(postId, sort, page, pageSize);

        // 注入当前用户的点赞状态
        if (auth != null) {
            Integer currentUserId = (Integer) auth.getPrincipal();
            result.getComments().forEach(comment -> {
                comment.setLiked(interactionService.isCommentLiked(comment.getId(), currentUserId));
                if (comment.getReplies() != null) {
                    comment.getReplies().forEach(reply ->
                        reply.setLiked(interactionService.isCommentLiked(reply.getId(), currentUserId)));
                }
            });
        }
        return new Result(200, "操作成功", result);
    }

    /**
     * 发表顶层评论（需要认证）
     * POST /forum/comments
     */
    @PostMapping
    public Result createComment(@RequestBody ForumCommentDto.CreateCommentRequest req, Authentication auth) {
        Integer userId = (Integer) auth.getPrincipal();
        try {
            ForumComment comment = commentService.createComment(userId, req);
            Map<String, Object> data = new HashMap<>();
            data.put("id", comment.getId());
            return new Result(200, "评论成功", data);
        } catch (RuntimeException e) {
            return new Result(400, e.getMessage(), null);
        }
    }

    /**
     * 发表楼中楼回复（需要认证）
     * POST /forum/comments/reply
     */
    @PostMapping("/reply")
    public Result createReply(@RequestBody ForumCommentDto.CreateReplyRequest req, Authentication auth) {
        Integer userId = (Integer) auth.getPrincipal();
        try {
            ForumComment reply = commentService.createReply(userId, req);
            Map<String, Object> data = new HashMap<>();
            data.put("id", reply.getId());
            return new Result(200, "回复成功", data);
        } catch (RuntimeException e) {
            return new Result(400, e.getMessage(), null);
        }
    }

    /**
     * 删除评论（需要认证，仅作者）
     * DELETE /forum/comments/{id}
     */
    @DeleteMapping("/{id}")
    public Result deleteComment(@PathVariable Long id, Authentication auth) {
        Integer userId = (Integer) auth.getPrincipal();
        try {
            commentService.deleteComment(id, userId);
            return new Result(200, "删除成功", null);
        } catch (RuntimeException e) {
            return new Result(400, e.getMessage(), null);
        }
    }

    /**
     * 切换评论点赞状态（需要认证）
     * POST /forum/comments/{id}/like
     */
    @PostMapping("/{id}/like")
    public Result toggleCommentLike(@PathVariable Long id, Authentication auth) {
        Integer userId = (Integer) auth.getPrincipal();
        boolean liked = interactionService.toggleCommentLike(id, userId);
        long likeCount = interactionService.getCommentLikeCount(id);
        Map<String, Object> data = new HashMap<>();
        data.put("liked", liked);
        data.put("likeCount", likeCount);
        return new Result(200, "操作成功", data);
    }
}
