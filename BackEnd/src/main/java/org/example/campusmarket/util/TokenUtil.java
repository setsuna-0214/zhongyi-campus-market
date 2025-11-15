package org.example.campusmarket.util;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;

import java.util.Date;

//关于token的工具类
public final class TokenUtil {
    private TokenUtil() {}
    //生成token
    public static String GenerateToken(Integer userId, String username, String email, String secret, long expiresSeconds) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("jwt secret 不能为空");
        }
        long now = System.currentTimeMillis();
        Algorithm alg = Algorithm.HMAC256(secret);
        return JWT.create()
                .withSubject(userId == null ? "" : userId.toString())
                .withClaim("username", username)
                .withClaim("email", email)
                .withIssuedAt(new Date(now))
                .withExpiresAt(new Date(now + expiresSeconds * 1000))
                .sign(alg);
    }
    //根据token解析用户数据，返回用户id
    public static Integer GetUserFromToken(String token){
        try {
            DecodedJWT jwt = JWT.decode(token);
            String sub = jwt.getSubject();
            return sub == null ? null : Integer.valueOf(sub);
        } catch (Exception e) {
            return null;
        }
    }

}