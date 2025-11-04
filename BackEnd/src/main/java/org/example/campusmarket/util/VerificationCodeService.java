package org.example.campusmarket.util;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
//邮箱验证码功能
@Service
public class VerificationCodeService {
    private final StringRedisTemplate redisTemplate; //redis操作对象
    private final JavaMailSender mailSender;  //邮件发送器
    //以下从配置文件application.properties中读取
    @Value("${spring.mail.username}") // 发件人邮箱账号
    private String from;

    @Value("${auth.code.ttl-seconds:300}") // 验证码有效期（秒），默认 300s,
    private long ttlSeconds;

    @Value("${auth.code.interval-seconds:60}") // 发送频率限制（秒），默认 60s
    private long intervalSeconds;

    @Value("${auth.code.length:6}") // 验证码长度，默认 6 位数字
    private int codeLength;

    @Value("${auth.code.subject:校园二手交易平台验证码}") // 邮件主题（在此配置）
    private String subject;

    private static final SecureRandom RANDOM = new SecureRandom(); // 更安全的随机源

    // 构造器注入
    public VerificationCodeService(StringRedisTemplate redisTemplate, JavaMailSender mailSender) {
        this.redisTemplate = redisTemplate;
        this.mailSender = mailSender;
    }

    // 构造“验证码”存储的 Redis 键：reg:code:{email}
    private String codeKey(String email) {
        return "reg:code:" + email;
    }

    // 构造“最近一次发送时间戳”存储的键：reg:last:{email}
    private String lastSendKey(String email) {
        return "reg:last:" + email;
    }

    // 生成固定长度的数字验证码
    public String generateCode() {
        StringBuilder sb = new StringBuilder(codeLength);
        for (int i = 0; i < codeLength; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }

    // 判断是否允许再次发送
    public boolean canSend(String email) {
        String lastTsStr = redisTemplate.opsForValue().get(lastSendKey(email)); // 读取上次发送时间戳（毫秒）
        if (lastTsStr == null) {
            return true;
        }
        long lastTs = Long.parseLong(lastTsStr); // 转为 long 毫秒值
        long deltaMs = System.currentTimeMillis() - lastTs; // 距离上次发送的时间
        return deltaMs >= intervalSeconds * 1000; // 达到设定的间隔则允许发送
    }


    // 发送验证码：生成 → 写入 Redis（TTL）→ 记录发送时间 → 发邮件
    public void sendCode(String email) {
        if (!canSend(email)) {
            // 业务异常：过于频繁，交由上层转为 429 Too Many Requests
            throw new IllegalStateException("发送过于频繁，请稍后再试");
        }

        String code = generateCode(); // 生成新的验证码

        // 1) 将验证码写入 Redis，并设置过期时间（TTL）
        redisTemplate.opsForValue().set(codeKey(email), code, ttlSeconds, TimeUnit.SECONDS);

        // 2) 记录本次发送时间戳，并给该键设置过期时间（与发送间隔一致）
        redisTemplate.opsForValue()
                .set(lastSendKey(email), String.valueOf(System.currentTimeMillis()), Duration.ofSeconds(intervalSeconds));

        // 3) 组装并发送邮件（纯文本，如果想生成html可以再改）
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);       // 发件人
        message.setTo(email);        // 收件人
        message.setSubject(subject); // 主题
        // 邮件正文：包含验证码与有效期提示
        message.setText(String.format("您的注册验证码是：%s（%d分钟内有效）。如非本人操作请忽略本邮件。", code, ttlSeconds / 60));

        mailSender.send(message);    // 发送邮件
    }

    // 校验验证码是否正确，是否过期
    public boolean verifyCode(String email, String inputCode) {
        String cached = redisTemplate.opsForValue().get(codeKey(email)); // 读取 Redis 中验证码
        if (cached == null) {
            return false; // 无记录或已过期
        }
        return cached.equals(inputCode); // 验证用户输入是否与缓存一致
    }

    // 清理验证码与发送时间戳（注册成功后调用，避免重复使用）
    public void clearCode(String email) {
        redisTemplate.delete(codeKey(email));     // 删除验证码键
        redisTemplate.delete(lastSendKey(email)); // 删除发送时间戳键
    }
}
