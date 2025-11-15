package org.example.campusmarket.Controller;


import jakarta.validation.Valid;
import org.apache.coyote.Response;
import org.example.campusmarket.DTO.ForgotPasswordRequest;
import org.example.campusmarket.DTO.LoginRequest;
import org.example.campusmarket.DTO.RegisterRequest;
import org.example.campusmarket.Service.AuthService;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.example.campusmarket.util.VerificationCodeService;

import java.awt.geom.RectangularShape;

//登录功能
@RestController
@RequestMapping("/auth")
public class AuthController {
    //验证码服务
    private final VerificationCodeService codeService;
    //注册服务
    private final AuthService authService;
    public AuthController(VerificationCodeService codeService,AuthService authService){
        this.codeService = codeService;
        this.authService = authService;
    }

    @PostMapping("/send-code")
    public Result SendRegisterCode(@RequestBody java.util.Map<String,String> body){
        String email = body == null ? null : body.get("email");
        if(email == null || email.isBlank()){
            return new Result(400,"邮箱不能为空",null);
        }
        try {
            authService.SendRegisterCode(email);
            return new Result(200,"验证码发送成功",null);
        }catch (IllegalStateException e){
            return new Result(429,"发送过于频繁，请稍后再试",null);
        }
    }

    //注册功能
    @PostMapping("/register")
    public Result register(@Valid @RequestBody RegisterRequest request){
        //@Valid注解对传递进来的参数进行校验。

        //两次密码一致性校验
        if(!request.getPassword().equals(request.getConfirmPassword())){
            return new Result(400,"两次密码不一致",null);
        }
        //验证码正确性与有效性校验
        boolean ok = codeService.verifyCode(request.getEmail(), request.getVerificationCode());
        if(!ok){
            return new Result(400,"验证码错误或已过期",null);
        }
        //进行用户的注册
        Result result = authService.register(request.getUsername(), request.getEmail(), request.getPassword());

        // 只有注册成功时清理验证码，避免重复使用
        if (result != null && result.getCode() != null && result.getCode() == 200) {
            codeService.clearCode(request.getEmail());
        }

        return result;
    }

    //邮箱登录
    @PostMapping("/login")
    public Result login(@Valid @RequestBody LoginRequest request){
        if(request.getEmail() == null){
            return new Result(400,"邮箱不能为空",null);
        }
        return authService.login(request.getEmail(),request.getPassword());
    }

    //用户名登录
    @PostMapping("/login-username")
    public Result login_username(@Valid @RequestBody LoginRequest request){
        if(request.getUsername() == null){
            return new Result(400,"用户名不能为空",null);
        }
        return  authService.login_username(request.getUsername(), request.getPassword());
    }

    //忘记密码
    @PostMapping("/forgot-password")
    public Result forgot_password(@Valid @RequestBody ForgotPasswordRequest request){
        //密码一致性校验
        if(!request.getNewPassword().equals(request.getConfirmPassword())){
            return new Result(400,"两次密码不一致",null);
        }
        //验证码正确性与有效性校验 关于验证码的部分，为了减少工作量，复用了注册时的验证码逻辑
        boolean ok = codeService.verifyCode(request.getEmail(), request.getVerificationCode());
        if(!ok){
            return new Result(400,"验证码错误或已过期",null);
        }
        return authService.reset_password(request.getEmail(),request.getNewPassword());
    }
}
