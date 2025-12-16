package org.example.campusmarket.Controller;


import jakarta.validation.Valid;
import org.example.campusmarket.DTO.AuthDto;
import org.example.campusmarket.Service.AuthService;
import org.example.campusmarket.entity.Result;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.example.campusmarket.util.VerificationCodeService;

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
            return authService.SendRegisterCode(email);
        }catch (IllegalStateException e){
            return new Result(429,"发送过于频繁，请稍后再试",null);
        }
    }

    //注册功能
    @PostMapping("/register")
    public Result register(@Valid @RequestBody AuthDto.RegisterRequest request){
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

    //登录（支持邮箱或用户名二选一）
    @PostMapping("/login")
    public Result login(@Valid @RequestBody AuthDto.LoginRequest request){
        // 优先使用邮箱登录，如果邮箱为空则使用用户名登录
        if(request.getEmail() != null && !request.getEmail().isBlank()){
            return authService.login(request.getEmail(), request.getPassword());
        } else if(request.getUsername() != null && !request.getUsername().isBlank()){
            return authService.login_username(request.getUsername(), request.getPassword());
        } else {
            return new Result(400, "邮箱或用户名不能为空", null);
        }
    }

    //忘记密码
    @PostMapping("/forgot-password")
    public Result forgot_password(@Valid @RequestBody AuthDto.ForgotPasswordRequest request){
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
