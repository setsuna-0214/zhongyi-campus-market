package org.example.campusmarket.Controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.example.campusmarket.DTO.UserDto;
import org.example.campusmarket.Service.UserService;
import org.example.campusmarket.entity.Product;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.entity.UserInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.example.campusmarket.util.VerificationCodeService;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

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
    public Result SetUserInfo(HttpServletRequest request, @Valid @RequestBody UserDto.SetInfoRequest body,Authentication authentication){
        Integer user_id = (Integer) authentication.getPrincipal();
        boolean ok = userService.ResetUserInfo(user_id,body);
        if(!ok){
            return new Result(400,"修改失败",null);
        }
        // 返回更新后的完整用户信息
        UserInfo updatedUserInfo = userService.GetUserInfoById(user_id);
        return new Result(200,"修改完成",updatedUserInfo);
    }


    //上传用户头像
    @PostMapping("/me/avatar")
    public Result UploadAvatar(@RequestParam("avatar") MultipartFile avatar, Authentication authentication){
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            
            // 调用 Service 层上传头像
            String avatarUrl = userService.uploadAvatar(userId, avatar);
            
            // 返回头像 URL
            UserDto.AvatarUploadResponse response = new UserDto.AvatarUploadResponse(avatarUrl);
            return new Result(200, "头像上传成功", response);
            
        } catch (Exception e) {
            return new Result(400, "头像上传失败: " + e.getMessage(), null);
        }
    }


    //修改用户密码
    @PostMapping("/me/password")
    public UserDto.PasswordChangeResponse ResetPassword(HttpServletRequest request, @Valid @RequestBody UserDto.SetNewPasswordRequest body,Authentication authentication){
        Integer user_id =  (Integer)authentication.getPrincipal();
        UserInfo userinfo = userService.GetUserInfoById(user_id);
        //查找用户邮箱
        String email = userinfo.getEmail();

        //校验验证码是否正确
        boolean codeValid = codeService.verifyCode(email, body.getVerificationCode());
        if (!codeValid) {
            return new UserDto.PasswordChangeResponse(false, "验证码错误");
        }

        //对密码进行验证
        if(body.getNewPassword().equals(body.getCurrentPassword())){
            return new UserDto.PasswordChangeResponse(false, "不可与前一次密码一致");
        }
        // 如果提供了确认密码，则校验两次密码是否一致
        if(body.getConfirmPassword() != null && !body.getNewPassword().equals(body.getConfirmPassword())){
            return new UserDto.PasswordChangeResponse(false, "两次密码不一致");
        }
        //对密码进行修改
        boolean ok = userService.ResetPassword(user_id,body.getNewPassword());
        if(!ok){
            return new UserDto.PasswordChangeResponse(false, "修改失败");
        }
        return new UserDto.PasswordChangeResponse(true, "密码修改成功");
    }

    //邮箱变更说明,给邮箱发送即将变更的说明
    @PostMapping("/me/email/change-request")
    public UserDto.EmailChangeResponse RequestChange(Authentication authentication) {
        Integer user_id = (Integer) authentication.getPrincipal();
        boolean ok = userService.SendNotifyEmail(user_id);
        if (!ok) {
            return new UserDto.EmailChangeResponse(false, "通知邮件发送失败");
        }
        return new UserDto.EmailChangeResponse(true, "验证码已发送");
    }

    //邮箱变更确认，校验新邮箱的验证码
    @PostMapping("/me/email/change-confirm")
    public UserDto.EmailChangeResponse ResetEmail(Authentication authentication, @RequestBody Map<String, String> body){
        Integer user_id = (Integer) authentication.getPrincipal();

        String newEmail = body.get("newEmail");
        String code = body.get("verificationCode");
        if (newEmail == null || newEmail.isBlank() || code == null || code.isBlank()) {
            return new UserDto.EmailChangeResponse(false, "新邮箱与验证码不能为空");
        }

        boolean ok = userService.ConfirmEmailChange(user_id, newEmail, code);
        if (!ok) {
            return new UserDto.EmailChangeResponse(false, "验证码错误或邮箱更新失败");
        }
        return new UserDto.EmailChangeResponse(true, "邮箱修改成功");
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

    //关注用户
    @PostMapping("/follows/{id}")
    public Result FollowUser(@PathVariable("id") Integer followeeId, Authentication authentication) {
        Integer followerId = (Integer) authentication.getPrincipal();
        try {
            boolean success = userService.followUser(followerId, followeeId);
            if (success) {
                return new Result(200, "关注成功", null);
            } else {
                return new Result(400, "关注失败", null);
            }
        } catch (IllegalArgumentException e) {
            return new Result(400, e.getMessage(), null);
        } catch (Exception e) {
            return new Result(500, "关注失败: " + e.getMessage(), null);
        }
    }

    //取消关注用户
    @DeleteMapping("/follows/{id}")
    public Result UnfollowUser(@PathVariable("id") Integer followeeId, Authentication authentication) {
        Integer followerId = (Integer) authentication.getPrincipal();
        try {
            boolean success = userService.unfollowUser(followerId, followeeId);
            if (success) {
                return new Result(200, "取消关注成功", null);
            } else {
                return new Result(400, "取消关注失败", null);
            }
        } catch (Exception e) {
            return new Result(500, "取消关注失败: " + e.getMessage(), null);
        }
    }

    //获取关注列表
    @GetMapping("/follows")
    public Result GetFollowList(Authentication authentication) {
        Integer userId = (Integer) authentication.getPrincipal();
        try {
            List<UserDto.FollowItem> followList = userService.getFollowList(userId);
            return new Result(200, "成功", followList);
        } catch (Exception e) {
            return new Result(500, "查询失败", Collections.emptyList());
        }
    }

    //检查关注状态
    @GetMapping("/follows/{id}/check")
    public UserDto.FollowCheckResponse CheckFollowStatus(@PathVariable("id") Integer followeeId, Authentication authentication) {
        Integer followerId = (Integer) authentication.getPrincipal();
        try {
            boolean isFollowing = userService.checkFollowStatus(followerId, followeeId);
            return new UserDto.FollowCheckResponse(isFollowing);
        } catch (Exception e) {
            return new UserDto.FollowCheckResponse(false);
        }
    }

    // 搜索用户 (从 UsersController 迁移)
    @GetMapping("/search")
    public Result SearchUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        try {
            UserDto.SearchResponse response = userService.searchUsers(keyword, page, pageSize);
            return new Result(200, "搜索成功", response);
        } catch (Exception e) {
            return new Result(500, "搜索失败: " + e.getMessage(), null);
        }
    }

}
