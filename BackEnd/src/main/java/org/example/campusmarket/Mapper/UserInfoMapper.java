package org.example.campusmarket.Mapper;

import org.apache.ibatis.annotations.*;
import org.example.campusmarket.entity.UserInfo;

@Mapper
public interface UserInfoMapper {
    
    // 插入用户信息（注册时创建基础记录，role 使用数据库默认值 'user'）
    @Insert("INSERT INTO userinfo (user_id, username, email) " +
            "VALUES (#{user_id}, #{username}, #{email})")
    int insertUserInfo(UserInfo userInfo);
    
    // 根据用户ID查询用户信息
    @Select("SELECT * FROM userinfo WHERE user_id = #{userId}")
    UserInfo findByUserId(@Param("userId") Integer userId);
    
    // 根据用户ID查询用户信息（别名方法，兼容不同调用方式）
    @Select("SELECT * FROM userinfo WHERE user_id = #{id}")
    UserInfo findById(@Param("id") Integer id);
    
    // 更新用户信息
    @Update("UPDATE userinfo SET " +
            "nickname = #{nickname}, " +
            "avatar = #{avatar}, " +
            "phone = #{phone}, " +
            "address = #{address}, " +
            "bio = #{bio}, " +
            "gender = #{gender}, " +
            "updated_at = NOW() " +
            "WHERE user_id = #{user_id}")
    int updateUserInfo(UserInfo userInfo);
    
    // 更新用户最后登录时间
    @Update("UPDATE userinfo SET last_login_at = NOW() WHERE user_id = #{userId}")
    int updateLastLoginAt(@Param("userId") Integer userId);
    
    // 更新邮箱（保持 users 和 userinfo 表一致）
    @Update("UPDATE userinfo SET email = #{newEmail}, updated_at = NOW() WHERE user_id = #{userId}")
    int updateEmailByUserId(@Param("userId") Integer userId, @Param("newEmail") String newEmail);
    
    // 更新用户名（保持 users 和 userinfo 表一致）
    @Update("UPDATE userinfo SET username = #{newUsername}, updated_at = NOW() WHERE user_id = #{userId}")
    int updateUsernameByUserId(@Param("userId") Integer userId, @Param("newUsername") String newUsername);
}
