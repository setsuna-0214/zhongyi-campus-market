package org.example.campusmarket.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 首页模块集成测试
 * 路径: /home
 */
@DisplayName("首页模块集成测试")
class HomeIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("获取热门商品")
    void testGetHotProducts() throws Exception {
        mockMvc.perform(get("/home/hot"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("获取热门商品 - 带限制数量")
    void testGetHotProducts_WithLimit() throws Exception {
        mockMvc.perform(get("/home/hot")
                        .param("limit", "5"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("获取最新商品")
    void testGetLatestProducts() throws Exception {
        mockMvc.perform(get("/home/latest"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("获取最新商品 - 带限制数量")
    void testGetLatestProducts_WithLimit() throws Exception {
        mockMvc.perform(get("/home/latest")
                        .param("limit", "5"))
                .andExpect(status().isOk());
    }
}
