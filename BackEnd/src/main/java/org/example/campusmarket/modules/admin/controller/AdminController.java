package org.example.campusmarket.modules.admin.controller;

import lombok.RequiredArgsConstructor;
import org.example.campusmarket.Mapper.ProductMapper;
import org.example.campusmarket.modules.admin.dto.AdminDto;
import org.example.campusmarket.modules.admin.mapper.AdminMapper;
import org.example.campusmarket.modules.admin.service.AdminStatisticsService;
import org.example.campusmarket.modules.admin.service.AdminSystemService;
import org.example.campusmarket.modules.forum.service.ForumPostService;
import org.example.campusmarket.modules.want.service.WantService;
import org.example.campusmarket.util.ResultUtil;
import org.example.campusmarket.entity.Result;
import org.springframework.web.bind.annotation.*;

/**
 * 管理员后台统一控制器
 * 所有 /admin/** 接口均由 SecurityConfig 限定 hasRole("ADMIN")，普通用户访问将得到 403。
 * 沿用项目 Result 统一返回结构。
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminStatisticsService statisticsService;
    private final AdminSystemService systemService;
    private final AdminMapper adminMapper;
    private final ProductMapper productMapper;
    private final ForumPostService forumPostService;
    private final WantService wantService;

    // ==================== 首页统计 ====================

    @GetMapping("/statistics")
    public Result getStatistics() {
        return ResultUtil.success(statisticsService.getStatistics());
    }

    // ==================== 系统状态 ====================

    @GetMapping("/system/status")
    public Result getSystemStatus() {
        return ResultUtil.success(systemService.getSystemStatus());
    }

    // ==================== 用户管理 ====================

    @GetMapping("/users")
    public Result listUsers(@RequestParam(defaultValue = "1") int page,
                            @RequestParam(defaultValue = "10") int pageSize) {
        int offset = Math.max((page - 1) * pageSize, 0);
        var items = adminMapper.listUsers(offset, pageSize);
        long total = adminMapper.countListUsers();
        return ResultUtil.success(new AdminDto.PageResult<>(items, total, page, pageSize));
    }

    @PutMapping("/users/{id}/status")
    public Result updateUserStatus(@PathVariable Integer id, @RequestBody AdminDto.UserStatusRequest req) {
        if (req.getStatus() == null || (req.getStatus() != 0 && req.getStatus() != 1)) {
            return ResultUtil.paramError("status 取值仅支持 0(禁用) 或 1(启用)");
        }
        int affected = adminMapper.updateUserStatus(id, req.getStatus());
        if (affected == 0) {
            return ResultUtil.notFound("用户不存在");
        }
        return ResultUtil.success(req.getStatus() == 1 ? "已启用该用户" : "已禁用该用户");
    }

    // ==================== 商品管理 ====================

    @GetMapping("/products")
    public Result listProducts(@RequestParam(defaultValue = "1") int page,
                               @RequestParam(defaultValue = "10") int pageSize) {
        int offset = Math.max((page - 1) * pageSize, 0);
        var items = adminMapper.listProducts(offset, pageSize);
        long total = adminMapper.countListProducts();
        return ResultUtil.success(new AdminDto.PageResult<>(items, total, page, pageSize));
    }

    @PutMapping("/products/{id}/offline")
    public Result offlineProduct(@PathVariable Integer id) {
        int affected = productMapper.offlineProductByAdmin(id);
        if (affected == 0) {
            return ResultUtil.notFound("商品不存在");
        }
        return ResultUtil.success("已下架该商品，普通用户列表将不再展示");
    }

    @PutMapping("/products/{id}/restore")
    public Result restoreProduct(@PathVariable Integer id) {
        int affected = productMapper.restoreProductByAdmin(id);
        if (affected == 0) {
            return ResultUtil.notFound("商品不存在");
        }
        return ResultUtil.success("已恢复该商品上架");
    }

    // ==================== 订单管理 ====================

    @GetMapping("/orders")
    public Result listOrders(@RequestParam(defaultValue = "1") int page,
                             @RequestParam(defaultValue = "10") int pageSize) {
        int offset = Math.max((page - 1) * pageSize, 0);
        var items = adminMapper.listOrders(offset, pageSize);
        long total = adminMapper.countListOrders();
        return ResultUtil.success(new AdminDto.PageResult<>(items, total, page, pageSize));
    }

    // ==================== 论坛帖管理 ====================

    @GetMapping("/forum/posts")
    public Result listForumPosts(@RequestParam(defaultValue = "1") int page,
                                 @RequestParam(defaultValue = "10") int pageSize) {
        int offset = Math.max((page - 1) * pageSize, 0);
        var items = adminMapper.listForumPosts(offset, pageSize);
        long total = adminMapper.countListForumPosts();
        return ResultUtil.success(new AdminDto.PageResult<>(items, total, page, pageSize));
    }

    @PutMapping("/forum/posts/{id}/hide")
    public Result hideForumPost(@PathVariable Long id) {
        forumPostService.adminHidePost(id);
        return ResultUtil.success("已隐藏该帖子");
    }

    @PutMapping("/forum/posts/{id}/restore")
    public Result restoreForumPost(@PathVariable Long id) {
        forumPostService.adminRestorePost(id);
        return ResultUtil.success("已恢复该帖子");
    }

    // ==================== 求购管理 ====================

    @GetMapping("/wants")
    public Result listWants(@RequestParam(defaultValue = "1") int page,
                            @RequestParam(defaultValue = "10") int pageSize) {
        return ResultUtil.success(wantService.adminList(page, pageSize));
    }

    @PutMapping("/wants/{id}/close")
    public Result closeWant(@PathVariable Long id) {
        wantService.adminClose(id);
        return ResultUtil.success("已关闭该求购信息");
    }

    @PutMapping("/wants/{id}/restore")
    public Result restoreWant(@PathVariable Long id) {
        wantService.adminRestore(id);
        return ResultUtil.success("已恢复该求购信息");
    }
}