package org.example.campusmarket.Service;
import org.example.campusmarket.DTO.CreateConversationRequest;
import org.example.campusmarket.entity.ChatConversation;
import org.example.campusmarket.Mapper.ChatConversationMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ChatConversationService {

    @Autowired
    private ChatConversationMapper conversationMapper;

    /** 获取当前用户的会话列表 */
    public List<ChatConversation> listConversations(Integer userId) {
        return conversationMapper.listConversations(userId);
    }

    /** 创建会话（避免重复创建） */
    @Transactional
    public ChatConversation createConversation(Integer currentUserId, CreateConversationRequest request) {
        // 检查是否已存在该会话（当前用户+对方用户+订单ID）
        Integer existId = conversationMapper.findConversationId(
                currentUserId, request.getUserId(), request.getOrderId().intValue()
        );
        if (existId != null) {
            // 若已存在，返回现有会话
            ChatConversation existConv = new ChatConversation();
            existConv.setId(existId);
            existConv.setUserId(request.getUserId().intValue());
            existConv.setOrderId(request.getOrderId().intValue());
            existConv.setCreatedAt(new java.util.Date());
            return existConv;
        }

        // 新建会话
        ChatConversation conversation = new ChatConversation();
        conversation.setUserId(currentUserId.intValue()); // 当前用户ID
        conversation.setPartnerId(request.getUserId().intValue()); // 对方用户ID
        conversation.setUserName(request.getPartnerName()); // 对方昵称
        conversation.setUserAvatar(request.getPartnerAvatar()); // 对方头像
        conversation.setOrderId(request.getOrderId().intValue());
        conversation.setProductId(request.getProductId().intValue());
        conversationMapper.createConversation(conversation);
        return conversation;
    }

    /** 删除会话（仅删除当前用户的会话记录） */
    public boolean deleteConversation(Integer conversationId, Integer currentUserId) {
        int rows = conversationMapper.deleteConversation(conversationId, currentUserId);
        return rows > 0;
    }

    /** 更新会话最后一条消息 */
    public void updateLastMessage(Integer conversationId, String lastMessage, Integer unreadCount, Integer currentUserId) {
        conversationMapper.updateLastMessage(conversationId, lastMessage, unreadCount, currentUserId);
    }
}