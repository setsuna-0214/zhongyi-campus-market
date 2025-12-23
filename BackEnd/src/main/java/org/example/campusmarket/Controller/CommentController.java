package org.example.campusmarket.Controller;

import org.example.campusmarket.Service.CommentService;
import org.example.campusmarket.entity.Comment;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.util.TokenUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    // 从Authorization header中提取token并获取userId
    private Integer getUserIdFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        return TokenUtil.GetUserFromToken(token);
    }

    // 获取商品的所有评论
    @GetMapping("/product/{productId}")
    public Result getComments(@PathVariable Integer productId) {
        try {
            List<Comment> comments = commentService.getCommentsByProductId(productId);
            return new Result(200, "success", comments);
        } catch (Exception e) {
            return new Result(500, "获取评论失败: " + e.getMessage(), null);
        }
    }

    // 添加评论
    @PostMapping("/product/{productId}")
    public Result addComment(
            @PathVariable Integer productId,
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String authHeader) {
        try {
            Integer userId = getUserIdFromHeader(authHeader);
            if (userId == null) {
                return new Result(401, "请先登录", null);
            }

            String content = body.get("content");
            Comment comment = commentService.addComment(productId, userId, content);
            return new Result(200, "success", comment);
        } catch (IllegalArgumentException e) {
            return new Result(400, e.getMessage(), null);
        } catch (Exception e) {
            return new Result(500, "添加评论失败: " + e.getMessage(), null);
        }
    }

    // 删除评论
    @DeleteMapping("/{commentId}")
    public Result deleteComment(
            @PathVariable Integer commentId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            Integer userId = getUserIdFromHeader(authHeader);
            if (userId == null) {
                return new Result(401, "请先登录", null);
            }

            commentService.deleteComment(commentId, userId);
            return new Result(200, "删除成功", null);
        } catch (IllegalArgumentException e) {
            return new Result(400, e.getMessage(), null);
        } catch (Exception e) {
            return new Result(500, "删除评论失败: " + e.getMessage(), null);
        }
    }
}
