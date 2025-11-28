package org.example.campusmarket.Controller;

import org.example.campusmarket.DTO.ConversationDTO;
import org.example.campusmarket.DTO.CreateConversationDTO;
import org.example.campusmarket.DTO.CreateConversationResponseDTO;
import org.example.campusmarket.Service.ChatConversationService;
import org.example.campusmarket.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

/**
 * 聊天会话控制器
 */
@RestController
@RequestMapping("/chat/conversations")
@CrossOrigin(origins = "http://localhost:3000") // 允许前端跨域
public class ChatConversationController {

    @Autowired
    private ChatConversationService conversationService;

    // 获取会话列表
    @GetMapping
    public Result<List<ConversationDTO>> getConversationList() {
        // 开发阶段临时返回1，生产需从Token解析
        Integer currentUserId = getCurrentUserId();
        List<ConversationDTO> list = conversationService.getConversationList(currentUserId);
        return Result.success(list);
    }

    // 创建会话
    @PostMapping
    public Result<CreateConversationResponseDTO> createConversation(
            @Valid @RequestBody CreateConversationDTO dto) {
        Integer currentUserId = getCurrentUserId();
        CreateConversationResponseDTO response = conversationService.createConversation(currentUserId, dto);
        return Result.success(response);
    }

    // 删除会话
    @DeleteMapping("/{conversationId}")
    public Result<Boolean> deleteConversation(@PathVariable Integer conversationId) {
        Integer currentUserId = getCurrentUserId();
        boolean success = conversationService.deleteConversation(currentUserId, conversationId);
        return Result.success(success);
    }

    // 模拟获取当前用户ID（生产需替换为JWT解析）
    private Integer getCurrentUserId() {
        return 1; // 测试用
    }
}