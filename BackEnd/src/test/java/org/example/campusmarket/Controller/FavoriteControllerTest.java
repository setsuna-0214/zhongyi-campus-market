package org.example.campusmarket.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.campusmarket.DTO.FavoriteDto;
import org.example.campusmarket.Service.FavoriteService;
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
import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * FavoriteController API 测试
 */
@WebMvcTest(FavoriteController.class)
@Import(TestSecurityConfig.class)
class FavoriteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FavoriteService favoriteService;

    // ==================== 获取收藏列表测试 ====================

    @Test
    @WithMockUserId(1)
    void testGetFavorites() throws Exception {
        FavoriteDto.FavoriteItem item = new FavoriteDto.FavoriteItem();
        item.setId(1);
        item.setProductId(100);
        item.setCreatedAt(LocalDateTime.now());

        when(favoriteService.GetFavoritesWithDetails(eq(1)))
                .thenReturn(Arrays.asList(item));

        mockMvc.perform(get("/favorites"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    @WithMockUserId(1)
    void testGetFavorites_Empty() throws Exception {
        when(favoriteService.GetFavoritesWithDetails(eq(1)))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/favorites"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    // ==================== 添加收藏测试 ====================

    @Test
    @WithMockUserId(1)
    void testAddFavorite_Success() throws Exception {
        FavoriteDto.AddResponse response = new FavoriteDto.AddResponse(1, 100, LocalDateTime.now());
        when(favoriteService.AddFavorite(eq(1), eq(100))).thenReturn(response);

        FavoriteDto.AddRequest request = new FavoriteDto.AddRequest(100);

        mockMvc.perform(post("/favorites")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.productId").value(100));
    }

    @Test
    @WithMockUserId(1)
    void testAddFavorite_NullProductId() throws Exception {
        FavoriteDto.AddRequest request = new FavoriteDto.AddRequest(null);

        mockMvc.perform(post("/favorites")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").doesNotExist());
    }

    // ==================== 删除收藏测试 ====================

    @Test
    @WithMockUserId(1)
    void testRemoveFavorite_Success() throws Exception {
        when(favoriteService.RemoveFavorite(eq(1), eq(100))).thenReturn(true);

        mockMvc.perform(delete("/favorites/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUserId(1)
    void testRemoveFavoriteByProduct() throws Exception {
        when(favoriteService.RemoveFavorite(eq(1), eq(100))).thenReturn(true);

        mockMvc.perform(delete("/favorites/by-product/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
