package org.example.campusmarket.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.campusmarket.DTO.OrderDto;
import org.example.campusmarket.Service.OrdersService;
import org.example.campusmarket.Controller.TestSecurityConfig.WithMockUserId;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * OrdersController API 测试
 */
@WebMvcTest(OrdersController.class)
@Import(TestSecurityConfig.class)
class OrdersControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrdersService ordersService;

    // ==================== 查询订单列表测试 ====================

    @Test
    @WithMockUserId(1)
    void testGetOrderList() throws Exception {
        OrderDto.Response order = new OrderDto.Response(
                1, 100, null, 2, 200, "pending", LocalDateTime.now()
        );
        when(ordersService.getOrderList(eq(1), isNull(), isNull(), isNull(), isNull()))
                .thenReturn(Arrays.asList(order));

        mockMvc.perform(get("/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray());
    }

    // ==================== 创建订单测试 ====================

    @Test
    @WithMockUserId(1)
    void testCreateOrder_Success() throws Exception {
        OrderDto.Response created = new OrderDto.Response(
                1, 100, null, 2, 200, "pending", LocalDateTime.now()
        );
        when(ordersService.createOrder(eq(1), any(OrderDto.CreateRequest.class)))
                .thenReturn(created);

        OrderDto.CreateRequest request = new OrderDto.CreateRequest(100, 2);

        mockMvc.perform(post("/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("创建订单成功"));
    }

    @Test
    @WithMockUserId(1)
    void testCreateOrder_Failed() throws Exception {
        when(ordersService.createOrder(eq(1), any(OrderDto.CreateRequest.class)))
                .thenReturn(null);

        OrderDto.CreateRequest request = new OrderDto.CreateRequest(999, 2);

        mockMvc.perform(post("/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }

    // ==================== 订单统计测试 ====================

    @Test
    @WithMockUserId(1)
    void testGetOrderStats() throws Exception {
        OrderDto.Stats stats = new OrderDto.Stats(10, 3, 5, 2);
        when(ordersService.getOrderStats(eq(1))).thenReturn(stats);

        mockMvc.perform(get("/orders/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.total").value(10));
    }

    // ==================== 确认收货测试 ====================

    @Test
    @WithMockUserId(1)
    void testConfirmOrder() throws Exception {
        when(ordersService.confirmOrder(eq(1), eq(1))).thenReturn(true);

        mockMvc.perform(post("/orders/1/confirm"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ==================== 取消订单测试 ====================

    @Test
    @WithMockUserId(1)
    void testCancelOrder() throws Exception {
        when(ordersService.cancelOrder(eq(1), eq(1))).thenReturn(true);

        mockMvc.perform(post("/orders/1/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ==================== 订单评价测试 ====================

    @Test
    @WithMockUserId(1)
    void testReviewOrder() throws Exception {
        when(ordersService.reviewOrder(eq(1), eq(1), any(OrderDto.ReviewRequest.class)))
                .thenReturn(true);

        OrderDto.ReviewRequest request = new OrderDto.ReviewRequest(5, "很好");

        mockMvc.perform(post("/orders/1/review")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
