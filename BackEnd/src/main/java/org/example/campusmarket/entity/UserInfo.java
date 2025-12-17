package org.example.campusmarket.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserInfo {
    @JsonProperty("id")
    private Integer user_id;
    private String username;
    private String nickname;
    private String avatar;
    private String email;
    private String phone;
    private String address;
    private String bio;
    @JsonIgnore
    private String role;
    private Integer gender;
    @JsonProperty("joinDate")
    private LocalDateTime created_at;
    @JsonIgnore
    private LocalDateTime updated_at;
    @JsonProperty("lastLoginAt")
    private LocalDateTime last_login_at;
}
