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
 * 购物车模块集成测试
 * 路径: /cart
 */
@DisplayName("购物车模块集成测试")
class CartIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("添加商品到购物车 - 成功")
    void testAddToCart_Success() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("productId", 3);
        request.put("quantity", 1);

        mockMvc.perform(post("/cart")
                        .with(authentication(createAuth(1)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("批量添加商品到购物车")
    void testBatchAddToCart() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("productIds", new int[]{1, 2});

        mockMvc.perform(post("/cart/batch")
                        .with(authentication(createAuth(1)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}
