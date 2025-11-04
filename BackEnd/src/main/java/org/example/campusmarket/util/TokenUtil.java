package org.example.campusmarket.util;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;

import java.util.Date;

//签发token的工具类
public final class TokenUtil {
    private TokenUtil() {}

    public static String generateToken(Integer userId, String username, String email,String secret, long expiresSeconds) {
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
}