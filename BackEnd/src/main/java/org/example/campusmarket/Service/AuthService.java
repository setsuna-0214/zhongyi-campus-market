package org.example.campusmarket.Service;

import org.example.campusmarket.Mapper.AuthMapper;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.entity.User;
import org.example.campusmarket.util.PasswordEncrypt;
import org.example.campusmarket.util.TokenUtil;
import org.example.campusmarket.util.VerificationCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
@Service
public class AuthService {
    @Autowired
    private AuthMapper authMapper;
    private final VerificationCodeService codeService;

    // JWT 签名密钥与过期秒数，从配置文件注入
    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-seconds:3600}")
    private long jwtExpSeconds;

    public AuthService(VerificationCodeService codeService){
        this.codeService = codeService;
    }

    //验证码发送服务
    public void SendRegisterCode(String email){
        codeService.sendCode(email);
    }

    //注册方法
    public Result register(String username,String email,String password){

        if(authMapper.findByUsername(username) != null){
            return new Result(400,"用户名已存在",null);
        }
        if(authMapper.findByEmail(email) != null){
            return new Result(400,"该邮箱已被注册",null);
        }
        //将密码进行加密
        String hashed = PasswordEncrypt.hash(password);
        User user = new User(null,username,email,hashed);
        return authMapper.insertUser(user)==1 ? new Result(200,"注册成功",null) : new Result(500,"注册失败",null);
    }

    //邮箱登录方法
    public Result login(String email,String password){
        User user = authMapper.findByEmail(email);
        if(user == null){
            return new Result(404,"用户不存在",null);
        }
        // 使用BCrypt加密校验
        if(!PasswordEncrypt.matches(password,user.getPassword())){
            return new Result(401,"密码错误",null);
        }
        //创建安全的用户对象
        User safeUser = new User(user.getUser_id(), user.getUsername(), user.getEmail(), null);

        //签发token
        String token = TokenUtil.GenerateToken(safeUser.getUser_id(),safeUser.getUsername(),safeUser.getPassword(),jwtSecret,jwtExpSeconds);
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", safeUser);
        return new Result(200, "登录成功", data);
    }

    //用户名登录方法
    public  Result login_username(String username, String password){
        User user = authMapper.findByUsername(username);
        if(user == null){
            return new Result(404,"用户不存在",null);
        }
        if(!PasswordEncrypt.matches(password,user.getPassword())){
            return new Result(401,"密码错误",null);
        }
        User safeUser = new User(user.getUser_id(), user.getUsername(), user.getEmail(), null);
        String token = TokenUtil.GenerateToken(safeUser.getUser_id(),safeUser.getUsername(),safeUser.getPassword(),jwtSecret,jwtExpSeconds);
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", safeUser);
        return new Result(200, "登录成功", data);
    }

    //用户忘记密码后重置密码方法
    public Result reset_password(String email,String newPassword){
        User user = authMapper.findByEmail(email);
        if(user == null){
            return new Result(404,"该用户不存在",null);
        }
        String hashed = PasswordEncrypt.hash(newPassword);
        int i = authMapper.updatePassword(email,hashed);
        if(i == 1){
            return new Result(200,"密码更新成功",null);
        }
        return new Result(500,"密码更新失败",null);

    }
}
