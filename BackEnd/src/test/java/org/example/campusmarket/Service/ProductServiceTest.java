package org.example.campusmarket.Service;

import org.example.campusmarket.Mapper.ProductMapper;
import org.example.campusmarket.entity.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * ProductService 单元测试
 * 测试商品图片管理的核心逻辑
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProductServiceTest {

    @Mock
    private ProductMapper productMapper;

    @Mock
    private ImageService imageService;

    @InjectMocks
    private ProductService productService;

    private Product testProduct;
    private MultipartFile[] testImages;

    @BeforeEach
    void setUp() {
        testProduct = new Product();
        testProduct.setPro_id(1);
        testProduct.setPro_name("测试商品");
        testProduct.setPrice("99.99");
        testProduct.setDiscription("测试描述");
        testProduct.setSaler_id(1);
        testProduct.set_seal(false);
    }

    /**
     * 测试创建商品时图片数量超过9张的情况
     * 验证需求：5.1 - 商品图片数量限制
     */
    @Test
    void testCreateProduct_ExceedsMaxImages() {
        // 准备10张图片（超过限制）
        MultipartFile[] images = new MultipartFile[10];
        for (int i = 0; i < 10; i++) {
            images[i] = mock(MultipartFile.class);
            when(images[i].isEmpty()).thenReturn(false);
        }

        // 执行并验证抛出异常
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> productService.createProduct(testProduct, images)
        );

        assertTrue(exception.getMessage().contains("不能超过9张"));
        
        // 验证没有调用上传服务
        verify(imageService, never()).uploadImage(any(), any());
    }

    /**
     * 测试创建商品成功的情况
     * 验证需求：5.1, 5.2, 5.3
     */
    @Test
    void testCreateProduct_Success() {
        // 准备3张图片
        MultipartFile[] images = new MultipartFile[3];
        for (int i = 0; i < 3; i++) {
            images[i] = mock(MultipartFile.class);
            when(images[i].isEmpty()).thenReturn(false);
            when(images[i].getOriginalFilename()).thenReturn("test" + i + ".jpg");
        }

        // Mock 图片上传返回URL
        when(imageService.uploadImage(any(), eq("products")))
            .thenReturn("https://oss.example.com/products/image1.jpg")
            .thenReturn("https://oss.example.com/products/image2.jpg")
            .thenReturn("https://oss.example.com/products/image3.jpg");

        // 执行
        Integer productId = productService.createProduct(testProduct, images);

        // 验证图片上传被调用3次
        verify(imageService, times(3)).uploadImage(any(), eq("products"));
        
        // 验证商品被插入数据库
        verify(productMapper, times(1)).insertProduct(any(Product.class));
        
        // 验证图片URL被正确设置（逗号分隔）
        assertTrue(testProduct.getPicture().contains(","));
        assertEquals(3, testProduct.getPicture().split(",").length);
    }

    /**
     * 测试删除商品时清理图片
     * 验证需求：2.2, 5.4
     */
    @Test
    void testDeleteProduct_WithImages() {
        // 准备商品数据，包含3张图片
        testProduct.setPicture("https://oss.example.com/products/img1.jpg," +
                              "https://oss.example.com/products/img2.jpg," +
                              "https://oss.example.com/products/img3.jpg");
        
        when(productMapper.findProductBasicById(1)).thenReturn(testProduct);

        // 执行删除
        productService.deleteProduct(1);

        // 验证图片被删除
        verify(imageService, times(1)).deleteImages(argThat(urls -> 
            urls != null && urls.size() == 3
        ));
        
        // 验证商品被删除
        verify(productMapper, times(1)).deleteProduct(1);
    }

    /**
     * 测试删除不存在的商品
     */
    @Test
    void testDeleteProduct_NotFound() {
        when(productMapper.findProductBasicById(999)).thenReturn(null);

        // 执行并验证抛出异常
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> productService.deleteProduct(999)
        );

        assertTrue(exception.getMessage().contains("不存在"));
        
        // 验证没有调用删除操作
        verify(imageService, never()).deleteImages(any());
        verify(productMapper, never()).deleteProduct(anyInt());
    }

    /**
     * 测试更新商品时删除未使用的旧图片
     * 验证需求：5.5
     */
    @Test
    void testUpdateProduct_RemovesUnusedImages() {
        // 准备现有商品，有3张图片
        testProduct.setPicture("https://oss.example.com/products/old1.jpg," +
                              "https://oss.example.com/products/old2.jpg," +
                              "https://oss.example.com/products/old3.jpg");
        
        when(productMapper.findProductBasicById(1)).thenReturn(testProduct);

        // 只保留第1张旧图片，上传1张新图片
        List<String> keepImages = Arrays.asList("https://oss.example.com/products/old1.jpg");
        MultipartFile[] newImages = new MultipartFile[1];
        newImages[0] = mock(MultipartFile.class);
        when(newImages[0].isEmpty()).thenReturn(false);
        when(imageService.uploadImage(any(), eq("products")))
            .thenReturn("https://oss.example.com/products/new1.jpg");

        Product updateProduct = new Product();
        updateProduct.setPro_name("更新的商品");

        // 执行更新
        productService.updateProduct(1, updateProduct, newImages, keepImages);

        // 验证删除了2张未保留的旧图片
        verify(imageService, times(1)).deleteImages(argThat(urls -> 
            urls != null && urls.size() == 2 &&
            urls.contains("https://oss.example.com/products/old2.jpg") &&
            urls.contains("https://oss.example.com/products/old3.jpg")
        ));
        
        // 验证商品被更新
        verify(productMapper, times(1)).updateProduct(any(Product.class));
    }

    /**
     * 测试更新商品时图片总数超过限制
     * 验证需求：5.1
     */
    @Test
    void testUpdateProduct_ExceedsMaxImages() {
        // 准备现有商品，有5张图片
        testProduct.setPicture("url1,url2,url3,url4,url5");
        when(productMapper.findProductBasicById(1)).thenReturn(testProduct);

        // 保留5张旧图片，再上传5张新图片（总共10张，超过限制）
        List<String> keepImages = Arrays.asList("url1", "url2", "url3", "url4", "url5");
        MultipartFile[] newImages = new MultipartFile[5];
        for (int i = 0; i < 5; i++) {
            newImages[i] = mock(MultipartFile.class);
            when(newImages[i].isEmpty()).thenReturn(false);
            when(imageService.uploadImage(any(), eq("products")))
                .thenReturn("https://oss.example.com/products/new" + i + ".jpg");
        }

        Product updateProduct = new Product();

        // 执行并验证抛出异常
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> productService.updateProduct(1, updateProduct, newImages, keepImages)
        );

        assertTrue(exception.getMessage().contains("不能超过9张"));
        
        // 验证新上传的图片被清理
        verify(imageService, times(1)).deleteImages(argThat(urls -> 
            urls != null && urls.size() == 5
        ));
    }
}
