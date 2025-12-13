package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.SendMessageRequest;
import org.example.campusmarket.entity.ChatMessage;
import org.example.campusmarket.Mapper.ChatMessageMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ChatMessageService {

    @Autowired
    private ChatMessageMapper messageMapper;

    @Autowired
    private ChatConversationService conversationService;

    /** 获取会话内的消息列表 */
    public List<ChatMessage> listMessages(Integer conversationId) {
        return messageMapper.listMessages(conversationId);
    }

    /** 发送消息（并更新会话最后一条消息） */
    @Transactional
    public ChatMessage sendMessage(Integer conversationId, Integer senderId, SendMessageRequest request) {
        // 构建消息对象
        ChatMessage message = new ChatMessage();
        message.setConversationId(conversationId);
        message.setSenderId(senderId);
        message.setContent(request.getContent());
        message.setType(request.getType());
        // 插入消息到数据库
        messageMapper.sendMessage(message);
        // 更新会话最后一条消息（未读数+1）
        conversationService.updateLastMessage(conversationId, request.getContent(), 1, senderId);
        return message;
    }
}