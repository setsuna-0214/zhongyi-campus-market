package org.example.campusmarket.modules.forum.controller;

import lombok.RequiredArgsConstructor;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.modules.forum.dto.ForumPostDto;
import org.example.campusmarket.modules.forum.entity.ForumPost;
import org.example.campusmarket.modules.forum.service.ForumFavoriteService;
import org.example.campusmarket.modules.forum.service.ForumInteractionService;
import org.example.campusmarket.modules.forum.service.ForumPostService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

/**
 * 论坛帖子 Controller
 * 路由：/forum/posts/**
 */
@RestController
@RequestMapping("/forum/posts")
@RequiredArgsConstructor
public class ForumPostController {

    private final ForumPostService postService;
    private final ForumInteractionService interactionService;
    private final ForumFavoriteService favoriteService;

    /**
     * 分页查询帖子列表
     * GET /forum/posts?type=all&sort=latest&keyword=&page=1&pageSize=10
     */
    @GetMapping
    public Result getPosts(
            @RequestParam(defaultValue = "all") String type,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer userId,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            Authentication auth) {
        ForumPostDto.PostPageResult result = postService.searchPosts(type, keyword, userId, sort, page, pageSize);

        // 若已登录，注入点赞/收藏状态
        if (auth != null) {
            Integer currentUserId = (Integer) auth.getPrincipal();
            result.getPosts().forEach(post -> {
                post.setLiked(interactionService.isPostLiked(post.getId(), currentUserId));
                post.setFavorited(favoriteService.getFavoriteStatus(currentUserId, post.getId()).isFavorited());
            });
        }
        return new Result(200, "操作成功", result);
    }

    /**
     * 获取帖子详情
     * GET /forum/posts/{id}
     */
    @GetMapping("/{id}")
    public Result getPostDetail(@PathVariable Long id,
                                Authentication auth,
                                HttpServletRequest request) {
        ForumPostDto.PostDetail detail = postService.getPostDetail(id);
        if (detail == null) {
            return new Result(404, "帖子不存在", null);
        }

        // 构建访客标识：已登录用户用 u:{userId}，未登录用客户端 IP
        String visitorId;
        if (auth != null) {
            visitorId = "u:" + auth.getPrincipal();
        } else {
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getRemoteAddr();
            } else {
                ip = ip.split(",")[0].trim(); // 只取第一个真实 IP
            }
            visitorId = "ip:" + ip;
        }

        // 浏览量去重计数
        long viewCount = interactionService.incrementPostView(id, visitorId);
        detail.setViewCount((int) viewCount);

        // 注入实时点赞数
        long likeCount = interactionService.getPostLikeCount(id);
        detail.setLikeCount((int) likeCount);

        // 若已登录，注入状态
        if (auth != null) {
            Integer currentUserId = (Integer) auth.getPrincipal();
            detail.setLiked(interactionService.isPostLiked(id, currentUserId));
            detail.setFavorited(favoriteService.getFavoriteStatus(currentUserId, id).isFavorited());
        }
        return new Result(200, "操作成功", detail);
    }

    /**
     * 发布帖子（需要认证）
     * POST /forum/posts
     */
    @PostMapping
    public Result createPost(@RequestBody ForumPostDto.CreatePostRequest req, Authentication auth) {
        Integer userId = (Integer) auth.getPrincipal();
        ForumPost post = postService.createPost(userId, req);
        Map<String, Object> data = new HashMap<>();
        data.put("id", post.getId());
        return new Result(200, "发布成功", data);
    }

    /**
     * 编辑帖子（需要认证，仅作者）
     * PUT /forum/posts/{id}
     */
    @PutMapping("/{id}")
    public Result updatePost(@PathVariable Long id,
                              @RequestBody ForumPostDto.UpdatePostRequest req,
                              Authentication auth) {
        Integer userId = (Integer) auth.getPrincipal();
        try {
            postService.updatePost(id, userId, req);
            return new Result(200, "更新成功", null);
        } catch (RuntimeException e) {
            return new Result(400, e.getMessage(), null);
        }
    }

    /**
     * 删除帖子（需要认证，仅作者）
     * DELETE /forum/posts/{id}
     */
    @DeleteMapping("/{id}")
    public Result deletePost(@PathVariable Long id, Authentication auth) {
        Integer userId = (Integer) auth.getPrincipal();
        try {
            postService.deletePost(id, userId);
            return new Result(200, "删除成功", null);
        } catch (RuntimeException e) {
            return new Result(400, e.getMessage(), null);
        }
    }

    /**
     * 切换点赞状态（需要认证）
     * POST /forum/posts/{id}/like
     */
    @PostMapping("/{id}/like")
    public Result toggleLike(@PathVariable Long id, Authentication auth) {
        Integer userId = (Integer) auth.getPrincipal();
        boolean liked = interactionService.togglePostLike(id, userId);
        long likeCount = interactionService.getPostLikeCount(id);
        Map<String, Object> data = new HashMap<>();
        data.put("liked", liked);
        data.put("likeCount", likeCount);
        return new Result(200, "操作成功", data);
    }

    /**
     * 获取某用户发布的帖子（用于他人主页和个人中心）
     * GET /forum/posts/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public Result getPostsByUser(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        return new Result(200, "操作成功", postService.getPostsByUserId(userId, page, pageSize));
    }
}
