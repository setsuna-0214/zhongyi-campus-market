package org.example.campusmarket.Controller;

import org.example.campusmarket.DTO.OrderDto;
import org.example.campusmarket.Service.OrdersService;
import org.example.campusmarket.entity.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/orders")

public class OrdersController {

    @Autowired
    private OrdersService ordersService;

    @Autowired
    private org.example.campusmarket.Service.ImageService imageService;

    /**
     * 查询当前用户订单列表（支持可选过滤）。
     * @param status       可选订单状态（pending/completed/cancelled），为空则不按状态过滤
     * @param keyword      可选关键词，匹配商品名或描述，为空则不按关键词过滤
     * @param startDate    可选起始时间（字符串），为空则不设时间下限
     * @param endDate      可选结束时间（字符串），为空则不设时间上限
     * @param authentication 当前认证上下文，用于获取当前用户的 userId
     * @return Result，data 为 List<OrderDto.Response>
     */
    @GetMapping
    public Result getOrderList(@RequestParam(value = "status", required = false) String status,
                       @RequestParam(value = "keyword", required = false) String keyword,
                       @RequestParam(value = "startDate", required = false) String startDate,
                       @RequestParam(value = "endDate", required = false) String endDate,
                       Authentication authentication) {
        Integer userId = (Integer) authentication.getPrincipal();
        List<OrderDto.Response> items = ordersService.getOrderList(userId, status, keyword, startDate, endDate);
        return new Result(200, "成功", items);
    }


    // 创建订单
    @PostMapping
    public Result createOrder(@RequestBody OrderDto.CreateRequest req, Authentication authentication) {
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            OrderDto.Response created = ordersService.createOrder(userId, req);
            if (created == null) return new Result(400, "创建订单失败", null);
            return new Result(200, "创建订单成功", created);
        } catch (IllegalArgumentException e) {
            return new Result(400, e.getMessage(), null);
        } catch (Exception e) {
            return new Result(500, "创建订单失败，请稍后重试", null);
        }
    }


    // 获取当前用户订单统计概览
    @GetMapping("/stats")
    public Result getOrderStats(Authentication authentication) {
        Integer userId = (Integer) authentication.getPrincipal();
        OrderDto.Stats stat = ordersService.getOrderStats(userId);
        return new Result(200, "成功", stat);
    }


    // 确认收货，更新订单状态为 completed
    @PostMapping("/{id}/confirm")
    public OrderDto.SuccessResponse confirmOrder(@PathVariable("id") Integer id, Authentication authentication) {
        Integer userId = (Integer) authentication.getPrincipal();
        boolean ok = ordersService.confirmOrder(userId, id);
        return new OrderDto.SuccessResponse(ok);
    }

    // 取消订单，更新订单状态为 cancelled
    @PostMapping("/{id}/cancel")
    public OrderDto.SuccessResponse cancelOrder(@PathVariable("id") Integer id, Authentication authentication) {
        Integer userId = (Integer) authentication.getPrincipal();
        boolean ok = ordersService.cancelOrder(userId, id);
        return new OrderDto.SuccessResponse(ok);
    }

    /**
     * 提交订单评价（评分与评论）。
     * POST /orders/{id}/review
     *
     * @param id             订单 ID（路径参数）
     * @param req            评价请求体，包含 rating（1-5）与 comment
     * @param authentication 当前认证上下文，用于获取当前用户的 userId
     * @return SuccessResponse，success 为 boolean，true 表示评价成功
     */
    @PostMapping("/{id}/review")
    public OrderDto.SuccessResponse reviewOrder(@PathVariable("id") Integer id, @RequestBody OrderDto.ReviewRequest req, Authentication authentication) {
        Integer userId = (Integer) authentication.getPrincipal();
        boolean ok = ordersService.reviewOrder(userId, id, req);
        return new OrderDto.SuccessResponse(ok);
    }

    /**
     * 获取订单详情
     * GET /orders/{id}
     */
    @GetMapping("/{id}")
    public Result getOrderDetail(@PathVariable("id") Integer id) {
        OrderDto.DetailResponse detail = ordersService.getOrderDetail(id);
        if (detail == null) {
            return new Result(404, "订单不存在", null);
        }
        return new Result(200, "成功", detail);
    }

    /**
     * 更新订单状态（包含卖家留言和图片）
     * PATCH /orders/{id}/status
     */
    @PatchMapping("/{id}/status")
    public Result updateOrderStatus(@PathVariable("id") Integer id, @RequestBody OrderDto.StatusUpdateRequest req) {
        boolean ok = ordersService.updateOrderStatus(id, req.getStatus(), req.getSellerMessage(), req.getSellerImages());
        if (ok) {
            return new Result(200, "更新成功", null);
        }
        return new Result(400, "更新失败", null);
    }

    /**
     * 上传订单图片
     * POST /orders/{id}/images
     */
    @PostMapping("/{id}/images")
    public Result uploadOrderImages(@PathVariable("id") Integer id, @RequestParam("image") org.springframework.web.multipart.MultipartFile image) {
        try {
            // 调用图片服务上传
            String url = imageService.uploadImage(image, "orders");
            return new Result(200, "上传成功", java.util.Map.of("url", url));
        } catch (Exception e) {
            return new Result(400, "上传失败: " + e.getMessage(), null);
        }
    }
}