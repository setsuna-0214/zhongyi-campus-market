package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.UserDto;
import org.example.campusmarket.Mapper.AuthMapper;
import org.example.campusmarket.Mapper.UserMapper;
import org.example.campusmarket.entity.Product;
import org.example.campusmarket.entity.UserInfo;
import org.example.campusmarket.util.VerificationCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
public class UserService {
    @Autowired
    private UserMapper userMapper;

    @Autowired
    private VerificationCodeService codeService;

    @Autowired
    private AuthMapper authMapper;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private ImageService imageService;

    @Value("${spring.mail.username}")
    private String from;

    //通过id查找用户信息
    public UserInfo GetUserInfoById(Integer user_id){
        return userMapper.findUserinfoById(user_id);
    }
    //更新用户信息
    public boolean ResetUserInfo(Integer user_id, @RequestBody UserDto.SetInfoRequest body){
        return userMapper.updateUserInfo(user_id,body.getAvatar(),body.getNickname(),body.getPhone(),body.getAddress(),body.getSchool(),body.getStudentId()) == 1;
    }

    //更新密码
    public boolean ResetPassword(Integer user_id, String newPassword){
        return userMapper.updatePassword(user_id,newPassword) == 1;
    }

    //邮箱变更通知
    public boolean SendNotifyEmail(Integer user_id){
        UserInfo info = userMapper.findUserinfoById(user_id);
        if (info == null || info.getEmail() == null || info.getEmail().isBlank()) {
            return false;
        }
        String oldEmail = info.getEmail();

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(oldEmail);
        message.setSubject("邮箱变更通知");
        message.setText("您的账户正在申请变更绑定邮箱。如非本人操作，请立即修改密码或联系平台客服。");

        try {
            mailSender.send(message);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    //邮箱变更确认
    public boolean ConfirmEmailChange(Integer user_id,String email,String code){
        {
            boolean valid = codeService.verifyCode(email, code);
            if (!valid) {
                return false;
            }

            UserInfo info = userMapper.findUserinfoById(user_id);
            if (info == null || info.getEmail() == null) {
                return false;
            }
            String oldEmail = info.getEmail();
            //对两张表的用户邮箱同时进行更改，保证数据一致性
            int a = userMapper.updateEmail(user_id,email);
            int b = authMapper.updateEmailByEmail(oldEmail, email);
            codeService.clearCode(email);
            return a == 1 && b == 1;
        }
    }

    //查找已发布商品
    public List<Product> GetPublishedProducts(Integer user_id){
        return userMapper.findPublishedProducts(user_id);
    }

    //查找已购买商品
    public List<Product> GetPurchasedProducts(Integer user_id){
        return userMapper.findPurchasedProducts(user_id);
    }

    public List<Product> GetFavoriteProducts(Integer user_id){
        List<Product> items = userMapper.findFavoriteProducts(user_id);
        return items != null ? items : Collections.emptyList();
    }

    public Map<String, Object> GetUserCollections(Integer user_id){
        Map<String, Object> data = new HashMap<>();
        data.put("published", GetPublishedProducts(user_id));
        data.put("purchases", GetPurchasedProducts(user_id));
        data.put("favorites", GetFavoriteProducts(user_id));
        return data;
    }

    //上传用户头像
    public String uploadAvatar(Integer userId, MultipartFile file) {
        // 1. 获取用户当前信息，检查是否有旧头像
        UserInfo userInfo = userMapper.findUserinfoById(userId);
        if (userInfo == null) {
            throw new RuntimeException("用户不存在");
        }
        String oldAvatar = userInfo.getAvatar();

        // 2. 上传新头像到 OSS
        String newAvatarUrl = imageService.uploadImage(file, "avatars");

        // 3. 更新数据库中的头像字段
        int updated = userMapper.updateAvatar(userId, newAvatarUrl);
        if (updated != 1) {
            // 如果数据库更新失败，删除刚上传的新头像
            imageService.deleteImage(newAvatarUrl);
            throw new RuntimeException("头像更新失败");
        }

        // 4. 删除旧头像（如果存在）
        if (oldAvatar != null && !oldAvatar.isEmpty()) {
            imageService.deleteImage(oldAvatar);
        }

        return newAvatarUrl;
    }

    //搜索用户
    public UserDto.SearchResponse searchUsers(String keyword, int page, int pageSize) {
        // 处理空关键词情况（空字符串或仅包含空格）
        if (keyword != null && keyword.trim().isEmpty()) {
            keyword = null;
        }

        // 计算分页偏移量
        int offset = (page - 1) * pageSize;

        // 查询用户列表
        List<UserDto.UserSearchItem> items = userMapper.searchUsers(keyword, offset, pageSize);

        // 统计总数
        long total = userMapper.countSearchUsers(keyword);

        // 返回 SearchResponse
        return new UserDto.SearchResponse(items, total);
    }

    //关注用户
    public boolean followUser(Integer followerId, Integer followeeId) {
        // 验证不能关注自己
        if (followerId.equals(followeeId)) {
            throw new IllegalArgumentException("不能关注自己");
        }

        // 检查是否已经关注
        int exists = userMapper.checkFollowExists(followerId, followeeId);
        if (exists > 0) {
            // 已经关注，返回成功（幂等性）
            return true;
        }

        // 创建关注关系
        try {
            int result = userMapper.insertFollow(followerId, followeeId);
            return result > 0;
        } catch (Exception e) {
            // 处理可能的数据库约束异常（如重复插入）
            return true; // 幂等性处理
        }
    }

    //取消关注
    public boolean unfollowUser(Integer followerId, Integer followeeId) {
        // 删除关注关系
        int result = userMapper.deleteFollow(followerId, followeeId);
        // 无论是否存在关注关系，都返回成功（幂等性）
        return true;
    }

    //获取关注列表
    public List<UserDto.FollowItem> getFollowList(Integer userId) {
        List<UserDto.FollowItem> followList = userMapper.findFollowList(userId);
        return followList != null ? followList : Collections.emptyList();
    }

    //检查关注状态
    public boolean checkFollowStatus(Integer followerId, Integer followeeId) {
        int exists = userMapper.checkFollowExists(followerId, followeeId);
        return exists > 0;
    }

}

