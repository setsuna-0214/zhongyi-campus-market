package org.example.campusmarket.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserInfo {
    private Integer user_id;
    private String username;
    private String nickname;
    private String avatar;
    private String email;
    private String phone;
    private String address;
    private String bio;
    private String role;
    private Integer gender;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;
    private LocalDateTime last_login_at;
}
