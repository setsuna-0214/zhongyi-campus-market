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
 * 收藏模块集成测试
 * 路径: /favorites
 */
@DisplayName("收藏模块集成测试")
class FavoriteIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("获取收藏列表")
    void testGetFavoriteList() throws Exception {
        mockMvc.perform(get("/favorites")
                        .with(authentication(createAuth(1))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("添加收藏 - 成功")
    void testAddFavorite_Success() throws Exception {
        Map<String, Integer> request = new HashMap<>();
        request.put("productId", 3);

        mockMvc.perform(post("/favorites")
                        .with(authentication(createAuth(1)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("取消收藏 - 根据收藏ID")
    void testRemoveFavorite_ById() throws Exception {
        mockMvc.perform(delete("/favorites/1")
                        .with(authentication(createAuth(1))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("取消收藏 - 根据商品ID")
    void testRemoveFavorite_ByProductId() throws Exception {
        mockMvc.perform(delete("/favorites/by-product/2")
                        .with(authentication(createAuth(1))))
                .andExpect(status().isOk());
    }
}
