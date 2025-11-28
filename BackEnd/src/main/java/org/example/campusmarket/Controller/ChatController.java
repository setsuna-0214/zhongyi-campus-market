package org.example.campusmarket.Controller;

import org.example.campusmarket.DTO.MessageDTO;
import org.example.campusmarket.Service.ChatService;
import org.example.campusmarket.entity.ChatMessage;
import org.example.campusmarket.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin // 临时解决跨域（测试用）
public class ChatController {

    @Autowired
    private ChatService chatService;

    // WebSocket接口：接收前端发送的私聊消息（前端请求地址：/app/private/send）
    @MessageMapping("/private/send")
    public void handlePrivateMessage(@Payload MessageDTO dto) {
        chatService.sendPrivateMessage(dto);
    }

    // REST接口：查询历史聊天记录
    @GetMapping("/history")
    public Result getHistoryMessage(
            @RequestParam(defaultValue = "1") Long userId1,
            @RequestParam Long userId2) {
        List<ChatMessage> history = chatService.getHistoryMessage(userId1, userId2);
        return Result.success(history);
    }
}