package org.example.campusmarket.websocket;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.campusmarket.config.JwtProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 聊天 WebSocket 处理器
 * 管理用户连接，转发消息
 */
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketHandler.class);

    private static final String ATTR_USER_ID = "userId";
    private static final String AUTH_MESSAGE_TYPE = "auth";
    private static final ScheduledExecutorService AUTH_TIMEOUT_EXECUTOR =
            Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "ws-auth-timeout");
                t.setDaemon(true);
                return t;
            });
    
    // 存储用户ID -> WebSocket会话的映射
    private static final Map<Integer, WebSocketSession> userSessions = new ConcurrentHashMap<>();
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private JwtProperties jwtProperties;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Integer userId = getUserId(session);
        if (userId != null) {
            // 兼容：握手阶段已通过 query token 完成认证
            registerSession(userId, session);
            return;
        }

        // 新实现：允许先建立连接，等待客户端发送认证消息（避免 token 出现在 URL）
        log.debug("未认证 WebSocket 连接已建立：sessionId={}", session.getId());

        // 如果在限定时间内未完成认证，则主动关闭连接（降低被滥用的风险）
        AUTH_TIMEOUT_EXECUTOR.schedule(() -> {
            try {
                if (session.isOpen() && getUserId(session) == null) {
                    closeSilently(session, CloseStatus.NOT_ACCEPTABLE.withReason("auth timeout"));
                }
            } catch (Exception ignored) {
            }
        }, 10, TimeUnit.SECONDS);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Integer userId = getUserId(session);
        if (userId != null) {
            // 只有当前session是该用户的活跃session时才移除
            userSessions.remove(userId, session);
            log.info("用户断开 WebSocket：userId={}, status={}", userId, status);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // 客户端发来的消息（心跳等）
        String payload = message.getPayload();
        
        // 如果是心跳消息，回复 pong
        if ("ping".equals(payload)) {
            try {
                session.sendMessage(new TextMessage("pong"));
            } catch (IOException e) {
                log.warn("发送 pong 失败");
            }
            return;
        }

        // 未认证连接：只允许认证消息
        Integer userId = getUserId(session);
        if (userId == null) {
            if (!tryAuthenticate(session, payload)) {
                log.debug("忽略未认证 WebSocket 消息：sessionId={}", session.getId());
            }
            return;
        }

        // 当前后端仅用于服务端推送（客户端消息除心跳外不处理）
        log.debug("收到客户端消息（已忽略）：userId={}, sessionId={}", userId, session.getId());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        Integer userId = getUserId(session);
        log.error("WebSocket 传输错误：userId={}, error={}", userId, exception.getMessage());
    }

    /**
     * 向指定用户发送消息
     */
    public void sendMessageToUser(Integer userId, Object message) {
        WebSocketSession session = userSessions.get(userId);
        if (session != null && session.isOpen()) {
            try {
                String json = objectMapper.writeValueAsString(message);
                session.sendMessage(new TextMessage(json));
                log.debug("发送消息给用户：userId={}, message={}", userId, json);
            } catch (IOException e) {
                log.error("发送消息失败：userId={}, error={}", userId, e.getMessage());
            }
        } else {
            log.debug("用户不在线：userId={}", userId);
        }
    }

    /**
     * 检查用户是否在线
     */
    public boolean isUserOnline(Integer userId) {
        WebSocketSession session = userSessions.get(userId);
        return session != null && session.isOpen();
    }

    /**
     * 获取在线用户数
     */
    public int getOnlineUserCount() {
        return (int) userSessions.values().stream().filter(WebSocketSession::isOpen).count();
    }

    private Integer getUserId(WebSocketSession session) {
        Object userId = session.getAttributes().get(ATTR_USER_ID);
        return userId instanceof Integer ? (Integer) userId : null;
    }

    private void registerSession(Integer userId, WebSocketSession session) {
        // 如果用户已有连接，关闭旧连接
        WebSocketSession oldSession = userSessions.put(userId, session);
        if (oldSession != null && oldSession.isOpen() && oldSession != session) {
            try {
                oldSession.close();
            } catch (IOException e) {
                log.warn("关闭旧连接失败：userId={}", userId);
            }
        }
        log.info("用户连接 WebSocket：userId={}, sessionId={}", userId, session.getId());
    }

    private boolean tryAuthenticate(WebSocketSession session, String payload) {
        Map<?, ?> map;
        try {
            map = objectMapper.readValue(payload, Map.class);
        } catch (Exception e) {
            return false;
        }

        Object type = map.get("type");
        if (!AUTH_MESSAGE_TYPE.equals(type)) {
            return false;
        }

        Object tokenObj = map.get("token");
        String token = tokenObj == null ? null : String.valueOf(tokenObj);
        if (token == null || token.isBlank()) {
            closeSilently(session, CloseStatus.NOT_ACCEPTABLE.withReason("missing token"));
            return true;
        }

        Integer userId = validateTokenAndGetUserId(token);
        if (userId == null) {
            closeSilently(session, CloseStatus.NOT_ACCEPTABLE.withReason("invalid token"));
            return true;
        }

        session.getAttributes().put(ATTR_USER_ID, userId);
        registerSession(userId, session);

        // 回传认证成功（不包含 token）
        try {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                    "type", "auth_ok",
                    "userId", userId
            ))));
        } catch (IOException e) {
            log.debug("发送 auth_ok 失败：userId={}, sessionId={}", userId, session.getId());
        }

        return true;
    }

    private Integer validateTokenAndGetUserId(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(jwtProperties.getSecret());
            JWTVerifier verifier = JWT.require(algorithm).build();
            DecodedJWT jwt = verifier.verify(token);
            String subject = jwt.getSubject();
            return subject != null && !subject.isEmpty() ? Integer.valueOf(subject) : null;
        } catch (Exception e) {
            return null;
        }
    }

    private void closeSilently(WebSocketSession session, CloseStatus status) {
        try {
            if (session.isOpen()) {
                session.close(status);
            }
        } catch (IOException ignored) {
        }
    }
}
