package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.SetInfoRequest;
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

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
public class UserService {
    @Autowired
    private static UserMapper userMapper;

    @Autowired
    private VerificationCodeService codeService;

    @Autowired
    private AuthMapper authMapper;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    //通过id查找用户信息
    public UserInfo GetUserInfoById(Integer user_id){
        return userMapper.findUserinfoById(user_id);
    }
    //更新用户信息
    public static boolean ResetUserInfo(Integer user_id, @RequestBody SetInfoRequest body){
        return userMapper.updateUserInfo(user_id,body.getAvatar(),body.getNickname(),body.getPhone(),body.getAddress()) == 1;
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

}

