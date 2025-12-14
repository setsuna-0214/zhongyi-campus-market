package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.FavoriteDto;
import org.example.campusmarket.Mapper.FavoriteMapper;
import org.example.campusmarket.entity.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * FavoriteService 单元测试
 * 测试收藏功能
 */
@ExtendWith(MockitoExtension.class)
class FavoriteServiceTest {

    @Mock
    private FavoriteMapper favoriteMapper;

    @InjectMocks
    private FavoriteService favoriteService;

    private Product testProduct;

    @BeforeEach
    void setUp() {
        testProduct = new Product();
        testProduct.setPro_id(1);
        testProduct.setPro_name("测试商品");
        testProduct.setPrice("99.99");
        testProduct.setPicture("http://example.com/img.jpg");
    }

    // ==================== 添加收藏测试 ====================

    /**
     * 测试添加收藏成功
     * 验证需求：6.1 - 添加收藏创建收藏记录并返回收藏ID
     */
    @Test
    void testAddFavorite_Success() {
        when(favoriteMapper.countByUserAndProduct(1, 100)).thenReturn(0);
        when(favoriteMapper.insertFavorite(eq(1), eq(100), any(LocalDateTime.class))).thenReturn(1);
        when(favoriteMapper.getFavoriteId(1, 100)).thenReturn(10);

        FavoriteDto.AddResponse response = favoriteService.AddFavorite(1, 100);

        assertNotNull(response);
        assertEquals(10, response.getId());
        assertEquals(100, response.getProductId());
        assertNotNull(response.getCreatedAt());
        verify(favoriteMapper, times(1)).insertFavorite(eq(1), eq(100), any(LocalDateTime.class));
    }

    /**
     * 测试重复添加收藏 - 幂等性
     * 验证需求：6.2 - 重复添加返回已存在的收藏记录
     */
    @Test
    void testAddFavorite_AlreadyExists() {
        when(favoriteMapper.countByUserAndProduct(1, 100)).thenReturn(1);
        when(favoriteMapper.getFavoriteId(1, 100)).thenReturn(10);

        FavoriteDto.AddResponse response = favoriteService.AddFavorite(1, 100);

        assertNotNull(response);
        assertEquals(10, response.getId());
        assertEquals(100, response.getProductId());
        // 不应该再次插入
        verify(favoriteMapper, never()).insertFavorite(anyInt(), anyInt(), any(LocalDateTime.class));
    }

    /**
     * 测试添加收藏 - 无效参数
     */
    @Test
    void testAddFavorite_InvalidParams() {
        // null userId
        FavoriteDto.AddResponse response1 = favoriteService.AddFavorite(null, 100);
        assertNull(response1);

        // null productId
        FavoriteDto.AddResponse response2 = favoriteService.AddFavorite(1, null);
        assertNull(response2);

        verify(favoriteMapper, never()).countByUserAndProduct(anyInt(), anyInt());
    }

    // ==================== 移除收藏测试 ====================

    /**
     * 测试移除收藏成功
     * 验证需求：6.3 - 移除收藏删除收藏记录
     */
    @Test
    void testRemoveFavorite_Success() {
        when(favoriteMapper.deleteFavorite(1, 100)).thenReturn(1);

        boolean result = favoriteService.RemoveFavorite(1, 100);

        assertTrue(result);
        verify(favoriteMapper, times(1)).deleteFavorite(1, 100);
    }

    /**
     * 测试移除不存在的收藏 - 幂等性
     */
    @Test
    void testRemoveFavorite_NotExists() {
        when(favoriteMapper.deleteFavorite(1, 100)).thenReturn(0);

        // 即使不存在也返回成功（幂等性）
        boolean result = favoriteService.RemoveFavorite(1, 100);

        assertTrue(result);
    }

    /**
     * 测试移除收藏 - 无效参数
     */
    @Test
    void testRemoveFavorite_InvalidParams() {
        // null userId
        boolean result1 = favoriteService.RemoveFavorite(null, 100);
        assertFalse(result1);

        // null productId
        boolean result2 = favoriteService.RemoveFavorite(1, null);
        assertFalse(result2);

        verify(favoriteMapper, never()).deleteFavorite(anyInt(), anyInt());
    }

    // ==================== 查询收藏列表测试 ====================

    /**
     * 测试查询收藏列表
     * 验证需求：6.4 - 返回包含商品摘要的收藏列表
     */
    @Test
    void testGetFavoritesByUserId() {
        List<Product> products = Arrays.asList(testProduct);
        when(favoriteMapper.getFavoritesByUserId(1)).thenReturn(products);

        List<Product> result = favoriteService.GetFavoritesByUserId(1);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("测试商品", result.get(0).getPro_name());
    }

    /**
     * 测试查询收藏列表（带详情）
     */
    @Test
    void testGetFavoritesWithDetails() {
        Map<String, Object> row = new HashMap<>();
        row.put("fav_id", 10);
        row.put("pro_id", 1);
        row.put("created_at", LocalDateTime.now());
        row.put("pro_name", "测试商品");
        row.put("price", "99.99");
        row.put("is_seal", false);
        row.put("picture", "http://example.com/img.jpg");

        List<Map<String, Object>> rows = Arrays.asList(row);
        when(favoriteMapper.getFavoritesWithDetails(1)).thenReturn(rows);

        List<FavoriteDto.FavoriteItem> result = favoriteService.GetFavoritesWithDetails(1);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(10, result.get(0).getId());
        assertEquals(1, result.get(0).getProductId());
        assertNotNull(result.get(0).getProduct());
        assertEquals("测试商品", result.get(0).getProduct().getTitle());
        assertEquals("在售", result.get(0).getProduct().getStatus());
    }

    /**
     * 测试查询收藏列表 - 空结果
     */
    @Test
    void testGetFavoritesWithDetails_Empty() {
        when(favoriteMapper.getFavoritesWithDetails(1)).thenReturn(null);

        List<FavoriteDto.FavoriteItem> result = favoriteService.GetFavoritesWithDetails(1);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    /**
     * 测试查询收藏列表 - 已售出商品
     */
    @Test
    void testGetFavoritesWithDetails_SoldProduct() {
        Map<String, Object> row = new HashMap<>();
        row.put("fav_id", 10);
        row.put("pro_id", 1);
        row.put("created_at", LocalDateTime.now());
        row.put("pro_name", "已售商品");
        row.put("price", "199.99");
        row.put("is_seal", true); // 已售出
        row.put("picture", "http://example.com/img.jpg");

        List<Map<String, Object>> rows = Arrays.asList(row);
        when(favoriteMapper.getFavoritesWithDetails(1)).thenReturn(rows);

        List<FavoriteDto.FavoriteItem> result = favoriteService.GetFavoritesWithDetails(1);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("已售出", result.get(0).getProduct().getStatus());
    }
}
