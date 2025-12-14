package org.example.campusmarket.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.campusmarket.DTO.AuthDto;
import org.example.campusmarket.Service.AuthService;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.util.VerificationCodeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AuthController API 测试
 * 使用 MockMvc 测试认证相关的 REST 接口
 */
@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private VerificationCodeService codeService;

    // ==================== 发送验证码测试 ====================

    /**
     * 测试发送验证码成功
     */
    @Test
    @WithMockUser
    void testSendCode_Success() throws Exception {
        doNothing().when(authService).SendRegisterCode("test@test.com");

        Map<String, String> body = new HashMap<>();
        body.put("email", "test@test.com");

        mockMvc.perform(post("/auth/send-code")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("验证码发送成功"));
    }

    /**
     * 测试发送验证码 - 邮箱为空
     */
    @Test
    @WithMockUser
    void testSendCode_EmptyEmail() throws Exception {
        Map<String, String> body = new HashMap<>();
        body.put("email", "");

        mockMvc.perform(post("/auth/send-code")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("邮箱不能为空"));
    }

    /**
     * 测试发送验证码 - 发送过于频繁
     */
    @Test
    @WithMockUser
    void testSendCode_TooFrequent() throws Exception {
        doThrow(new IllegalStateException("发送过于频繁"))
                .when(authService).SendRegisterCode("test@test.com");

        Map<String, String> body = new HashMap<>();
        body.put("email", "test@test.com");

        mockMvc.perform(post("/auth/send-code")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(429));
    }

    // ==================== 登录测试 ====================

    /**
     * 测试邮箱登录成功
     */
    @Test
    @WithMockUser
    void testLogin_WithEmail_Success() throws Exception {
        Map<String, Object> data = new HashMap<>();
        data.put("token", "jwt-token-here");
        Result successResult = new Result(200, "登录成功", data);
        
        when(authService.login("test@test.com", "password123")).thenReturn(successResult);

        AuthDto.LoginRequest request = new AuthDto.LoginRequest();
        request.setEmail("test@test.com");
        request.setPassword("password123");

        mockMvc.perform(post("/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("登录成功"));
    }

    /**
     * 测试用户名登录成功
     */
    @Test
    @WithMockUser
    void testLogin_WithUsername_Success() throws Exception {
        Map<String, Object> data = new HashMap<>();
        data.put("token", "jwt-token-here");
        Result successResult = new Result(200, "登录成功", data);
        
        when(authService.login_username("testuser", "password123")).thenReturn(successResult);

        AuthDto.LoginRequest request = new AuthDto.LoginRequest();
        request.setUsername("testuser");
        request.setPassword("password123");

        mockMvc.perform(post("/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    /**
     * 测试登录 - 邮箱和用户名都为空
     */
    @Test
    @WithMockUser
    void testLogin_EmptyCredentials() throws Exception {
        AuthDto.LoginRequest request = new AuthDto.LoginRequest();
        request.setPassword("password123");

        mockMvc.perform(post("/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("邮箱或用户名不能为空"));
    }

    // ==================== 注册测试 ====================

    /**
     * 测试注册成功
     */
    @Test
    @WithMockUser
    void testRegister_Success() throws Exception {
        when(codeService.verifyCode("test@test.com", "123456")).thenReturn(true);
        when(authService.register("newuser", "test@test.com", "password123"))
                .thenReturn(new Result(200, "注册成功", null));

        AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();
        request.setUsername("newuser");
        request.setEmail("test@test.com");
        request.setPassword("password123");
        request.setConfirmPassword("password123");
        request.setVerificationCode("123456");

        mockMvc.perform(post("/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("注册成功"));

        verify(codeService, times(1)).clearCode("test@test.com");
    }

    /**
     * 测试注册 - 两次密码不一致
     */
    @Test
    @WithMockUser
    void testRegister_PasswordMismatch() throws Exception {
        AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();
        request.setUsername("newuser");
        request.setEmail("test@test.com");
        request.setPassword("password123");
        request.setConfirmPassword("different");
        request.setVerificationCode("123456");

        mockMvc.perform(post("/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("两次密码不一致"));
    }

    /**
     * 测试注册 - 验证码错误
     */
    @Test
    @WithMockUser
    void testRegister_InvalidCode() throws Exception {
        when(codeService.verifyCode("test@test.com", "wrong")).thenReturn(false);

        AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();
        request.setUsername("newuser");
        request.setEmail("test@test.com");
        request.setPassword("password123");
        request.setConfirmPassword("password123");
        request.setVerificationCode("wrong");

        mockMvc.perform(post("/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("验证码错误或已过期"));
    }

    // ==================== 忘记密码测试 ====================

    /**
     * 测试忘记密码成功
     */
    @Test
    @WithMockUser
    void testForgotPassword_Success() throws Exception {
        when(codeService.verifyCode("test@test.com", "123456")).thenReturn(true);
        when(authService.reset_password("test@test.com", "newpassword"))
                .thenReturn(new Result(200, "密码更新成功", null));

        AuthDto.ForgotPasswordRequest request = new AuthDto.ForgotPasswordRequest();
        request.setEmail("test@test.com");
        request.setVerificationCode("123456");
        request.setNewPassword("newpassword");
        request.setConfirmPassword("newpassword");

        mockMvc.perform(post("/auth/forgot-password")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    /**
     * 测试忘记密码 - 两次密码不一致
     */
    @Test
    @WithMockUser
    void testForgotPassword_PasswordMismatch() throws Exception {
        AuthDto.ForgotPasswordRequest request = new AuthDto.ForgotPasswordRequest();
        request.setEmail("test@test.com");
        request.setVerificationCode("123456");
        request.setNewPassword("newpassword");
        request.setConfirmPassword("different");

        mockMvc.perform(post("/auth/forgot-password")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("两次密码不一致"));
    }
}
