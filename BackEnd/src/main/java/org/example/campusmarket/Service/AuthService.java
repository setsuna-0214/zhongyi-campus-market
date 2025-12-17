package org.example.campusmarket.Service;

import org.example.campusmarket.Mapper.AuthMapper;
import org.example.campusmarket.Mapper.UserInfoMapper;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.entity.User;
import org.example.campusmarket.entity.UserInfo;
import org.example.campusmarket.util.PasswordEncrypt;
import org.example.campusmarket.util.TokenUtil;
import org.example.campusmarket.util.VerificationCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
@Service
public class AuthService {
    @Autowired
    private AuthMapper authMapper;
    
    @Autowired
    private UserInfoMapper userInfoMapper;
    
    private final VerificationCodeService codeService;

    // JWT 签名密钥与过期秒数，从配置文件注入
    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-seconds:3600}")
    private long jwtExpSeconds;

    public AuthService(VerificationCodeService codeService){
        this.codeService = codeService;
    }

    //验证码发送服务（发送前检查邮箱是否已被注册）
    public Result SendRegisterCode(String email){
        // 检查邮箱是否已被注册
        if (authMapper.findByEmail(email) != null) {
            return new Result(400, "该邮箱已被注册", null);
        }
        codeService.sendCode(email);
        return new Result(200, "验证码发送成功", null);
    }

    //注册方法
    @Transactional(rollbackFor = Exception.class)
    public Result register(String username, String email, String password) {
        // 检查用户名是否已存在
        if (authMapper.findByUsername(username) != null) {
            return new Result(400, "用户名已存在", null);
        }
        // 检查邮箱是否已被注册
        if (authMapper.findByEmail(email) != null) {
            return new Result(400, "该邮箱已被注册", null);
        }
        
        try {
            // 1. 将密码进行加密
            String hashed = PasswordEncrypt.hash(password);
            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(hashed);
            // role 使用数据库默认值 'user'，无需设置
            
            // 2. 插入 users 表
            int userInserted = authMapper.insertUser(user);
            if (userInserted != 1) {
                return new Result(500, "注册失败", null);
            }
            
            // 3. 获取自动生成的 user_id
            Integer userId = user.getUser_id();
            if (userId == null) {
                throw new RuntimeException("获取用户ID失败");
            }
            
            // 4. 插入 userinfo 表（创建基础用户信息记录）
            UserInfo userInfo = new UserInfo();
            userInfo.setUser_id(userId);
            userInfo.setUsername(username);
            userInfo.setEmail(email);
            // role 使用数据库默认值 'user'，无需设置
            
            int userInfoInserted = userInfoMapper.insertUserInfo(userInfo);
            if (userInfoInserted != 1) {
                throw new RuntimeException("创建用户信息失败");
            }
            
            return new Result(200, "注册成功", null);
        } catch (Exception e) {
            // 事务会自动回滚
            return new Result(500, "注册失败: " + e.getMessage(), null);
        }
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
        //创建安全的用户对象（不包含密码）
        User safeUser = new User();
        safeUser.setUser_id(user.getUser_id());
        safeUser.setUsername(user.getUsername());
        safeUser.setEmail(user.getEmail());
        safeUser.setRole(user.getRole());

        // 更新最后登录时间
        userInfoMapper.updateLastLoginAt(user.getUser_id());

        //签发token
        String token = TokenUtil.GenerateToken(safeUser.getUser_id(),safeUser.getUsername(),null,jwtSecret,jwtExpSeconds);
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
        //创建安全的用户对象（不包含密码）
        User safeUser = new User();
        safeUser.setUser_id(user.getUser_id());
        safeUser.setUsername(user.getUsername());
        safeUser.setEmail(user.getEmail());
        safeUser.setRole(user.getRole());

        // 更新最后登录时间
        userInfoMapper.updateLastLoginAt(user.getUser_id());

        String token = TokenUtil.GenerateToken(safeUser.getUser_id(),safeUser.getUsername(),null,jwtSecret,jwtExpSeconds);
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", safeUser);
        return new Result(200, "登录成功", data);
    }

    //用户忘记密码后重置密码方法
    @Transactional(rollbackFor = Exception.class)
    public Result reset_password(String email, String newPassword) {
        User user = authMapper.findByEmail(email);
        if (user == null) {
            return new Result(404, "该用户不存在", null);
        }
        
        try {
            String hashed = PasswordEncrypt.hash(newPassword);
            int updated = authMapper.updatePassword(email, hashed);
            if (updated == 1) {
                return new Result(200, "密码更新成功", null);
            }
            return new Result(500, "密码更新失败", null);
        } catch (Exception e) {
            return new Result(500, "密码更新失败: " + e.getMessage(), null);
        }
    }

    // 检查用户名是否已存在
    public boolean checkUsernameExists(String username) {
        return authMapper.findByUsername(username) != null;
    }

    // 检查邮箱是否已存在
    public boolean checkEmailExists(String email) {
        return authMapper.findByEmail(email) != null;
    }
}
