package org.example.campusmarket.Controller;

import org.example.campusmarket.DTO.CreateConversationRequest;
import org.example.campusmarket.DTO.SendMessageRequest;
import org.example.campusmarket.entity.ChatConversation;
import org.example.campusmarket.entity.ChatMessage;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.Service.ChatConversationService;
import org.example.campusmarket.Service.ChatMessageService;
import org.example.campusmarket.Service.ImageService;
import org.example.campusmarket.util.ResultUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 聊天功能控制器
 * 注意：JwtAuthFilter 中设置的 Principal 是 Integer 类型的用户ID
 */
@RestController
@RequestMapping("/chat")
public class ChatController {

    @Autowired
    private ChatConversationService conversationService;

    @Autowired
    private ChatMessageService messageService;
    
    @Autowired
    private ImageService imageService;

    /**
     * 从 Authentication 中获取当前用户ID
     * JwtAuthFilter 设置的 Principal 是 Integer 类型
     */
    private Integer getCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("用户未登录");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Integer) {
            return (Integer) principal;
        }
        // 兼容其他可能的类型
        return Integer.valueOf(principal.toString());
    }

    /**
     * 获取当前用户的会话列表
     * GET /chat/conversations
     */
    @GetMapping("/conversations")
    public Result listConversations(Authentication authentication) {
        try {
            Integer currentUserId = getCurrentUserId(authentication);
            List<ChatConversation> conversations = conversationService.listConversations(currentUserId);
            return ResultUtil.success(conversations);
        } catch (Exception e) {
            return ResultUtil.error("获取会话列表失败：" + e.getMessage());
        }
    }

    /**
     * 创建会话
     * POST /chat/conversations
     */
    @PostMapping("/conversations")
    public Result createConversation(
            @Validated @RequestBody CreateConversationRequest request,
            Authentication authentication) {
        try {
            Integer currentUserId = getCurrentUserId(authentication);
            
            // 不能和自己创建会话
            if (currentUserId.equals(request.getUserId())) {
                return ResultUtil.error("不能和自己创建会话");
            }
            
            ChatConversation conversation = conversationService.createConversation(currentUserId, request);
            return ResultUtil.success(conversation);
        } catch (Exception e) {
            return ResultUtil.error("创建会话失败：" + e.getMessage());
        }
    }

    /**
     * 获取会话内的消息列表
     * GET /chat/conversations/:id/messages
     */
    @GetMapping("/conversations/{id}/messages")
    public Result listMessages(
            @PathVariable Integer id,
            Authentication authentication) {
        try {
            Integer currentUserId = getCurrentUserId(authentication);
            
            // 验证用户是否有权限访问该会话
            ChatConversation conversation = conversationService.getConversationById(id);
            if (conversation == null) {
                return ResultUtil.notFound("会话不存在");
            }
            if (!conversation.getUserId().equals(currentUserId) && 
                !conversation.getPartnerId().equals(currentUserId)) {
                return ResultUtil.error("无权访问该会话");
            }
            
            // 获取消息列表，并标记 isOwn
            List<ChatMessage> messages = messageService.listMessages(id, currentUserId);
            
            // 清除未读消息数
            conversationService.clearUnreadCount(id, currentUserId);
            
            // 返回空列表而不是 404，前端更容易处理
            return ResultUtil.success(messages != null ? messages : new ArrayList<>());
        } catch (Exception e) {
            return ResultUtil.error("获取消息列表失败：" + e.getMessage());
        }
    }

    /**
     * 发送消息
     * POST /chat/conversations/:id/messages
     */
    @PostMapping("/conversations/{id}/messages")
    public Result sendMessage(
            @PathVariable Integer id,
            @Validated @RequestBody SendMessageRequest request,
            Authentication authentication) {
        try {
            Integer senderId = getCurrentUserId(authentication);
            
            // 验证用户是否有权限在该会话中发送消息
            ChatConversation conversation = conversationService.getConversationById(id);
            if (conversation == null) {
                return ResultUtil.notFound("会话不存在");
            }
            if (!conversation.getUserId().equals(senderId) && 
                !conversation.getPartnerId().equals(senderId)) {
                return ResultUtil.error("无权在该会话中发送消息");
            }
            
            ChatMessage message = messageService.sendMessage(id, senderId, request);
            return ResultUtil.success(message);
        } catch (Exception e) {
            return ResultUtil.error("发送消息失败：" + e.getMessage());
        }
    }

    /**
     * 删除会话
     * DELETE /chat/conversations/:id
     */
    @DeleteMapping("/conversations/{id}")
    public Result deleteConversation(
            @PathVariable Integer id,
            Authentication authentication) {
        try {
            Integer currentUserId = getCurrentUserId(authentication);
            boolean success = conversationService.deleteConversation(id, currentUserId);

            Map<String, Boolean> resultMap = new HashMap<>();
            resultMap.put("success", success);

            if (success) {
                return ResultUtil.success(resultMap);
            } else {
                return ResultUtil.error("删除会话失败：会话不存在或无操作权限");
            }
        } catch (Exception e) {
            return ResultUtil.error("删除会话失败：" + e.getMessage());
        }
    }
    
    /**
     * 清除会话未读消息数
     * PUT /chat/conversations/:id/read
     */
    @PutMapping("/conversations/{id}/read")
    public Result markAsRead(
            @PathVariable Integer id,
            Authentication authentication) {
        try {
            Integer currentUserId = getCurrentUserId(authentication);
            conversationService.clearUnreadCount(id, currentUserId);
            return ResultUtil.success("已标记为已读");
        } catch (Exception e) {
            return ResultUtil.error("标记已读失败：" + e.getMessage());
        }
    }
    
    /**
     * 上传聊天图片
     * POST /chat/upload-image
     * 返回图片URL，前端再用这个URL发送图片消息
     */
    @PostMapping("/upload-image")
    public Result uploadChatImage(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            // 验证用户已登录
            getCurrentUserId(authentication);
            
            // 上传图片到 OSS 的 chat 目录
            String imageUrl = imageService.uploadImage(file, "chat");
            
            Map<String, String> result = new HashMap<>();
            result.put("url", imageUrl);
            
            return ResultUtil.success(result);
        } catch (Exception e) {
            return ResultUtil.error("图片上传失败：" + e.getMessage());
        }
    }
}