package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.CartDto;
import org.example.campusmarket.Mapper.CartMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * CartService 单元测试
 * 测试购物车添加商品功能
 */
@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartMapper cartMapper;

    @InjectMocks
    private CartService cartService;

    // ==================== 添加商品到购物车测试 ====================

    /**
     * 测试添加新商品到购物车
     * 验证需求：5.1 - 添加商品到购物车创建新的购物车项
     */
    @Test
    void testAddToCart_NewItem() {
        when(cartMapper.countByUserAndProduct(1, 100)).thenReturn(0);
        when(cartMapper.insertCartItem(1, 100, 2)).thenReturn(1);

        boolean result = cartService.AddToCart(1, 100, 2);

        assertTrue(result);
        verify(cartMapper, times(1)).insertCartItem(1, 100, 2);
        verify(cartMapper, never()).incrementCartItem(anyInt(), anyInt(), anyInt());
    }

    /**
     * 测试添加已存在的商品
     * 验证需求：5.2 - 添加已存在的商品增加数量
     */
    @Test
    void testAddToCart_ExistingItem() {
        when(cartMapper.countByUserAndProduct(1, 100)).thenReturn(1);
        when(cartMapper.incrementCartItem(1, 100, 3)).thenReturn(1);

        boolean result = cartService.AddToCart(1, 100, 3);

        assertTrue(result);
        verify(cartMapper, times(1)).incrementCartItem(1, 100, 3);
        verify(cartMapper, never()).insertCartItem(anyInt(), anyInt(), anyInt());
    }

    /**
     * 测试添加无效参数 - null userId
     * 验证需求：5.4 - 无效参数返回失败
     */
    @Test
    void testAddToCart_NullUserId() {
        boolean result = cartService.AddToCart(null, 100, 2);

        assertFalse(result);
        verify(cartMapper, never()).countByUserAndProduct(anyInt(), anyInt());
    }

    /**
     * 测试添加无效参数 - null productId
     */
    @Test
    void testAddToCart_NullProductId() {
        boolean result = cartService.AddToCart(1, null, 2);

        assertFalse(result);
        verify(cartMapper, never()).countByUserAndProduct(anyInt(), anyInt());
    }

    /**
     * 测试添加无效参数 - 负数数量
     */
    @Test
    void testAddToCart_NegativeQuantity() {
        boolean result = cartService.AddToCart(1, 100, -1);

        assertFalse(result);
        verify(cartMapper, never()).countByUserAndProduct(anyInt(), anyInt());
    }

    /**
     * 测试添加无效参数 - 零数量
     */
    @Test
    void testAddToCart_ZeroQuantity() {
        boolean result = cartService.AddToCart(1, 100, 0);

        assertFalse(result);
        verify(cartMapper, never()).countByUserAndProduct(anyInt(), anyInt());
    }

    // ==================== 批量添加商品测试 ====================

    /**
     * 测试批量添加商品成功
     * 验证需求：5.3 - 批量添加在事务中处理所有商品
     */
    @Test
    void testBatchAddToCart_Success() {
        CartDto.Item item1 = new CartDto.Item();
        item1.setProductId(100);
        item1.setQuantity(2);

        CartDto.Item item2 = new CartDto.Item();
        item2.setProductId(200);
        item2.setQuantity(1);

        List<CartDto.Item> items = Arrays.asList(item1, item2);

        when(cartMapper.countByUserAndProduct(1, 100)).thenReturn(0);
        when(cartMapper.insertCartItem(1, 100, 2)).thenReturn(1);
        when(cartMapper.countByUserAndProduct(1, 200)).thenReturn(0);
        when(cartMapper.insertCartItem(1, 200, 1)).thenReturn(1);

        boolean result = cartService.BatchAddToCart(1, items);

        assertTrue(result);
        verify(cartMapper, times(2)).insertCartItem(anyInt(), anyInt(), anyInt());
    }

    /**
     * 测试批量添加 - 空列表
     */
    @Test
    void testBatchAddToCart_EmptyList() {
        boolean result = cartService.BatchAddToCart(1, Collections.emptyList());

        assertFalse(result);
        verify(cartMapper, never()).countByUserAndProduct(anyInt(), anyInt());
    }

    /**
     * 测试批量添加 - null列表
     */
    @Test
    void testBatchAddToCart_NullList() {
        boolean result = cartService.BatchAddToCart(1, null);

        assertFalse(result);
        verify(cartMapper, never()).countByUserAndProduct(anyInt(), anyInt());
    }

    /**
     * 测试批量添加 - 包含无效项
     */
    @Test
    void testBatchAddToCart_InvalidItem() {
        CartDto.Item validItem = new CartDto.Item();
        validItem.setProductId(100);
        validItem.setQuantity(2);

        CartDto.Item invalidItem = new CartDto.Item();
        invalidItem.setProductId(null); // 无效
        invalidItem.setQuantity(1);

        List<CartDto.Item> items = Arrays.asList(validItem, invalidItem);

        when(cartMapper.countByUserAndProduct(1, 100)).thenReturn(0);
        when(cartMapper.insertCartItem(1, 100, 2)).thenReturn(1);

        boolean result = cartService.BatchAddToCart(1, items);

        // 第二个item无效，整体返回false
        assertFalse(result);
    }
}
