package org.example.campusmarket.Service;

import org.example.campusmarket.Mapper.NotificationSettingsMapper;
import org.example.campusmarket.Mapper.SystemMessageMapper;
import org.example.campusmarket.entity.NotificationSettings;
import org.example.campusmarket.entity.SystemMessage;
import org.example.campusmarket.websocket.ChatWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class SystemMessageService {

    @Autowired
    private SystemMessageMapper systemMessageMapper;

    @Autowired
    private NotificationSettingsMapper notificationSettingsMapper;

    @Autowired
    private ChatWebSocketHandler webSocketHandler;

    // 消息类型分类
    private static final Set<String> PRODUCT_TYPES = Set.of("product_published", "product_sold", "product_unlocked");
    private static final Set<String> ORDER_TYPES = Set.of("order_created", "order_processed", "order_completed", "order_cancelled", "new_order", "buyer_confirmed", "buyer_cancelled");
    private static final Set<String> SOCIAL_TYPES = Set.of("new_follower", "product_favorited");

    public List<SystemMessage> getMessagesByUserId(Integer userId) {
        return systemMessageMapper.findByUserId(userId);
    }

    public Integer getUnreadCount(Integer userId) {
        return systemMessageMapper.countUnreadByUserId(userId);
    }

    public void markAllAsRead(Integer userId) {
        systemMessageMapper.markAllAsRead(userId);
    }

    public void markAsRead(Integer id, Integer userId) {
        systemMessageMapper.markAsRead(id, userId);
    }

    public void deleteById(Integer id, Integer userId) {
        systemMessageMapper.deleteById(id, userId);
    }

    public void deleteAllByUserId(Integer userId) {
        systemMessageMapper.deleteAllByUserId(userId);
    }

    /**
     * 获取用户通知设置
     */
    public NotificationSettings getSettings(Integer userId) {
        NotificationSettings settings = notificationSettingsMapper.findByUserId(userId);
        if (settings == null) {
            // 返回默认设置（全部开启）
            settings = new NotificationSettings(userId, true, true, true);
        }
        return settings;
    }

    /**
     * 更新用户通知设置
     */
    public void updateSettings(NotificationSettings settings) {
        notificationSettingsMapper.upsert(settings);
    }

    /**
     * 创建系统消息（供其他服务调用）
     * 会根据用户通知设置决定是否发送
     */
    public void createMessage(Integer userId, String type, String title, String content, String link, String linkText) {
        // 检查用户通知设置
        if (!shouldNotify(userId, type)) {
            return;
        }

        SystemMessage msg = new SystemMessage();
        msg.setUserId(userId);
        msg.setType(type);
        msg.setTitle(title);
        msg.setContent(content);
        msg.setLink(link);
        msg.setLinkText(linkText);
        msg.setIsRead(false);
        systemMessageMapper.insert(msg);
        
        // 通过 WebSocket 实时推送通知
        Map<String, Object> wsMessage = new HashMap<>();
        wsMessage.put("type", "system_notification");
        wsMessage.put("data", Map.of(
            "id", msg.getId(),
            "messageType", type,
            "title", title,
            "content", content,
            "link", link,
            "linkText", linkText
        ));
        webSocketHandler.sendMessageToUser(userId, wsMessage);
    }

    /**
     * 检查是否应该发送通知
     */
    private boolean shouldNotify(Integer userId, String type) {
        NotificationSettings settings = notificationSettingsMapper.findByUserId(userId);
        if (settings == null) {
            return true; // 默认开启
        }

        if (PRODUCT_TYPES.contains(type)) {
            return Boolean.TRUE.equals(settings.getNotifyProduct());
        } else if (ORDER_TYPES.contains(type)) {
            return Boolean.TRUE.equals(settings.getNotifyOrder());
        } else if (SOCIAL_TYPES.contains(type)) {
            return Boolean.TRUE.equals(settings.getNotifySocial());
        }
        return true; // 未知类型默认发送
    }
}
