package org.example.campusmarket.Controller;

import org.example.campusmarket.Service.UserService;
import org.example.campusmarket.entity.Product;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.entity.UserInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

/**
 * 公开的用户信息接口（查看其他用户）
 * 路径: /users/{id}
 */
@RestController
@RequestMapping("/users")
public class UsersController {

    @Autowired
    private UserService userService;

    /**
     * 获取指定用户的公开信息
     * GET /users/{id}
     */
    @GetMapping("/{id}")
    public Result getUserById(@PathVariable("id") Integer userId) {
        try {
            UserInfo userInfo = userService.GetUserInfoById(userId);
            if (userInfo == null) {
                return new Result(404, "用户不存在", null);
            }
            return new Result(200, "成功", userInfo);
        } catch (Exception e) {
            return new Result(500, "查询失败", null);
        }
    }

    /**
     * 获取指定用户发布的商品列表
     * GET /users/{id}/published
     */
    @GetMapping("/{id}/published")
    public Result getUserPublished(@PathVariable("id") Integer userId) {
        try {
            List<Product> items = userService.GetPublishedProducts(userId);
            return new Result(200, "成功", items == null ? Collections.emptyList() : items);
        } catch (Exception e) {
            return new Result(500, "查询失败", null);
        }
    }
}
