package org.example.campusmarket.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.campusmarket.Service.UserService;
import org.example.campusmarket.entity.Product;
import org.example.campusmarket.entity.UserInfo;
import org.example.campusmarket.util.VerificationCodeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * UserController API 测试
 */
@WebMvcTest(controllers = UserController.class)
@Import(TestSecurityConfig.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private VerificationCodeService codeService;

    /**
     * 创建模拟认证，principal 为 Integer userId
     */
    private Authentication createAuth(Integer userId) {
        return new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
    }

    @Test
    void testGetUserInfo_Success() throws Exception {
        UserInfo userInfo = new UserInfo();
        userInfo.setUser_id(1);
        userInfo.setUsername("testuser");
        when(userService.GetUserInfoById(eq(1))).thenReturn(userInfo);

        mockMvc.perform(get("/user/me").with(authentication(createAuth(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void testGetUserInfo_NotFound() throws Exception {
        when(userService.GetUserInfoById(eq(1))).thenReturn(null);

        mockMvc.perform(get("/user/me").with(authentication(createAuth(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    void testGetPublishedProducts() throws Exception {
        Product product = new Product();
        product.setPro_id(1);
        when(userService.GetPublishedProducts(eq(1))).thenReturn(Arrays.asList(product));

        mockMvc.perform(get("/user/published").with(authentication(createAuth(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void testFollowUser() throws Exception {
        when(userService.followUser(eq(1), eq(2))).thenReturn(true);

        mockMvc.perform(post("/user/follows/2").with(authentication(createAuth(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testUnfollowUser() throws Exception {
        when(userService.unfollowUser(eq(1), eq(2))).thenReturn(true);

        mockMvc.perform(delete("/user/follows/2").with(authentication(createAuth(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testGetFollowList() throws Exception {
        when(userService.getFollowList(eq(1))).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/user/follows").with(authentication(createAuth(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testCheckFollowStatus() throws Exception {
        when(userService.checkFollowStatus(eq(1), eq(2))).thenReturn(true);

        mockMvc.perform(get("/user/follows/2/check").with(authentication(createAuth(1))))
                .andExpect(status().isOk())
                // Jackson 序列化 boolean isFollowing 时会去掉 "is" 前缀，变成 "following"
                .andExpect(jsonPath("$.following").value(true));
    }
}
