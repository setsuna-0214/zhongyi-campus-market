package org.example.campusmarket.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

//用户设置相关 DTO 汇总：基本信息、密码变更、邮箱变更。


public class UserDto {
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    //重置个人信息
    public static class SetInfoRequest {
        @NotBlank
        @Size(min = 1, max = 20)
        private String nickname;

        @Size(max = 100)
        private String bio;

        @Size(min = 11, max = 11)
        private String phone;

        @Size(max = 100)
        private String address;

        private String avatar;

        //学校名称
        @Size(max = 100)
        private String school;

        //学号
        @Size(max = 50)
        private String studentId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    //重置密码
    public static class SetNewPasswordRequest {
        @NotBlank
        private String currentPassword;

        @NotBlank
        private String newPassword;

        private String confirmPassword;

        @NotBlank
        private String verificationCode;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    //重置邮箱
    public static class SetNewEmailRequest {
        @Email
        private String newEmail;

        @NotBlank
        private String verificationCode;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSearchItem {
        private Integer id;
        private String username;
        private String nickname;
        private String avatar;
        private String school;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchResponse {
        private java.util.List<UserSearchItem> items;
        private long total;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FollowItem {
        private Integer id;
        private String username;
        private String nickname;
        private String avatar;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FollowCheckResponse {
        private boolean isFollowing;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FollowOperationResponse {
        private boolean success;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvatarUploadResponse {
        private String avatarUrl;
    }

    // 邮箱修改响应
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailChangeResponse {
        private boolean success;
        private String message;
    }

    // 密码修改响应
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PasswordChangeResponse {
        private boolean success;
        private String message;
    }
}