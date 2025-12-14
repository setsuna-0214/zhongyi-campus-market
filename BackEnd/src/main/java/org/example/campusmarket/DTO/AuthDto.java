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
        @Email
        private String email;

        private String username;

        @NotBlank
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