package org.example.campusmarket.Controller;

import org.example.campusmarket.DTO.CreateConversationRequest;
import org.example.campusmarket.DTO.SendMessageRequest;
import org.example.campusmarket.entity.ChatConversation;
import org.example.campusmarket.entity.ChatMessage;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.entity.UserInfo; // 适配user_info表的用户实体（ID为Integer）
import org.example.campusmarket.Service.ChatConversationService;
import org.example.campusmarket.Service.ChatMessageService;
import org.example.campusmarket.util.ResultUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 聊天功能控制器（适配Integer类型ID）
 */
@RestController
@RequestMapping("/chat")
public class ChatController {

    @Autowired
    private ChatConversationService conversationService;

    @Autowired
    private ChatMessageService messageService;

    /**
     * 获取当前用户的会话列表
     * GET /chat/conversations
     */
    @GetMapping("/conversations")
    public Result listConversations(Authentication authentication) {
        try {
            // 获取当前登录用户ID（适配Integer类型）
            Integer currentUserId = ((UserInfo) authentication.getPrincipal()).getUser_id();
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
            // 当前登录用户ID（Integer）
            Integer currentUserId = ((UserInfo) authentication.getPrincipal()).getUser_id();
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
    public Result listMessages(@PathVariable Integer id) { // 会话ID为Integer
        try {
            List<ChatMessage> messages = messageService.listMessages(id);
            if (messages.isEmpty()) {
                return ResultUtil.notFound("该会话暂无消息");
            }
            return ResultUtil.success(messages);
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
            @PathVariable Integer id, // 会话ID为Integer
            @Validated @RequestBody SendMessageRequest request,
            Authentication authentication) {
        try {
            // 发送者ID（Integer）
            Integer senderId = ((UserInfo) authentication.getPrincipal()).getUser_id();
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
            @PathVariable Integer id, // 会话ID为Integer
            Authentication authentication) {
        try {
            // 当前登录用户ID（Integer）
            Integer currentUserId = ((UserInfo) authentication.getPrincipal()).getUser_id();
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
}