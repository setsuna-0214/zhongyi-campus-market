package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.UserDto;
import org.example.campusmarket.Mapper.AuthMapper;
import org.example.campusmarket.Mapper.UserMapper;
import org.example.campusmarket.entity.Product;
import org.example.campusmarket.entity.UserInfo;
import org.example.campusmarket.util.VerificationCodeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * UserService 单元测试
 * 测试用户信息管理、关注功能
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserMapper userMapper;

    @Mock
    private AuthMapper authMapper;

    @Mock
    private VerificationCodeService codeService;

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private ImageService imageService;

    @InjectMocks
    private UserService userService;

    private UserInfo testUserInfo;

    @BeforeEach
    void setUp() {
        // 注入邮件发送者地址
        ReflectionTestUtils.setField(userService, "from", "test@campus.com");

        testUserInfo = new UserInfo();
        testUserInfo.setUser_id(1);
        testUserInfo.setUsername("testuser");
        testUserInfo.setEmail("test@test.com");
        testUserInfo.setNickname("测试用户");
        testUserInfo.setAvatar("http://example.com/avatar.jpg");
        testUserInfo.setPhone("13800138000");
        testUserInfo.setSchool("北京大学");
    }

    // ==================== 用户信息查询测试 ====================

    /**
     * 测试查询用户信息
     * 验证需求：2.1 - 返回完整的用户资料
     */
    @Test
    void testGetUserInfoById() {
        when(userMapper.findUserinfoById(1)).thenReturn(testUserInfo);

        UserInfo result = userService.GetUserInfoById(1);

        assertNotNull(result);
        assertEquals(1, result.getUser_id());
        assertEquals("testuser", result.getUsername());
        assertEquals("test@test.com", result.getEmail());
        assertEquals("测试用户", result.getNickname());
    }

    /**
     * 测试查询不存在的用户
     */
    @Test
    void testGetUserInfoById_NotFound() {
        when(userMapper.findUserinfoById(999)).thenReturn(null);

        UserInfo result = userService.GetUserInfoById(999);

        assertNull(result);
    }

    // ==================== 头像上传测试 ====================

    /**
     * 测试上传头像成功
     * 验证需求：2.3 - 上传新头像并删除旧头像
     */
    @Test
    void testUploadAvatar_Success() {
        when(userMapper.findUserinfoById(1)).thenReturn(testUserInfo);
        when(imageService.uploadImage(any(MultipartFile.class), eq("avatars")))
            .thenReturn("http://example.com/new-avatar.jpg");
        when(userMapper.updateAvatar(1, "http://example.com/new-avatar.jpg")).thenReturn(1);

        MultipartFile mockFile = mock(MultipartFile.class);
        String result = userService.uploadAvatar(1, mockFile);

        assertEquals("http://example.com/new-avatar.jpg", result);
        // 验证删除了旧头像
        verify(imageService, times(1)).deleteImage("http://example.com/avatar.jpg");
    }

    /**
     * 测试上传头像 - 用户不存在
     */
    @Test
    void testUploadAvatar_UserNotFound() {
        when(userMapper.findUserinfoById(999)).thenReturn(null);

        MultipartFile mockFile = mock(MultipartFile.class);

        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> userService.uploadAvatar(999, mockFile)
        );

        assertTrue(exception.getMessage().contains("用户不存在"));
        verify(imageService, never()).uploadImage(any(), any());
    }

    /**
     * 测试上传头像 - 数据库更新失败
     */
    @Test
    void testUploadAvatar_UpdateFailed() {
        when(userMapper.findUserinfoById(1)).thenReturn(testUserInfo);
        when(imageService.uploadImage(any(MultipartFile.class), eq("avatars")))
            .thenReturn("http://example.com/new-avatar.jpg");
        when(userMapper.updateAvatar(1, "http://example.com/new-avatar.jpg")).thenReturn(0);

        MultipartFile mockFile = mock(MultipartFile.class);

        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> userService.uploadAvatar(1, mockFile)
        );

        assertTrue(exception.getMessage().contains("头像更新失败"));
        // 验证删除了新上传的头像（回滚）
        verify(imageService, times(1)).deleteImage("http://example.com/new-avatar.jpg");
    }

    // ==================== 关注功能测试 ====================

    /**
     * 测试关注用户成功
     * 验证需求：2.4 - 创建关注关系
     */
    @Test
    void testFollowUser_Success() {
        when(userMapper.checkFollowExists(1, 2)).thenReturn(0);
        when(userMapper.insertFollow(1, 2)).thenReturn(1);

        boolean result = userService.followUser(1, 2);

        assertTrue(result);
        verify(userMapper, times(1)).insertFollow(1, 2);
    }

    /**
     * 测试关注用户 - 已关注（幂等性）
     */
    @Test
    void testFollowUser_AlreadyFollowed() {
        when(userMapper.checkFollowExists(1, 2)).thenReturn(1);

        boolean result = userService.followUser(1, 2);

        assertTrue(result);
        verify(userMapper, never()).insertFollow(anyInt(), anyInt());
    }

    /**
     * 测试关注自己
     * 验证需求：2.6 - 关注自己抛出异常
     */
    @Test
    void testFollowUser_Self() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> userService.followUser(1, 1)
        );

        assertTrue(exception.getMessage().contains("不能关注自己"));
        verify(userMapper, never()).insertFollow(anyInt(), anyInt());
    }

    /**
     * 测试取消关注
     * 验证需求：2.5 - 删除关注关系
     */
    @Test
    void testUnfollowUser_Success() {
        when(userMapper.deleteFollow(1, 2)).thenReturn(1);

        boolean result = userService.unfollowUser(1, 2);

        assertTrue(result);
        verify(userMapper, times(1)).deleteFollow(1, 2);
    }

    /**
     * 测试取消关注 - 不存在的关注（幂等性）
     */
    @Test
    void testUnfollowUser_NotExists() {
        when(userMapper.deleteFollow(1, 2)).thenReturn(0);

        // 即使不存在也返回成功（幂等性）
        boolean result = userService.unfollowUser(1, 2);

        assertTrue(result);
    }

    /**
     * 测试获取关注列表
     */
    @Test
    void testGetFollowList() {
        UserDto.FollowItem item1 = new UserDto.FollowItem();
        item1.setId(2);
        item1.setUsername("user2");
        item1.setNickname("用户2");

        UserDto.FollowItem item2 = new UserDto.FollowItem();
        item2.setId(3);
        item2.setUsername("user3");
        item2.setNickname("用户3");

        when(userMapper.findFollowList(1)).thenReturn(Arrays.asList(item1, item2));

        List<UserDto.FollowItem> result = userService.getFollowList(1);

        assertNotNull(result);
        assertEquals(2, result.size());
    }

    /**
     * 测试获取关注列表 - 空结果
     */
    @Test
    void testGetFollowList_Empty() {
        when(userMapper.findFollowList(1)).thenReturn(null);

        List<UserDto.FollowItem> result = userService.getFollowList(1);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    /**
     * 测试检查关注状态
     */
    @Test
    void testCheckFollowStatus() {
        when(userMapper.checkFollowExists(1, 2)).thenReturn(1);
        when(userMapper.checkFollowExists(1, 3)).thenReturn(0);

        assertTrue(userService.checkFollowStatus(1, 2));
        assertFalse(userService.checkFollowStatus(1, 3));
    }

    // ==================== 用户搜索测试 ====================

    /**
     * 测试搜索用户
     * 验证需求：2.7 - 返回匹配的用户列表和总数
     */
    @Test
    void testSearchUsers() {
        UserDto.UserSearchItem item = new UserDto.UserSearchItem();
        item.setId(1);
        item.setUsername("testuser");
        item.setNickname("测试用户");

        when(userMapper.searchUsers("test", 0, 10)).thenReturn(Arrays.asList(item));
        when(userMapper.countSearchUsers("test")).thenReturn(1L);

        UserDto.SearchResponse result = userService.searchUsers("test", 1, 10);

        assertNotNull(result);
        assertEquals(1, result.getItems().size());
        assertEquals(1L, result.getTotal());
    }

    /**
     * 测试搜索用户 - 空关键词
     */
    @Test
    void testSearchUsers_EmptyKeyword() {
        when(userMapper.searchUsers(null, 0, 10)).thenReturn(Collections.emptyList());
        when(userMapper.countSearchUsers(null)).thenReturn(0L);

        UserDto.SearchResponse result = userService.searchUsers("   ", 1, 10);

        assertNotNull(result);
        // 空格关键词应该被处理为null
        verify(userMapper).searchUsers(null, 0, 10);
    }

    // ==================== 用户商品查询测试 ====================

    /**
     * 测试获取用户发布的商品
     */
    @Test
    void testGetPublishedProducts() {
        Product product = new Product();
        product.setPro_id(1);
        product.setPro_name("测试商品");

        when(userMapper.findPublishedProducts(1)).thenReturn(Arrays.asList(product));

        List<Product> result = userService.GetPublishedProducts(1);

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    /**
     * 测试获取用户购买的商品
     */
    @Test
    void testGetPurchasedProducts() {
        Product product = new Product();
        product.setPro_id(1);
        product.setPro_name("已购商品");

        when(userMapper.findPurchasedProducts(1)).thenReturn(Arrays.asList(product));

        List<Product> result = userService.GetPurchasedProducts(1);

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    /**
     * 测试获取用户收藏的商品
     */
    @Test
    void testGetFavoriteProducts() {
        when(userMapper.findFavoriteProducts(1)).thenReturn(null);

        List<Product> result = userService.GetFavoriteProducts(1);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ==================== 邮箱变更测试 ====================

    /**
     * 测试邮箱变更确认成功
     */
    @Test
    void testConfirmEmailChange_Success() {
        when(codeService.verifyCode("new@test.com", "123456")).thenReturn(true);
        when(userMapper.findUserinfoById(1)).thenReturn(testUserInfo);
        when(userMapper.updateEmail(1, "new@test.com")).thenReturn(1);
        when(authMapper.updateEmailByEmail("test@test.com", "new@test.com")).thenReturn(1);

        boolean result = userService.ConfirmEmailChange(1, "new@test.com", "123456");

        assertTrue(result);
        verify(codeService, times(1)).clearCode("new@test.com");
    }

    /**
     * 测试邮箱变更确认 - 验证码错误
     */
    @Test
    void testConfirmEmailChange_InvalidCode() {
        when(codeService.verifyCode("new@test.com", "wrong")).thenReturn(false);

        boolean result = userService.ConfirmEmailChange(1, "new@test.com", "wrong");

        assertFalse(result);
        verify(userMapper, never()).updateEmail(anyInt(), anyString());
    }
}
