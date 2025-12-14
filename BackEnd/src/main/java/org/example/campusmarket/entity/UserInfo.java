package org.example.campusmarket.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserInfo {
    @JsonProperty("id")
    private int user_id;
    private String username;
    private String nickname;
    private String avatar;
    private String email;
    private String phone;

    //分为admin管理员和user普通用户
    private String role;

    //简介
    private String bio;

    //学校名称
    private String school;

    //学号
    private String studentId;

    //注册时间
    @JsonProperty("createdAt")
    private LocalDateTime created_at;

}
