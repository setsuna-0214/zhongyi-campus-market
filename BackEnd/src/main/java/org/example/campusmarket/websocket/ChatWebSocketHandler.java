package org.example.campusmarket.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 聊天 WebSocket 处理器
 * 管理用户连接，转发消息
 */
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketHandler.class);
    
    // 存储用户ID -> WebSocket会话的映射
    private static final Map<Integer, WebSocketSession> userSessions = new ConcurrentHashMap<>();
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Integer userId = getUserId(session);
        if (userId != null) {
            // 如果用户已有连接，关闭旧连接
            WebSocketSession oldSession = userSessions.put(userId, session);
            if (oldSession != null && oldSession.isOpen()) {
                try {
                    oldSession.close();
                } catch (IOException e) {
                    log.warn("关闭旧连接失败：userId={}", userId);
                }
            }
            log.info("用户连接 WebSocket：userId={}, sessionId={}", userId, session.getId());
        }
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
        log.debug("收到消息：{}", payload);
        
        // 如果是心跳消息，回复 pong
        if ("ping".equals(payload)) {
            try {
                session.sendMessage(new TextMessage("pong"));
            } catch (IOException e) {
                log.warn("发送 pong 失败");
            }
        }
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
        Object userId = session.getAttributes().get("userId");
        return userId instanceof Integer ? (Integer) userId : null;
    }
}
