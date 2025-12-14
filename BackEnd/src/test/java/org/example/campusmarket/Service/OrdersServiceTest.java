package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.OrderDto;
import org.example.campusmarket.Mapper.OrdersMapper;
import org.example.campusmarket.Mapper.ProductMapper;
import org.example.campusmarket.entity.Order;
import org.example.campusmarket.entity.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * OrdersService 单元测试
 * 测试订单创建、状态变更、评价功能
 */
@ExtendWith(MockitoExtension.class)
class OrdersServiceTest {

    @Mock
    private OrdersMapper ordersMapper;

    @Mock
    private ProductMapper productMapper;

    @InjectMocks
    private OrdersService ordersService;

    private Product testProduct;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        testProduct = new Product();
        testProduct.setPro_id(1);
        testProduct.setPro_name("测试商品");
        testProduct.setPrice("99.99");
        testProduct.setPicture("http://example.com/img.jpg");

        testOrder = new Order();
        testOrder.setId(1);
        testOrder.setUserId(1);
        testOrder.setProductId(1);
        testOrder.setQuantity(2);
        testOrder.setTotalPrice(new BigDecimal("199.98"));
        testOrder.setStatus("pending");
        testOrder.setCreatedAt(LocalDateTime.now());
    }

    // ==================== 创建订单测试 ====================

    /**
     * 测试创建订单成功
     * 验证需求：4.1 - 创建订单计算正确的总价并设置状态为pending
     */
    @Test
    void testCreateOrder_Success() {
        when(productMapper.findProductBasicById(1)).thenReturn(testProduct);
        when(ordersMapper.insertOrder(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(1);
            return 1;
        });

        OrderDto.CreateRequest request = new OrderDto.CreateRequest();
        request.setProductId(1);
        request.setQuantity(2);

        OrderDto.Response response = ordersService.createOrder(1, request);

        assertNotNull(response);
        assertEquals(1, response.getId());
        assertEquals("pending", response.getStatus());
        // 验证总价计算：99.99 * 2 = 199.98
        assertEquals(199, response.getTotalPrice()); // intValue
        verify(ordersMapper, times(1)).insertOrder(any(Order.class));
    }

    /**
     * 测试创建订单 - 商品不存在
     */
    @Test
    void testCreateOrder_ProductNotFound() {
        when(productMapper.findProductBasicById(999)).thenReturn(null);

        OrderDto.CreateRequest request = new OrderDto.CreateRequest();
        request.setProductId(999);
        request.setQuantity(1);

        OrderDto.Response response = ordersService.createOrder(1, request);

        assertNull(response);
        verify(ordersMapper, never()).insertOrder(any(Order.class));
    }

    /**
     * 测试创建订单 - 无效参数
     */
    @Test
    void testCreateOrder_InvalidParams() {
        // 测试null userId
        OrderDto.Response response1 = ordersService.createOrder(null, new OrderDto.CreateRequest());
        assertNull(response1);

        // 测试null request
        OrderDto.Response response2 = ordersService.createOrder(1, null);
        assertNull(response2);

        // 测试无效数量
        OrderDto.CreateRequest request = new OrderDto.CreateRequest();
        request.setProductId(1);
        request.setQuantity(0);
        OrderDto.Response response3 = ordersService.createOrder(1, request);
        assertNull(response3);

        verify(ordersMapper, never()).insertOrder(any(Order.class));
    }

    // ==================== 确认收货测试 ====================

    /**
     * 测试确认收货成功
     * 验证需求：4.2 - 确认收货将订单状态更新为completed
     */
    @Test
    void testConfirmOrder_Success() {
        when(ordersMapper.updateStatus(1, 1, "completed")).thenReturn(1);

        boolean result = ordersService.confirmOrder(1, 1);

        assertTrue(result);
        verify(ordersMapper, times(1)).updateStatus(1, 1, "completed");
    }

    /**
     * 测试确认收货失败
     */
    @Test
    void testConfirmOrder_Failed() {
        when(ordersMapper.updateStatus(1, 1, "completed")).thenReturn(0);

        boolean result = ordersService.confirmOrder(1, 1);

        assertFalse(result);
    }

    // ==================== 取消订单测试 ====================

    /**
     * 测试取消订单成功
     * 验证需求：4.3 - 取消订单将订单状态更新为cancelled
     */
    @Test
    void testCancelOrder_Success() {
        when(ordersMapper.updateStatus(1, 1, "cancelled")).thenReturn(1);

        boolean result = ordersService.cancelOrder(1, 1);

        assertTrue(result);
        verify(ordersMapper, times(1)).updateStatus(1, 1, "cancelled");
    }

    // ==================== 订单评价测试 ====================

    /**
     * 测试提交评价成功
     * 验证需求：4.4 - 评分在1-5范围内时保存评价
     */
    @Test
    void testReviewOrder_Success() {
        when(ordersMapper.updateReview(1, 1, 5, "很好")).thenReturn(1);

        OrderDto.ReviewRequest request = new OrderDto.ReviewRequest();
        request.setRating(5);
        request.setComment("很好");

        boolean result = ordersService.reviewOrder(1, 1, request);

        assertTrue(result);
        verify(ordersMapper, times(1)).updateReview(1, 1, 5, "很好");
    }

    /**
     * 测试提交评价 - 评分超出范围
     * 验证需求：4.5 - 评分超出范围返回失败
     */
    @Test
    void testReviewOrder_InvalidRating() {
        // 评分小于1
        OrderDto.ReviewRequest request1 = new OrderDto.ReviewRequest();
        request1.setRating(0);
        assertFalse(ordersService.reviewOrder(1, 1, request1));

        // 评分大于5
        OrderDto.ReviewRequest request2 = new OrderDto.ReviewRequest();
        request2.setRating(6);
        assertFalse(ordersService.reviewOrder(1, 1, request2));

        // 评分为null
        OrderDto.ReviewRequest request3 = new OrderDto.ReviewRequest();
        request3.setRating(null);
        assertFalse(ordersService.reviewOrder(1, 1, request3));

        verify(ordersMapper, never()).updateReview(anyInt(), anyInt(), anyInt(), anyString());
    }

    // ==================== 订单列表查询测试 ====================

    /**
     * 测试查询订单列表
     * 验证需求：4.6 - 支持按状态、关键词、时间范围筛选
     */
    @Test
    void testGetOrderList_Success() {
        List<Order> orders = Arrays.asList(testOrder);
        when(ordersMapper.getOrderList(1, "pending", null, null, null)).thenReturn(orders);
        when(productMapper.findProductBasicById(1)).thenReturn(testProduct);

        List<OrderDto.Response> result = ordersService.getOrderList(1, "pending", null, null, null);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("pending", result.get(0).getStatus());
        assertNotNull(result.get(0).getProduct());
    }

    /**
     * 测试查询订单列表 - 空结果
     */
    @Test
    void testGetOrderList_Empty() {
        when(ordersMapper.getOrderList(1, null, null, null, null)).thenReturn(null);

        List<OrderDto.Response> result = ordersService.getOrderList(1, null, null, null, null);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ==================== 订单统计测试 ====================

    /**
     * 测试订单统计
     */
    @Test
    void testGetOrderStats() {
        when(ordersMapper.countTotal(1)).thenReturn(10);
        when(ordersMapper.countPending(1)).thenReturn(3);
        when(ordersMapper.countCompleted(1)).thenReturn(5);
        when(ordersMapper.countCancelled(1)).thenReturn(2);

        OrderDto.Stats stats = ordersService.getOrderStats(1);

        assertNotNull(stats);
        assertEquals(10, stats.getTotal());
        assertEquals(3, stats.getPending());
        assertEquals(5, stats.getCompleted());
        assertEquals(2, stats.getCancelled());
    }
}
