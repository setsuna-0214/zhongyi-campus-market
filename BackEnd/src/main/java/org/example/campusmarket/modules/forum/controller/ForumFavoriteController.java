package org.example.campusmarket.modules.forum.controller;

import lombok.RequiredArgsConstructor;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.modules.forum.dto.ForumFavoriteDto;
import org.example.campusmarket.modules.forum.service.ForumFavoriteService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 论坛帖子收藏 Controller
 * 路由：/forum/favorites/**
 */
@RestController
@RequestMapping("/forum/favorites")
@RequiredArgsConstructor
public class ForumFavoriteController {

    private final ForumFavoriteService favoriteService;

    /**
     * 获取当前用户收藏的帖子列表（需要认证）
     * GET /forum/favorites
     */
    @GetMapping
    public Result getFavorites(Authentication auth) {
        Integer userId = (Integer) auth.getPrincipal();
        List<ForumFavoriteDto.FavoritePostItem> items = favoriteService.getFavoritesByUserId(userId);
        return new Result(200, "操作成功", items);
    }

    /**
     * 收藏帖子（需要认证）
     * POST /forum/favorites/{postId}
     */
    @PostMapping("/{postId}")
    public Result addFavorite(@PathVariable Long postId, Authentication auth) {
        Integer userId = (Integer) auth.getPrincipal();
        ForumFavoriteDto.FavoriteStatus status = favoriteService.addFavorite(userId, postId);
        return new Result(200, "收藏成功", status);
    }

    /**
     * 取消收藏帖子（需要认证）
     * DELETE /forum/favorites/{postId}
     */
    @DeleteMapping("/{postId}")
    public Result removeFavorite(@PathVariable Long postId, Authentication auth) {
        Integer userId = (Integer) auth.getPrincipal();
        ForumFavoriteDto.FavoriteStatus status = favoriteService.removeFavorite(userId, postId);
        return new Result(200, "取消收藏成功", status);
    }

    /**
     * 查询帖子收藏状态（需要认证）
     * GET /forum/favorites/status/{postId}
     */
    @GetMapping("/status/{postId}")
    public Result getFavoriteStatus(@PathVariable Long postId, Authentication auth) {
        Integer userId = (Integer) auth.getPrincipal();
        ForumFavoriteDto.FavoriteStatus status = favoriteService.getFavoriteStatus(userId, postId);
        return new Result(200, "操作成功", status);
    }
}
