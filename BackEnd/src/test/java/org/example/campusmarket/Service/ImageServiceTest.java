package org.example.campusmarket.Service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.PutObjectRequest;
import com.aliyun.oss.model.CannedAccessControlList;
import org.example.campusmarket.config.OssProperties;
import org.example.campusmarket.exception.ImageValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * ImageService 单元测试
 * 测试图片上传、删除、验证功能
 */
@ExtendWith(MockitoExtension.class)
class ImageServiceTest {

    @Mock
    private OSS ossClient;

    @Mock
    private OssProperties ossProperties;

    private ImageService imageService;

    @BeforeEach
    void setUp() {
        imageService = new ImageService(ossClient, ossProperties);
        
        // 设置OSS配置
        lenient().when(ossProperties.getBucketName()).thenReturn("test-bucket");
        lenient().when(ossProperties.getEndpoint()).thenReturn("oss-cn-hangzhou.aliyuncs.com");
        lenient().when(ossProperties.getCdnDomain()).thenReturn(null);
    }

    // ==================== 上传图片测试 ====================

    /**
     * 测试上传有效的JPEG图片
     * 验证需求：7.1 - 上传有效图片返回OSS访问URL
     */
    @Test
    void testUploadImage_ValidJpeg() throws IOException {
        // JPEG文件头: FF D8 FF
        byte[] jpegHeader = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0, 0, 0, 0, 0, 0, 0};
        MockMultipartFile file = new MockMultipartFile(
            "image", "test.jpg", "image/jpeg", jpegHeader
        );

        String url = imageService.uploadImage(file, "products");

