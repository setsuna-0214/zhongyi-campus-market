package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.HomeDto;
import org.example.campusmarket.Mapper.HomeMapper;
import org.example.campusmarket.entity.HomeProductRow;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * HomeService 单元测试
 * 测试首页热门商品和最新商品查询功能
 */
@ExtendWith(MockitoExtension.class)
class HomeServiceTest {

    @Mock
    private HomeMapper homeMapper;

    @InjectMocks
    private HomeService homeService;

    // ==================== 热门商品测试 ====================

    /**
     * 测试获取热门商品
     * 验证需求：8.1 - 返回按热度排序的商品列表
     */
    @Test
    void testGetHotProducts_Success() {
        HomeProductRow row1 = new HomeProductRow();
        row1.setId(1);
        row1.setTitle("热门商品1");
        row1.setImage("http://example.com/img1.jpg");
        row1.setPrice("99.99");
        row1.setSeller("卖家1");
        row1.setLocation("北京大学");
        row1.setStatus("在售");
        row1.setViews(100);

        HomeProductRow row2 = new HomeProductRow();
        row2.setId(2);
        row2.setTitle("热门商品2");
        row2.setImage("http://example.com/img2.jpg");
        row2.setPrice("199.99");
        row2.setSeller("卖家2");
        row2.setLocation("清华大学");
        row2.setStatus("在售");
        row2.setViews(50);

        List<HomeProductRow> rows = Arrays.asList(row1, row2);
        when(homeMapper.listHot(10)).thenReturn(rows);

        List<HomeDto.HomeProduct> result = homeService.getHotProducts(10);

        assertNotNull(result);
        assertEquals(2, result.size());
        
        // 验证第一个商品
        assertEquals(1, result.get(0).getId());
        assertEquals("热门商品1", result.get(0).getTitle());
        assertEquals(99, result.get(0).getPrice()); // intValue
        assertEquals("卖家1", result.get(0).getSeller());
        assertEquals("北京大学", result.get(0).getLocation());
        assertEquals(100, result.get(0).getViews());
    }

    /**
     * 测试获取热门商品 - 空结果
     * 验证需求：8.3 - 数据库返回null时返回空列表
     */
    @Test
    void testGetHotProducts_NullResult() {
        when(homeMapper.listHot(10)).thenReturn(null);

        List<HomeDto.HomeProduct> result = homeService.getHotProducts(10);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    /**
     * 测试获取热门商品 - 价格解析
     */
    @Test
    void testGetHotProducts_PriceConversion() {
        HomeProductRow row = new HomeProductRow();
        row.setId(1);
        row.setTitle("测试商品");
        row.setPrice("  123.45  "); // 带空格的价格
        row.setStatus("在售");

        when(homeMapper.listHot(1)).thenReturn(Arrays.asList(row));

        List<HomeDto.HomeProduct> result = homeService.getHotProducts(1);

        assertEquals(123, result.get(0).getPrice()); // 去除空格并转为整数
    }

    /**
     * 测试获取热门商品 - 无效价格
     */
    @Test
    void testGetHotProducts_InvalidPrice() {
        HomeProductRow row = new HomeProductRow();
        row.setId(1);
        row.setTitle("测试商品");
        row.setPrice("invalid"); // 无效价格
        row.setStatus("在售");

        when(homeMapper.listHot(1)).thenReturn(Arrays.asList(row));

        List<HomeDto.HomeProduct> result = homeService.getHotProducts(1);

        assertNull(result.get(0).getPrice()); // 解析失败返回null
    }

    /**
     * 测试获取热门商品 - null价格
     */
    @Test
    void testGetHotProducts_NullPrice() {
        HomeProductRow row = new HomeProductRow();
        row.setId(1);
        row.setTitle("测试商品");
        row.setPrice(null);
        row.setStatus("在售");

        when(homeMapper.listHot(1)).thenReturn(Arrays.asList(row));

        List<HomeDto.HomeProduct> result = homeService.getHotProducts(1);

        assertNull(result.get(0).getPrice());
    }

    // ==================== 最新商品测试 ====================

    /**
     * 测试获取最新商品
     * 验证需求：8.2 - 返回按发布时间排序的商品列表
     */
    @Test
    void testGetLatestProducts_Success() {
        HomeProductRow row1 = new HomeProductRow();
        row1.setId(100);
        row1.setTitle("最新商品1");
        row1.setImage("http://example.com/img1.jpg");
        row1.setPrice("299.99");
        row1.setSeller("卖家A");
        row1.setLocation("复旦大学");
        row1.setStatus("在售");
        row1.setViews(10);

        HomeProductRow row2 = new HomeProductRow();
        row2.setId(99);
        row2.setTitle("最新商品2");
        row2.setImage("http://example.com/img2.jpg");
        row2.setPrice("399.99");
        row2.setSeller("卖家B");
        row2.setLocation("上海交大");
        row2.setStatus("已售");
        row2.setViews(5);

        List<HomeProductRow> rows = Arrays.asList(row1, row2);
        when(homeMapper.listLatest(10)).thenReturn(rows);

        List<HomeDto.HomeProduct> result = homeService.getLatestProducts(10);

        assertNotNull(result);
        assertEquals(2, result.size());
        
        // 验证按ID倒序（最新的在前）
        assertEquals(100, result.get(0).getId());
        assertEquals(99, result.get(1).getId());
        
        // 验证状态
        assertEquals("在售", result.get(0).getStatus());
        assertEquals("已售", result.get(1).getStatus());
    }

    /**
     * 测试获取最新商品 - 空结果
     */
    @Test
    void testGetLatestProducts_NullResult() {
        when(homeMapper.listLatest(10)).thenReturn(null);

        List<HomeDto.HomeProduct> result = homeService.getLatestProducts(10);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }
}
