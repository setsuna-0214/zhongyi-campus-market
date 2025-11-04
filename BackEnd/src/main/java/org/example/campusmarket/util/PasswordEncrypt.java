package org.example.campusmarket.util;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.regex.Pattern;

//对密码进行加密,在数据库中不存储明文，而是存储加密后的密码。
public class PasswordEncrypt {

    private static final PasswordEncoder ENCODER = new BCryptPasswordEncoder();
    private  PasswordEncrypt() { }

    //将密码进行加密
    public static String hash(String rawPassword) {
        // 统一空值处理
        if (rawPassword == null) {
            throw new IllegalArgumentException("rawPassword 不能为空");
        }
        return ENCODER.encode(rawPassword);
    }

    //判断明文密码是否与加密后密码对应
    public static boolean matches(String rawPassword, String hashedPassword) {
        if (rawPassword == null || hashedPassword == null) {
            return false;
        }
        return ENCODER.matches(rawPassword, hashedPassword);
    }


}
