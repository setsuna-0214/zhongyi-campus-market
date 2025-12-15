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
    

    // 插入用户（role 使用数据库默认值 'user'）
    @Insert("INSERT INTO users (username, email, password) VALUES (#{username}, #{email}, #{password})")
    @Options(useGeneratedKeys = true, keyProperty = "user_id")
    int insertUser(User user);

    //通过邮箱查询用户并修改密码
    @Update("UPDATE users SET password = #{password} WHERE email = #{email}")
    int updatePassword(@Param("email") String email, @Param("password") String password);

    //修改用户邮箱,保证用户数据在两张表中的一致性
    @Update("UPDATE users SET email = #{newEmail} WHERE email = #{oldEmail}")
    int updateEmailByEmail(@Param("oldEmail") String oldEmail,
                           @Param("newEmail") String newEmail);
}
