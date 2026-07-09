package org.example.campusmarket.Controller;

import org.example.campusmarket.Service.SystemMessageService;
import org.example.campusmarket.entity.NotificationSettings;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.entity.SystemMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/system-messages")
public class SystemMessageController {

    @Autowired
    private SystemMessageService systemMessageService;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");

    private Integer getUserId(Authentication auth) {
        return Integer.parseInt(auth.getName());
    }

    /**
     * 获取当前用户的系统消息列表
     */
    @GetMapping
    public Result list(Authentication auth) {
        Integer userId = getUserId(auth);
        List<SystemMessage> messages = systemMessageService.getMessagesByUserId(userId);
        // 转换为前端期望的格式
        List<Map<String, Object>> result = messages.stream().map(this::toMap).collect(Collectors.toList());
        return new Result(200, "success", result);
    }

    /**
     * 获取未读消息数量
     */
    @GetMapping("/unread-count")
    public Result unreadCount(Authentication auth) {
        Integer userId = getUserId(auth);
        Integer count = systemMessageService.getUnreadCount(userId);
        return new Result(200, "success", count);
    }

    /**
     * 标记全部已读
     */
    @PutMapping("/read-all")
    public Result readAll(Authentication auth) {
        Integer userId = getUserId(auth);
        systemMessageService.markAllAsRead(userId);
        return new Result(200, "success", Map.of("success", true));
    }

    /**
     * 标记单条已读
     */
    @PutMapping("/{id}/read")
    public Result read(@PathVariable Integer id, Authentication auth) {
        Integer userId = getUserId(auth);
        systemMessageService.markAsRead(id, userId);
        return new Result(200, "success", Map.of("success", true));
    }

    /**
     * 删除单条消息
     */
    @DeleteMapping("/{id}")
    public Result delete(@PathVariable Integer id, Authentication auth) {
        Integer userId = getUserId(auth);
        systemMessageService.deleteById(id, userId);
        return new Result(200, "success", Map.of("success", true));
    }

    /**
     * 清空所有消息
     */
    @DeleteMapping("/all")
    public Result deleteAll(Authentication auth) {
        Integer userId = getUserId(auth);
        systemMessageService.deleteAllByUserId(userId);
        return new Result(200, "success", Map.of("success", true));
    }

    /**
     * 获取通知设置
     */
    @GetMapping("/settings")
    public Result getSettings(Authentication auth) {
        Integer userId = getUserId(auth);
        NotificationSettings settings = systemMessageService.getSettings(userId);
        Map<String, Object> result = new HashMap<>();
        result.put("product", settings.getNotifyProduct());
        result.put("order", settings.getNotifyOrder());
        result.put("social", settings.getNotifySocial());
        return new Result(200, "success", result);
    }

    /**
     * 更新通知设置
     */
    @PutMapping("/settings")
    public Result updateSettings(@RequestBody Map<String, Boolean> body, Authentication auth) {
        Integer userId = getUserId(auth);
        NotificationSettings settings = new NotificationSettings();
        settings.setUserId(userId);
        settings.setNotifyProduct(body.getOrDefault("product", true));
        settings.setNotifyOrder(body.getOrDefault("order", true));
        settings.setNotifySocial(body.getOrDefault("social", true));
        systemMessageService.updateSettings(settings);
        return new Result(200, "success", Map.of("success", true));
    }

    private Map<String, Object> toMap(SystemMessage msg) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", msg.getId());
        map.put("type", msg.getType());
        map.put("title", msg.getTitle());
        map.put("content", msg.getContent());
        map.put("link", msg.getLink());
        map.put("linkText", msg.getLinkText());
        map.put("isRead", msg.getIsRead());
        map.put("timestamp", msg.getCreatedAt() != null ? msg.getCreatedAt().format(FORMATTER) : null);
        return map;
    }
}
