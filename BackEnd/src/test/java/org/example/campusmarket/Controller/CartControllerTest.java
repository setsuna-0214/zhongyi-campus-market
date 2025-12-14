package org.example.campusmarket.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.campusmarket.DTO.CartDto;
import org.example.campusmarket.Service.CartService;
import org.example.campusmarket.Controller.TestSecurityConfig.WithMockUserId;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * CartController API 测试
 */
@WebMvcTest(CartController.class)
@Import(TestSecurityConfig.class)
class CartControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CartService cartService;

    // ==================== 添加购物车测试 ====================

    @Test
    @WithMockUserId(1)
    void testAddToCart_Success() throws Exception {
        when(cartService.AddToCart(eq(1), eq(100), eq(2))).thenReturn(true);

        CartDto.AddRequest request = new CartDto.AddRequest(100, 2);

        mockMvc.perform(post("/cart")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("添加到购物车成功"));
    }

    @Test
    @WithMockUserId(1)
    void testAddToCart_InvalidParams() throws Exception {
        CartDto.AddRequest request = new CartDto.AddRequest(null, 2);

        mockMvc.perform(post("/cart")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("参数不合法"));
    }

    @Test
    @WithMockUserId(1)
    void testAddToCart_InvalidQuantity() throws Exception {
        CartDto.AddRequest request = new CartDto.AddRequest(100, 0);

        mockMvc.perform(post("/cart")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }

    // ==================== 批量添加购物车测试 ====================

    @Test
    @WithMockUserId(1)
    void testBatchAddToCart_Success() throws Exception {
        when(cartService.BatchAddToCart(eq(1), anyList())).thenReturn(true);

        CartDto.Item item1 = new CartDto.Item(100, 2);
        CartDto.Item item2 = new CartDto.Item(200, 1);
        CartDto.BatchAddRequest request = new CartDto.BatchAddRequest(Arrays.asList(item1, item2));

        mockMvc.perform(post("/cart/batch")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("批量添加到购物车成功"));
    }

    @Test
    @WithMockUserId(1)
    void testBatchAddToCart_EmptyItems() throws Exception {
        CartDto.BatchAddRequest request = new CartDto.BatchAddRequest(Arrays.asList());

        mockMvc.perform(post("/cart/batch")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }
}