        assertNotNull(url);
        assertTrue(url.contains("test-bucket"));
        assertTrue(url.contains("products"));
        verify(ossClient, times(1)).putObject(any(PutObjectRequest.class));
        verify(ossClient, times(1)).setObjectAcl(eq("test-bucket"), anyString(), eq(CannedAccessControlList.PublicRead));
    }

    /**
     * 测试上传有效的PNG图片
     */
    @Test
    void testUploadImage_ValidPng() throws IOException {
        // PNG文件头: 89 50 4E 47 0D 0A 1A 0A
        byte[] pngHeader = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};
        MockMultipartFile file = new MockMultipartFile(
            "image", "test.png", "image/png", pngHeader
        );

        String url = imageService.uploadImage(file, "avatars");

        assertNotNull(url);
        assertTrue(url.contains("avatars"));
        verify(ossClient, times(1)).putObject(any(PutObjectRequest.class));
    }

    /**
     * 测试上传有效的GIF图片
     */
    @Test
    void testUploadImage_ValidGif() throws IOException {
        // GIF文件头: 47 49 46 38 (GIF8)
        byte[] gifHeader = new byte[]{0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0};
        MockMultipartFile file = new MockMultipartFile(
            "image", "test.gif", "image/gif", gifHeader
        );

        String url = imageService.uploadImage(file, "products");

        assertNotNull(url);
        verify(ossClient, times(1)).putObject(any(PutObjectRequest.class));
    }

    /**
     * 测试上传空文件
     * 验证需求：7.2 - 空文件抛出验证异常
     */
    @Test
    void testUploadImage_EmptyFile() {
        MockMultipartFile file = new MockMultipartFile(
            "image", "test.jpg", "image/jpeg", new byte[0]
        );

        ImageValidationException exception = assertThrows(
            ImageValidationException.class,
            () -> imageService.uploadImage(file, "products")
        );

        assertTrue(exception.getMessage().contains("不能为空"));
        verify(ossClient, never()).putObject(any(PutObjectRequest.class));
    }

    /**
     * 测试上传超过5MB的文件
     * 验证需求：7.2 - 超过5MB抛出验证异常
     */
    @Test
    void testUploadImage_FileTooLarge() {
        // 创建超过5MB的文件
        byte[] largeContent = new byte[6 * 1024 * 1024]; // 6MB
        // 添加JPEG头
        largeContent[0] = (byte) 0xFF;
        largeContent[1] = (byte) 0xD8;
        largeContent[2] = (byte) 0xFF;
        
        MockMultipartFile file = new MockMultipartFile(
            "image", "large.jpg", "image/jpeg", largeContent
        );

        ImageValidationException exception = assertThrows(
            ImageValidationException.class,
            () -> imageService.uploadImage(file, "products")
        );

        assertTrue(exception.getMessage().contains("5MB"));
        verify(ossClient, never()).putObject(any(PutObjectRequest.class));
    }

    /**
     * 测试上传不支持的文件格式
     * 验证需求：7.3 - 不支持的格式抛出验证异常
     */
    @Test
    void testUploadImage_UnsupportedFormat() {
        MockMultipartFile file = new MockMultipartFile(
            "image", "test.bmp", "image/bmp", new byte[]{0x42, 0x4D, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}
        );

        ImageValidationException exception = assertThrows(
            ImageValidationException.class,
            () -> imageService.uploadImage(file, "products")
        );

        assertTrue(exception.getMessage().contains("不支持"));
        verify(ossClient, never()).putObject(any(PutObjectRequest.class));
    }

    /**
     * 测试上传伪装的恶意文件（扩展名与内容不匹配）
     * 验证需求：7.4 - 通过魔数检测拒绝伪装文件
     */
    @Test
    void testUploadImage_FakeJpeg() {
        // 文件扩展名是.jpg，但内容不是JPEG
        byte[] fakeContent = "This is not a real image".getBytes();
        MockMultipartFile file = new MockMultipartFile(
            "image", "fake.jpg", "image/jpeg", fakeContent
        );

        ImageValidationException exception = assertThrows(
            ImageValidationException.class,
            () -> imageService.uploadImage(file, "products")
        );

        assertTrue(exception.getMessage().contains("不匹配") || exception.getMessage().contains("不是有效"));
        verify(ossClient, never()).putObject(any(PutObjectRequest.class));
    }

    /**
     * 测试上传null文件
     */
    @Test
    void testUploadImage_NullFile() {
        // ImageService 在访问 file.getOriginalFilename() 时会抛出 NullPointerException
        // 这是预期行为，因为 null 文件是无效输入
        assertThrows(
            NullPointerException.class,
            () -> imageService.uploadImage(null, "products")
        );
    }

    /**
     * 测试文件名为空
     */
    @Test
    void testUploadImage_EmptyFilename() {
        byte[] jpegHeader = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0, 0, 0, 0, 0, 0, 0};
        MockMultipartFile file = new MockMultipartFile(
            "image", "", "image/jpeg", jpegHeader
        );

        ImageValidationException exception = assertThrows(
            ImageValidationException.class,
            () -> imageService.uploadImage(file, "products")
        );

        assertTrue(exception.getMessage().contains("文件名"));
    }

    // ==================== 删除图片测试 ====================

    /**
     * 测试删除单个图片
     * 验证需求：7.5 - 删除图片从OSS中移除文件
     */
    @Test
    void testDeleteImage_Success() {
        String imageUrl = "https://test-bucket.oss-cn-hangzhou.aliyuncs.com/products/test.jpg";

        imageService.deleteImage(imageUrl);

        verify(ossClient, times(1)).deleteObject(eq("test-bucket"), anyString());
    }

    /**
     * 测试删除空URL
     */
    @Test
    void testDeleteImage_EmptyUrl() {
        imageService.deleteImage("");
        imageService.deleteImage(null);

        verify(ossClient, never()).deleteObject(anyString(), anyString());
    }

    /**
     * 测试批量删除图片
     * 验证需求：7.6 - 批量删除处理所有URL
     */
    @Test
    void testDeleteImages_Success() {
        List<String> urls = Arrays.asList(
            "https://test-bucket.oss-cn-hangzhou.aliyuncs.com/products/img1.jpg",
            "https://test-bucket.oss-cn-hangzhou.aliyuncs.com/products/img2.jpg",
            "https://test-bucket.oss-cn-hangzhou.aliyuncs.com/products/img3.jpg"
        );

        imageService.deleteImages(urls);

        verify(ossClient, times(3)).deleteObject(eq("test-bucket"), anyString());
    }

    /**
     * 测试批量删除空列表
     */
    @Test
    void testDeleteImages_EmptyList() {
        imageService.deleteImages(null);
        imageService.deleteImages(Arrays.asList());

        verify(ossClient, never()).deleteObject(anyString(), anyString());
    }

    /**
     * 测试批量删除部分失败
     */
    @Test
    void testDeleteImages_PartialFailure() {
        List<String> urls = Arrays.asList(
            "https://test-bucket.oss-cn-hangzhou.aliyuncs.com/products/img1.jpg",
            "https://test-bucket.oss-cn-hangzhou.aliyuncs.com/products/img2.jpg"
        );

        // 第二次删除抛出异常 - deleteObject 是 void 方法，使用 doThrow
        doThrow(new RuntimeException("OSS Error")).when(ossClient).deleteObject(eq("test-bucket"), contains("img2"));

        // 不应该抛出异常，应该继续处理
        assertDoesNotThrow(() -> imageService.deleteImages(urls));
    }

    // ==================== CDN域名测试 ====================

    /**
     * 测试使用CDN域名构建URL
     */
    @Test
    void testUploadImage_WithCdnDomain() throws IOException {
        when(ossProperties.getCdnDomain()).thenReturn("https://cdn.example.com");
        
        byte[] jpegHeader = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0, 0, 0, 0, 0, 0, 0};
        MockMultipartFile file = new MockMultipartFile(
            "image", "test.jpg", "image/jpeg", jpegHeader
        );

        String url = imageService.uploadImage(file, "products");

        assertNotNull(url);
        assertTrue(url.startsWith("https://cdn.example.com"));
    }
}
