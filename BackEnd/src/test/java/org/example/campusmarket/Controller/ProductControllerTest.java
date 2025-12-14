package org.example.campusmarket.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.campusmarket.DTO.ProductDto;
import org.example.campusmarket.Service.ProductService;
import org.example.campusmarket.entity.Product;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ProductController API 测试
 * 测试商品相关的 REST 接口
 */
@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ProductService productService;

    // ==================== 搜索商品测试 ====================

    /**
     * 测试搜索商品 - 默认参数
     */
    @Test
    @WithMockUser
    void testSearchProducts_Default() throws Exception {
        ProductDto.ProductListResponse response = new ProductDto.ProductListResponse(
                Collections.emptyList(), 0L
        );
        when(productService.searchProducts(
                isNull(), isNull(), isNull(), isNull(),
                isNull(), isNull(), isNull(), eq(1), eq(12)
        )).thenReturn(response);

        mockMvc.perform(get("/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.items").isArray());
    }

    /**
     * 测试搜索商品 - 带关键词
     */
    @Test
    @WithMockUser
    void testSearchProducts_WithKeyword() throws Exception {
        ProductDto.ProductDetail product = new ProductDto.ProductDetail();
        product.setId(1);
        product.setTitle("测试商品");
        product.setPrice(99.0);

        ProductDto.ProductListResponse response = new ProductDto.ProductListResponse(
                Arrays.asList(product), 1L
        );
        when(productService.searchProducts(
                eq("测试"), isNull(), isNull(), isNull(),
                isNull(), isNull(), isNull(), eq(1), eq(12)
        )).thenReturn(response);

        mockMvc.perform(get("/products").param("keyword", "测试"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].title").value("测试商品"));
    }

    /**
     * 测试搜索商品 - 带分页
     */
    @Test
    @WithMockUser
    void testSearchProducts_WithPagination() throws Exception {
        ProductDto.ProductListResponse response = new ProductDto.ProductListResponse(
                Collections.emptyList(), 100L
        );
        when(productService.searchProducts(
                isNull(), isNull(), isNull(), isNull(),
                isNull(), isNull(), isNull(), eq(2), eq(20)
        )).thenReturn(response);

        mockMvc.perform(get("/products")
                .param("page", "2")
                .param("pageSize", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(100));
    }

    /**
     * 测试搜索商品 - 带价格区间
     */
    @Test
    @WithMockUser
    void testSearchProducts_WithPriceRange() throws Exception {
        ProductDto.ProductListResponse response = new ProductDto.ProductListResponse(
                Collections.emptyList(), 5L
        );
        when(productService.searchProducts(
                isNull(), isNull(), isNull(), isNull(),
                eq(100.0), eq(500.0), isNull(), eq(1), eq(12)
        )).thenReturn(response);

        mockMvc.perform(get("/products")
                .param("priceMin", "100")
                .param("priceMax", "500"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(5));
    }

    // ==================== 获取商品详情测试 ====================

    /**
     * 测试获取商品详情
     */
    @Test
    @WithMockUser
    void testGetProductDetail() throws Exception {
        ProductDto.ProductDetail detail = new ProductDto.ProductDetail();
        detail.setId(1);
        detail.setTitle("测试商品");
        detail.setPrice(199.0);
        detail.setDescription("商品描述");
        detail.setImages(Arrays.asList("http://img1.jpg", "http://img2.jpg"));

        when(productService.getProductDetail(1)).thenReturn(detail);

        mockMvc.perform(get("/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("测试商品"))
                .andExpect(jsonPath("$.price").value(199));
    }

    /**
     * 测试获取商品详情 - 商品不存在
     */
    @Test
    @WithMockUser
    void testGetProductDetail_NotFound() throws Exception {
        when(productService.getProductDetail(999)).thenReturn(null);

        mockMvc.perform(get("/products/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").doesNotExist());
    }

    // ==================== 获取相关商品测试 ====================

    /**
     * 测试获取相关商品
     */
    @Test
    @WithMockUser
    void testGetRelatedProducts() throws Exception {
        ProductDto.ProductDetail related = new ProductDto.ProductDetail();
        related.setId(2);
        related.setTitle("相关商品");

        when(productService.getRelatedProducts(1)).thenReturn(Arrays.asList(related));

        mockMvc.perform(get("/products/1/related"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(2));
    }

    // ==================== 创建商品测试 ====================

    /**
     * 测试创建商品成功
     */
    @Test
    void testCreateProduct_Success() throws Exception {
        when(productService.createProduct(any(Product.class), any()))
                .thenReturn(1);

        mockMvc.perform(multipart("/products")
                .param("pro_name", "新商品")
                .param("price", "99.99")
                .param("discription", "商品描述")
                .with(csrf())
                .with(request -> {
                    request.setUserPrincipal(() -> "1");
                    return request;
                })
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors
                        .authentication(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                1, null, java.util.Collections.emptyList()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("商品发布成功"))
                .andExpect(jsonPath("$.data").value(1));
    }

    /**
     * 测试创建商品 - 图片超过限制
     */
    @Test
    void testCreateProduct_TooManyImages() throws Exception {
        when(productService.createProduct(any(Product.class), any()))
                .thenThrow(new IllegalArgumentException("商品图片数量不能超过9张"));

        mockMvc.perform(multipart("/products")
                .param("pro_name", "新商品")
                .param("price", "99.99")
                .with(csrf())
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors
                        .authentication(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                1, null, java.util.Collections.emptyList()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("商品图片数量不能超过9张"));
    }

    // ==================== 删除商品测试 ====================

    /**
     * 测试删除商品成功
     */
    @Test
    @WithMockUser
    void testDeleteProduct_Success() throws Exception {
        doNothing().when(productService).deleteProduct(1);

        mockMvc.perform(delete("/products/1").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("商品删除成功"));
    }

    /**
     * 测试删除商品 - 商品不存在
     */
    @Test
    @WithMockUser
    void testDeleteProduct_NotFound() throws Exception {
        doThrow(new IllegalArgumentException("商品不存在"))
                .when(productService).deleteProduct(999);

        mockMvc.perform(delete("/products/999").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("商品不存在"));
    }
}
