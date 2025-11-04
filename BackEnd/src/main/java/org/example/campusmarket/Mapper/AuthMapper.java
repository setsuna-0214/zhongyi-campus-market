package org.example.campusmarket.Mapper;

import org.apache.ibatis.annotations.*;
import org.example.campusmarket.entity.User;


@Mapper
public interface AuthMapper {
    // 通过用户名查询用户（判断是否已存在）
    @Select("SELECT * FROM users WHERE username = #{username}")
    User findByUsername(@Param("username") String username);

    // 通过邮箱查询用户
    @Select("SELECT * FROM users WHERE email = #{email}")
    User findByEmail(@Param("email") String email);
    

    // 插入用户
    @Insert("INSERT INTO users (username, email, password) VALUES (#{username}, #{email}, #{password})")
    int insertUser(User user);

    //通过邮箱查询用户并修改密码
    @Update("UPDATE users SET password = #{password} WHERE email = #{email}")
    int updatePassword(@Param("email") String email, @Param("password") String password);
}
