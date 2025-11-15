package org.example.campusmarket.Controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.example.campusmarket.DTO.SetInfoRequest;
import org.example.campusmarket.DTO.SetNewEmailRequest;
import org.example.campusmarket.DTO.SetNewPasswordRequest;
import org.example.campusmarket.Service.UserService;
import org.example.campusmarket.entity.Product;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.entity.UserInfo;
import org.example.campusmarket.util.TokenUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.example.campusmarket.util.VerificationCodeService;
import org.springframework.security.core.Authentication;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user")
public class UserController {
    @Autowired
    private final UserService userService;
    private final VerificationCodeService codeService;
    public UserController(UserService userService, VerificationCodeService codeService) {
        this.userService = userService;
        this.codeService = codeService;
    }

    //查看用户主页信息
    @GetMapping("/me")
    public Result GetUserInfo(HttpServletRequest request,Authentication authentication){
        Integer user_id = (Integer) authentication.getPrincipal();
        UserInfo userinfo = userService.GetUserInfoById(user_id);
        if(userinfo == null){
            return new Result(404,"用户不存在",null);
        }
        return new Result(200,"成功",userinfo);
    }

    //更新用户基本信息
    @PutMapping("/me")
    public Result SetUserInfo(HttpServletRequest request, @Valid @RequestBody SetInfoRequest body,Authentication authentication){
        Integer user_id = (Integer) authentication.getPrincipal();
        boolean ok = UserService.ResetUserInfo(user_id,body);
        return new Result(200,"修改完成",null);
    }






    //上传用户头像
    //暂时搁置，等考虑清楚头像存储方案再做考虑
    @PostMapping("/me/avatar")
    public Result UploadAvatar(){
        return new Result();
    }




    //修改用户密码
    @PostMapping("/me/password")
    public Result ResetPassword(HttpServletRequest request, @Valid @RequestBody SetNewPasswordRequest body,Authentication authentication){
        Integer user_id =  (Integer)authentication.getPrincipal();
        UserInfo userinfo = userService.GetUserInfoById(user_id);
        //查找用户邮箱
        String email = userinfo.getEmail();

        //校验验证码是否正确
        boolean codeValid = codeService.verifyCode(email, body.getVerificationCode());
        if (!codeValid) {
            return new Result(400, "验证码错误", null);
        }

        //对密码进行验证
        if(body.getNewPassword().equals(body.getOldPassword())){
            return new Result(400,"不可与前一次密码一致",null);
        }
        if(body.getNewPassword().equals(body.getConfirmPassword())){
            return new Result(400,"两次密码不一致",null);
        }
        //对密码进行修改
        boolean ok = userService.ResetPassword(user_id,body.getNewPassword());
        if(!ok){
            return new Result(400,"修改失败",null);
        }
        return new Result(200,"修改成功",null);
    }

    //邮箱变更说明,给邮箱发送即将变更的说明
    @PostMapping("/me/email/change-request")
    public Result RequestChange(Authentication authentication) {
        Integer user_id = (Integer) authentication.getPrincipal();
        boolean ok = userService.SendNotifyEmail(user_id);
        if (!ok) {
            return new Result(500, "通知邮件发送失败", null);
        }
        return new Result(200, "通知邮件已发送至原邮箱", null);
    }

    //邮箱变更确认，校验新邮箱的验证码
    @PostMapping("me/email/change-confirm")
    public Result ResetEmail(Authentication authentication, @RequestBody Map<String, String> body){
        Integer user_id = (Integer) authentication.getPrincipal();

        String newEmail = body.get("newEmail");
        String code = body.get("verificationCode");
        if (newEmail == null || newEmail.isBlank() || code == null || code.isBlank()) {
            return new Result(400, "新邮箱与验证码不能为空", null);
        }

        boolean ok = userService.ConfirmEmailChange(user_id, newEmail, code);
        if (!ok) {
            return new Result(400, "验证码错误或邮箱更新失败", null);
        }
        return new Result(200, "邮箱更新成功", null);
    }

    //查询用户发布的商品
    @GetMapping("/published")
    public Result GetMyPublished(Authentication authentication) {
        Integer user_id = (Integer) authentication.getPrincipal();
        try {
            List<Product> items = userService.GetPublishedProducts(user_id);
            //如果没有发布商品则返回空列表
            return new Result(200, "成功", items == null ? Collections.emptyList() : items);
        } catch (Exception e) {
            return new Result(500, "查询失败", null);
        }
    }

    //查询用户购买的商品
    @GetMapping("/purchases")
    public Result GetMyPurchases(Authentication authentication) {
        Integer user_id = (Integer) authentication.getPrincipal();
        try {
            List<Product> items = userService.GetPurchasedProducts(user_id);
            return new Result(200, "成功", items);
        } catch (Exception e) {
            return new Result(500, "查询失败", null);
        }
    }

    //查询用户发布，购买，收藏的商品
    @GetMapping("/collections")
    public Result GetMyCollections(Authentication authentication) {
        Integer user_id = (Integer) authentication.getPrincipal();
        try {
            Map<String, Object> data = userService.GetUserCollections(user_id);
            return new Result(200, "成功", data);
        } catch (Exception e) {
            return new Result(500, "查询失败", null);
        }
    }

}
