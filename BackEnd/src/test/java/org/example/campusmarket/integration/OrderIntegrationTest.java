package org.example.campusmarket.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 订单模块集成测试
 * 路径: /orders
 */
@DisplayName("订单模块集成测试")
class OrderIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("获取订单列表")
    void testGetOrderList() throws Exception {
        mockMvc.perform(get("/orders")
                        .with(authentication(createAuth(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("获取订单统计")
    void testGetOrderStats() throws Exception {
        mockMvc.perform(get("/orders/stats")
                        .with(authentication(createAuth(1))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("创建订单 - 成功")
    void testCreateOrder_Success() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("productId", 2);
        request.put("quantity", 1);

        mockMvc.perform(post("/orders")
                        .with(authentication(createAuth(1)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("确认收货")
    void testConfirmOrder() throws Exception {
        mockMvc.perform(post("/orders/2/confirm")
                        .with(authentication(createAuth(1))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("取消订单")
    void testCancelOrder() throws Exception {
        mockMvc.perform(post("/orders/2/cancel")
                        .with(authentication(createAuth(1))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("订单评价")
    void testReviewOrder() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("rating", 5);
        request.put("comment", "非常满意！");

        mockMvc.perform(post("/orders/1/review")
                        .with(authentication(createAuth(2)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}
