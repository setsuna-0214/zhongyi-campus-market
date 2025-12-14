package org.example.campusmarket.Controller;

import org.example.campusmarket.DTO.HomeDto;
import org.example.campusmarket.Service.HomeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * HomeController API 测试
 * 测试首页热门商品和最新商品接口
 */
@WebMvcTest(HomeController.class)
class HomeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private HomeService homeService;

    // ==================== 热门商品测试 ====================

    /**
     * 测试获取热门商品 - 默认数量
     */
    @Test
    @WithMockUser
    void testGetHot_DefaultLimit() throws Exception {
        HomeDto.HomeProduct product = new HomeDto.HomeProduct(
                1, "热门商品", "http://img.jpg", 99,
                "", null, "卖家", "北京", null, "在售", 100
        );
        List<HomeDto.HomeProduct> products = Arrays.asList(product);
        
        when(homeService.getHotProducts(10)).thenReturn(products);

        mockMvc.perform(get("/home/hot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].title").value("热门商品"))
                .andExpect(jsonPath("$[0].views").value(100));

        verify(homeService, times(1)).getHotProducts(10);
    }

    /**
     * 测试获取热门商品 - 指定数量
     */
    @Test
    @WithMockUser
    void testGetHot_CustomLimit() throws Exception {
        when(homeService.getHotProducts(5)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/home/hot").param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        verify(homeService, times(1)).getHotProducts(5);
    }

    /**
     * 测试获取热门商品 - 空结果
     */
    @Test
    @WithMockUser
    void testGetHot_EmptyResult() throws Exception {
        when(homeService.getHotProducts(10)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/home/hot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    // ==================== 最新商品测试 ====================

    /**
     * 测试获取最新商品 - 默认数量
     */
    @Test
    @WithMockUser
    void testGetLatest_DefaultLimit() throws Exception {
        HomeDto.HomeProduct product = new HomeDto.HomeProduct(
                100, "最新商品", "http://img.jpg", 199,
                null, "", "卖家B", "上海", null, "在售", 10
        );
        List<HomeDto.HomeProduct> products = Arrays.asList(product);
        
        when(homeService.getLatestProducts(10)).thenReturn(products);

        mockMvc.perform(get("/home/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(100))
                .andExpect(jsonPath("$[0].title").value("最新商品"));

        verify(homeService, times(1)).getLatestProducts(10);
    }

    /**
     * 测试获取最新商品 - 指定数量
     */
    @Test
    @WithMockUser
    void testGetLatest_CustomLimit() throws Exception {
        when(homeService.getLatestProducts(20)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/home/latest").param("limit", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        verify(homeService, times(1)).getLatestProducts(20);
    }

    /**
     * 测试获取最新商品 - 多个商品
     */
    @Test
    @WithMockUser
    void testGetLatest_MultipleProducts() throws Exception {
        HomeDto.HomeProduct product1 = new HomeDto.HomeProduct(
                100, "商品1", "http://img1.jpg", 99,
                null, "", "卖家A", "北京", null, "在售", 5
        );
        HomeDto.HomeProduct product2 = new HomeDto.HomeProduct(
                99, "商品2", "http://img2.jpg", 199,
                null, "", "卖家B", "上海", null, "已售", 3
        );
        List<HomeDto.HomeProduct> products = Arrays.asList(product1, product2);
        
        when(homeService.getLatestProducts(10)).thenReturn(products);

        mockMvc.perform(get("/home/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(100))
                .andExpect(jsonPath("$[1].id").value(99));
    }
}
