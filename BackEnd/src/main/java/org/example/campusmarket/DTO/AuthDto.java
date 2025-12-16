package org.example.campusmarket.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

//认证相关 DTO 汇总：登录、注册、忘记密码等请求体。

public class AuthDto {
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        // 邮箱和用户名二选一，允许为空，但如果提供了邮箱则必须是有效格式
        @Email(message = "邮箱格式不正确")
        private String email;

        private String username;

        @NotBlank(message = "密码不能为空")
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank
        private String username;

        @Email
        @NotBlank
        private String email;

        @NotBlank
        private String password;

        private String confirmPassword;

        @NotBlank
        private String verificationCode;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForgotPasswordRequest {
        @NotBlank
        @Email
        private String email;

        @NotBlank
        private String verificationCode;

        @NotBlank
        private String newPassword;

        private String confirmPassword;
    }
}