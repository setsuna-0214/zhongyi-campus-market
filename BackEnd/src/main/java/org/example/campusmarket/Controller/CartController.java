package org.example.campusmarket.Controller;

import org.example.campusmarket.DTO.CartDto;
import org.example.campusmarket.Service.CartService;
import org.example.campusmarket.entity.Result;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cart")
public class CartController {
    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }


    //添加物品进入购物车
    @PostMapping
    public Result addToCart(@RequestBody CartDto.AddRequest request, Authentication authentication) {
        Integer userId = (Integer) authentication.getPrincipal();
        if (request == null || request.getProductId() == null || request.getQuantity() == null || request.getQuantity() <= 0) {
            return new Result(400, "参数不合法", null);
        }
        boolean ok = cartService.AddToCart(userId, request.getProductId(), request.getQuantity());
        if (ok) {
            return new Result(200, "添加到购物车成功", true);
        } else {
            return new Result(500, "添加到购物车失败", false);
        }
    }

    //批量加入购物车
    @PostMapping("/batch")
    public Result batchAddToCart(@RequestBody CartDto.BatchAddRequest request, Authentication authentication) {
        Integer userId = (Integer) authentication.getPrincipal();
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return new Result(400, "参数不合法", null);
        }
        boolean ok = cartService.BatchAddToCart(userId, request.getItems());
        if (ok) {
            return new Result(200, "批量添加到购物车成功", true);
        } else {
            return new Result(500, "批量添加到购物车失败", false);
        }
    }
}