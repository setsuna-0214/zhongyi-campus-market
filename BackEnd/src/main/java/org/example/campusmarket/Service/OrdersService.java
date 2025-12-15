package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.OrderDto;
import org.example.campusmarket.Mapper.OrdersMapper;
import org.example.campusmarket.Mapper.ProductMapper;
import org.example.campusmarket.entity.Order;
import org.example.campusmarket.entity.Product;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Service
public class OrdersService {
    @Autowired
    private OrdersMapper ordersMapper;
    @Autowired
    private ProductMapper productMapper;

    /**
     * 查询当前用户订单列表，并按传入条件进行可选过滤。
     *
     * @param userId    当前用户 ID
     * @param status    可选订单状态（pending/completed/cancelled），为空则不按状态过滤
     * @param keyword   可选关键词（商品名或描述模糊匹配），为空则不按关键词过滤
     * @param startDate 可选起始时间（字符串），为空则不设时间下限
     * @param endDate   可选结束时间（字符串），为空则不设时间上限
     * @return OrderDto.Response 列表，包含商品摘要与订单基础信息
     */
    public List<OrderDto.Response> getOrderList(Integer userId, String status, String keyword, String startDate, String endDate) {
        List<Order> orders = ordersMapper.getOrderList(userId, status, keyword, startDate, endDate);
        List<OrderDto.Response> responses = new ArrayList<>();
        if (orders == null) return responses;
        for (Order order : orders) {
            // 查询商品基础信息，组装到订单响应中
            Product product = productMapper.findProductBasicById(order.getProductId());
            OrderDto.ProductSummary productSummary = null;
            if (product != null) {
                Integer unitPriceInt = parsePriceToInt(product.getPrice());
                productSummary = new OrderDto.ProductSummary(product.getPro_id(), product.getPro_name(), unitPriceInt, product.getPicture());
            }
            Integer totalPriceInt = order.getTotalPrice() == null ? null : order.getTotalPrice().intValue();
            responses.add(new OrderDto.Response(order.getId(), order.getProductId(), productSummary, order.getQuantity(), totalPriceInt, order.getStatus(), order.getCreatedAt()));
        }
        return responses;
    }

    /**
     * 创建订单：按商品价格 × 购买数量计算总价，状态默认 pending。
     * 创建订单时会锁定商品（设置 is_seal = true），防止其他用户购买。
     *
     * @param userId 当前用户 ID
     * @param req    创建订单请求，包含 productId 与 quantity
     * @return 创建成功后的 OrderDto.Response；失败返回 null
     */
    public OrderDto.Response createOrder(Integer userId, OrderDto.CreateRequest req) {
        if (userId == null || req == null || req.getProductId() == null || req.getQuantity() == null || req.getQuantity() <= 0) {
            return null;
        }
        
        // 查询商品信息
        Product product = productMapper.findProductBasicById(req.getProductId());
        if (product == null) {
            throw new IllegalArgumentException("商品不存在");
        }
        
        // 验证：用户不能购买自己发布的商品
        if (product.getSaler_id() != null && product.getSaler_id().equals(userId)) {
            throw new IllegalArgumentException("不能购买自己发布的商品");
        }
        
        // 验证：商品必须是未售出状态（is_seal = false）
        if (product.is_seal()) {
            throw new IllegalArgumentException("商品已售出或已被锁定");
        }
        
        // 锁定商品（设置 is_seal = true）
        int lockResult = productMapper.updateProductStatus(req.getProductId(), true);
        if (lockResult != 1) {
            throw new IllegalArgumentException("商品锁定失败，可能已被其他用户购买");
        }
        
        // 创建订单
        BigDecimal unitPrice = parsePriceToBigDecimal(product.getPrice());
        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(req.getQuantity()));
        Order order = new Order(null, userId, req.getProductId(), req.getQuantity(), totalPrice, "pending", LocalDateTime.now(), null, null);
        int insertCount = ordersMapper.insertOrder(order);
        if (insertCount != 1 || order.getId() == null) {
            // 如果订单创建失败，解锁商品
            productMapper.updateProductStatus(req.getProductId(), false);
            return null;
        }
        
        OrderDto.ProductSummary productSummary = new OrderDto.ProductSummary(product.getPro_id(), product.getPro_name(), unitPrice.intValue(), product.getPicture());
        return new OrderDto.Response(order.getId(), order.getProductId(), productSummary, order.getQuantity(), totalPrice.intValue(), order.getStatus(), order.getCreatedAt());
    }


    /**
     * 确认收货，更新订单状态为 completed
     * 商品保持锁定状态（is_seal = true），表示已售出
     */
    public boolean confirmOrder(Integer userId, Integer id) {
        // 更新订单状态
        int result = ordersMapper.updateStatus(id, userId, "completed");
        // 商品保持锁定状态，不需要额外操作
        return result == 1;
    }

    /**
     * 取消订单，更新订单状态为 cancelled
     * 解锁商品（设置 is_seal = false），允许其他用户购买
     */
    public boolean cancelOrder(Integer userId, Integer id) {
        // 先查询订单信息，获取商品ID
        List<Order> orders = ordersMapper.getOrderList(userId, null, null, null, null);
        Order targetOrder = null;
        for (Order order : orders) {
            if (order.getId().equals(id)) {
                targetOrder = order;
                break;
            }
        }
        
        if (targetOrder == null) {
            return false;
        }
        
        // 更新订单状态为 cancelled
        int result = ordersMapper.updateStatus(id, userId, "cancelled");
        if (result == 1) {
            // 解锁商品，允许其他用户购买
            productMapper.updateProductStatus(targetOrder.getProductId(), false);
            return true;
        }
        return false;
    }

    // 提交订单评价，校验评分范围并写入评论
    public boolean reviewOrder(Integer userId, Integer id, OrderDto.ReviewRequest req) {
        if (req == null || req.getRating() == null || req.getRating() < 1 || req.getRating() > 5) {
            return false;
        }
        return ordersMapper.updateReview(id, userId, req.getRating(), req.getComment()) == 1;
    }

    // 订单统计，返回总数与各状态数量
    public OrderDto.Stats getOrderStats(Integer userId) {
        int totalCount = ordersMapper.countTotal(userId);
        int pendingCount = ordersMapper.countPending(userId);
        int completedCount = ordersMapper.countCompleted(userId);
        int cancelledCount = ordersMapper.countCancelled(userId);
        return new OrderDto.Stats(totalCount, pendingCount, completedCount, cancelledCount);
    }

    /**
     * 将价格字符串解析为整数（单位与前端展示一致）。若解析失败返回 null。
     */
    private Integer parsePriceToInt(String price) {
        try {
            BigDecimal priceDecimal = parsePriceToBigDecimal(price);
            return priceDecimal.intValue();
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 将商品价格字符串解析为 BigDecimal。假定 price 为纯数字字符串。
     */
    private BigDecimal parsePriceToBigDecimal(String price) {
        if (price == null) return BigDecimal.ZERO;
        return new BigDecimal(price.trim());
    }
}