package org.example.campusmarket.websocket;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import org.example.campusmarket.config.JwtProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * WebSocket 握手拦截器 - 验证 JWT Token
 */
@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private static final Logger log = LoggerFactory.getLogger(JwtHandshakeInterceptor.class);

    @Autowired
    private JwtProperties jwtProperties;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        try {
            if (request instanceof ServletServerHttpRequest servletRequest) {
                // 从查询参数获取 token
                String token = servletRequest.getServletRequest().getParameter("token");
                
                if (token == null || token.isEmpty()) {
                    log.warn("WebSocket 握手失败：缺少 token");
                    return false;
                }
                
                // 验证 token 并获取用户ID
                Integer userId = validateTokenAndGetUserId(token);
                if (userId == null) {
                    log.warn("WebSocket 握手失败：token 无效");
                    return false;
                }
                
                // 将用户ID存入 attributes，供后续使用
                attributes.put("userId", userId);
                log.info("WebSocket 握手成功：userId={}", userId);
                return true;
            }
        } catch (Exception e) {
            log.error("WebSocket 握手异常：{}", e.getMessage());
        }
        return false;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // 握手后的处理（可选）
    }
    
    /**
     * 验证 token 并返回用户ID
     */
    private Integer validateTokenAndGetUserId(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(jwtProperties.getSecret());
            JWTVerifier verifier = JWT.require(algorithm).build();
            DecodedJWT jwt = verifier.verify(token);
            String subject = jwt.getSubject();
            return subject != null && !subject.isEmpty() ? Integer.valueOf(subject) : null;
        } catch (Exception e) {
            log.debug("Token 验证失败：{}", e.getMessage());
            return null;
        }
    }
}
