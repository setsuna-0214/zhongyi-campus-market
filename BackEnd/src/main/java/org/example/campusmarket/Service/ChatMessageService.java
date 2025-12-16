package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.SendMessageRequest;
import org.example.campusmarket.entity.ChatConversation;
import org.example.campusmarket.entity.ChatMessage;
import org.example.campusmarket.entity.UserInfo;
import org.example.campusmarket.Mapper.ChatMessageMapper;
import org.example.campusmarket.Mapper.UserInfoMapper;
import org.example.campusmarket.websocket.ChatWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChatMessageService {

    @Autowired
    private ChatMessageMapper messageMapper;

    @Autowired
    private ChatConversationService conversationService;
    
    @Autowired
    private UserInfoMapper userInfoMapper;
    
    @Autowired
    private ChatWebSocketHandler webSocketHandler;

    /** 获取会话内的消息列表，并标记哪些是当前用户发送的 */
    public List<ChatMessage> listMessages(Integer conversationId, Integer currentUserId) {
        // 获取用于存储消息的会话ID（双方共享）
        Integer messageConversationId = getMessageConversationId(conversationId);
        List<ChatMessage> messages = messageMapper.listMessages(messageConversationId);
        // 标记是否为当前用户发送的消息
        for (ChatMessage msg : messages) {
            msg.setIsOwn(msg.getSenderId().equals(currentUserId));
            // 如果是自己发送的消息，显示"我"
            if (msg.getIsOwn()) {
                msg.setSenderName("我");
            }
        }
        return messages;
    }
    
    /** 获取会话内的消息列表（不标记 isOwn，用于无需登录的场景） */
    public List<ChatMessage> listMessages(Integer conversationId) {
        Integer messageConversationId = getMessageConversationId(conversationId);
        return messageMapper.listMessages(messageConversationId);
    }

    /** 发送消息（并更新双方会话的最后一条消息） */
    @Transactional
    public ChatMessage sendMessage(Integer conversationId, Integer senderId, SendMessageRequest request) {
        // 获取会话信息，确定使用哪个会话ID存储消息
        // 使用较小的会话ID作为消息存储的会话ID，确保双方消息存储在同一个地方
        Integer partnerConversationId = conversationService.getPartnerConversationId(conversationId);
        Integer messageConversationId = conversationId;
        if (partnerConversationId != null && partnerConversationId < conversationId) {
            messageConversationId = partnerConversationId;
        }
        
        // 构建消息对象
        ChatMessage message = new ChatMessage();
        message.setConversationId(messageConversationId);
        message.setSenderId(senderId);
        message.setContent(request.getContent());
        message.setType(request.getType() != null ? request.getType() : "text");
        
        // 插入消息到数据库
        messageMapper.sendMessage(message);
        
        // 获取完整的消息信息（包含发送者昵称）
        ChatMessage savedMessage = messageMapper.getMessageById(message.getId());
        if (savedMessage != null) {
            savedMessage.setIsOwn(true);
            savedMessage.setSenderName("我");
        }
        
        // 生成最后一条消息的摘要
        String lastMessageSummary = generateLastMessageSummary(request.getType(), request.getContent());
        
        // 更新双方会话的最后一条消息
        conversationService.updateLastMessage(conversationId, lastMessageSummary, 1);
        
        // 通过 WebSocket 通知对方有新消息
        notifyPartner(conversationId, senderId, savedMessage != null ? savedMessage : message);
        
        return savedMessage != null ? savedMessage : message;
    }
    
    /**
     * 通过 WebSocket 通知对方有新消息
     */
    private void notifyPartner(Integer conversationId, Integer senderId, ChatMessage message) {
        try {
            // 获取会话信息，找到对方用户ID
            ChatConversation conversation = conversationService.getConversationById(conversationId);
            if (conversation == null) return;
            
            // 确定对方用户ID
            Integer partnerId = conversation.getUserId().equals(senderId) 
                ? conversation.getPartnerId() 
                : conversation.getUserId();
            
            // 构建推送消息
            Map<String, Object> wsMessage = new HashMap<>();
            wsMessage.put("type", "new_message");
            wsMessage.put("conversationId", conversationId);
            wsMessage.put("message", message);
            
            // 发送给对方
            webSocketHandler.sendMessageToUser(partnerId, wsMessage);
        } catch (Exception e) {
            // WebSocket 通知失败不影响主流程
        }
    }
    
    /** 获取用于存储消息的会话ID（取双方会话ID中较小的那个） */
    public Integer getMessageConversationId(Integer conversationId) {
        Integer partnerConversationId = conversationService.getPartnerConversationId(conversationId);
        if (partnerConversationId != null && partnerConversationId < conversationId) {
            return partnerConversationId;
        }
        return conversationId;
    }
    
    /** 生成最后一条消息的摘要 */
    private String generateLastMessageSummary(String type, String content) {
        if (type == null || "text".equals(type)) {
            // 文本消息，截取前50个字符
            if (content != null && content.length() > 50) {
                return content.substring(0, 50) + "...";
            }
            return content;
        } else if ("image".equals(type)) {
            return "[图片]";
        } else if ("product".equals(type)) {
            return "[商品卡片]";
        }
        return "[消息]";
    }
}