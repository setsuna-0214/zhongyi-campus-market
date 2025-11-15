package org.example.campusmarket.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@AllArgsConstructor
@NoArgsConstructor
//定义用户实体类
public class User {
    private Integer user_id;
    private String username;

    private String email;
    private String password;


    //暂时先定义这些吧，等下看看要不要添加注册时间，登录时间，头像地址等
}
