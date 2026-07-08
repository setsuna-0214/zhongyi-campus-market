package org.example.campusmarket.Mapper;

import org.apache.ibatis.annotations.*;
import org.example.campusmarket.entity.User;

@Mapper
public interface AuthMapper {
    // 通过用户名查询用户（判断是否已存在，排除已注销用户）
    @Select("SELECT * FROM users WHERE username = #{username} AND (is_deleted IS NULL OR is_deleted = 0)")
    User findByUsername(@Param("username") String username);

    // 通过邮箱查询用户（排除已注销用户）
    @Select("SELECT * FROM users WHERE email = #{email} AND (is_deleted IS NULL OR is_deleted = 0)")
    User findByEmail(@Param("email") String email);

    // 插入用户（role 使用数据库默认值 'user'）
    @Insert("INSERT INTO users (username, email, password) VALUES (#{username}, #{email}, #{password})")
    @Options(useGeneratedKeys = true, keyProperty = "user_id")
    int insertUser(User user);

    // 通过邮箱查询用户并修改密码
    @Update("UPDATE users SET password = #{password} WHERE email = #{email}")
    int updatePassword(@Param("email") String email, @Param("password") String password);

    // 通过用户ID查询用户（用于 JWT 鉴权过滤器在缺失 role claim 时回退查询用户角色）
    @Select("SELECT * FROM users WHERE user_id = #{userId}")
    User findById(@Param("userId") Integer userId);

    // 修改用户邮箱,保证用户数据在两张表中的一致性
    @Update("UPDATE users SET email = #{newEmail} WHERE email = #{oldEmail}")
    int updateEmailByEmail(@Param("oldEmail") String oldEmail,
            @Param("newEmail") String newEmail);

    // 软删除用户（标记为已注销，并释放用户名和邮箱供重新注册）
    // 通过添加 _deleted_{user_id} 后缀来释放原值
    @Update("UPDATE users SET is_deleted = 1, deleted_at = NOW(), " +
            "username = CONCAT(username, '_deleted_', user_id), " +
            "email = CONCAT(email, '_deleted_', user_id) " +
            "WHERE user_id = #{userId}")
    int softDeleteUser(@Param("userId") Integer userId);
}
