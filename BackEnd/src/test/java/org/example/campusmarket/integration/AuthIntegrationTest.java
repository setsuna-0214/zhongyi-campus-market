package org.example.campusmarket.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 认证模块集成测试
 * 路径: /auth
 */
@DisplayName("认证模块集成测试")
class AuthIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("用户登录 - 使用邮箱")
    void testLogin_WithEmail() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("email", "test1@test.com");
        request.put("password", "password123");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("用户登录 - 使用用户名")
    void testLogin_WithUsername() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("username", "testuser1");
        request.put("password", "password123");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("用户登录 - 邮箱或用户名为空")
    void testLogin_EmptyCredentials() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("password", "password123");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("发送验证码")
    void testSendVerificationCode() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("email", "newuser@test.com");

        mockMvc.perform(post("/auth/send-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("发送验证码 - 邮箱为空")
    void testSendVerificationCode_EmptyEmail() throws Exception {
        Map<String, String> request = new HashMap<>();

        mockMvc.perform(post("/auth/send-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("用户注册 - 密码不一致")
    void testRegister_PasswordMismatch() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("username", "newuser");
        request.put("email", "newuser@test.com");
        request.put("password", "password123");
        request.put("confirmPassword", "differentpassword");
        request.put("verificationCode", "123456");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("忘记密码 - 密码不一致")
    void testForgotPassword_PasswordMismatch() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("email", "test1@test.com");
        request.put("newPassword", "newpassword123");
        request.put("confirmPassword", "differentpassword");
        request.put("verificationCode", "123456");

        mockMvc.perform(post("/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }
}
