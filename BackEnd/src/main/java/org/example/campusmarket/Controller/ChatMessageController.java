package org.example.campusmarket.Controller;

import org.example.campusmarket.DTO.MessageResponseDTO;
import org.example.campusmarket.DTO.SendMessageDTO;
import org.example.campusmarket.Service.ChatMessageService;
import org.example.campusmarket.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

/**
 * 聊天消息控制器
 */
@RestController
@RequestMapping("/chat/message")
@CrossOrigin(origins = "http://localhost:3000") // 允许前端跨域
public class ChatMessageController {

    @Autowired
    private ChatMessageService messageService;

    // 获取消息列表
    @GetMapping("/{conversationId}")
    public Result<List<MessageResponseDTO>> getMessageList(
            @RequestParam Integer currentUserId,
            @PathVariable Integer conversationId
    ) {
        List<MessageResponseDTO> list = messageService.getMessageByConversationId(currentUserId, conversationId);
        return Result.success(list);
    }

    // 发送消息
    @PostMapping("/{conversationId}")
    public Result<MessageResponseDTO> sendMessage(
            @RequestParam Integer currentUserId,
            @PathVariable Integer conversationId,
            @Valid @RequestBody SendMessageDTO dto
    ) {
        if (currentUserId == null || conversationId == null) {
            return Result.fail("用户ID和会话ID不能为空");
        }
        MessageResponseDTO response = messageService.sendMessage(currentUserId, conversationId, dto);
        return Result.success(response);
    }
}