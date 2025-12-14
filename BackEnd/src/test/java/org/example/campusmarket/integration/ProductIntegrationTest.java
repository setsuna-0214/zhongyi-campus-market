package org.example.campusmarket.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 商品模块集成测试
 * 路径: /products
 */
@DisplayName("商品模块集成测试")
class ProductIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("获取商品详情 - 成功")
    void testGetProductDetail_Success() throws Exception {
        mockMvc.perform(get("/products/1"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("获取商品列表/搜索商品")
    void testSearchProducts() throws Exception {
        mockMvc.perform(get("/products")
                        .param("page", "1")
                        .param("pageSize", "10"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("搜索商品 - 带关键词")
    void testSearchProducts_WithKeyword() throws Exception {
        mockMvc.perform(get("/products")
                        .param("keyword", "测试")
                        .param("page", "1")
                        .param("pageSize", "10"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("获取相关商品")
    void testGetRelatedProducts() throws Exception {
        mockMvc.perform(get("/products/1/related"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("发布商品 - 成功")
    void testCreateProduct_Success() throws Exception {
        MockMultipartFile imageFile = new MockMultipartFile(
                "picture", "test.jpg", "image/jpeg", "test image content".getBytes());

        mockMvc.perform(multipart("/products")
                        .file(imageFile)
                        .param("pro_name", "新商品")
                        .param("price", "88.88")
                        .param("discription", "新商品描述")
                        .param("category", "测试分类")
                        .with(authentication(createAuth(1))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("更新商品 - 成功")
    void testUpdateProduct_Success() throws Exception {
        mockMvc.perform(put("/products/1")
                        .with(authentication(createAuth(1)))
                        .param("pro_name", "更新后的商品名")
                        .param("price", "199.99"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("删除商品 - 成功")
    void testDeleteProduct_Success() throws Exception {
        mockMvc.perform(delete("/products/1")
                        .with(authentication(createAuth(1))))
                .andExpect(status().isOk());
    }
}
