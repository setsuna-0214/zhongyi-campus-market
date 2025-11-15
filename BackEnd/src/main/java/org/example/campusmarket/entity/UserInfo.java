package org.example.campusmarket.entity;

import lombok.Data;

@Data
public class UserInfo {
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

}
