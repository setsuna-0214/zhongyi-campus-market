package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.CreateConversationRequest;
import org.example.campusmarket.entity.ChatConversation;
import org.example.campusmarket.entity.UserInfo;
import org.example.campusmarket.Mapper.ChatConversationMapper;
import org.example.campusmarket.Mapper.UserInfoMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ChatConversationService {

    @Autowired
    private ChatConversationMapper conversationMapper;
    
    @Autowired
    private UserInfoMapper userInfoMapper;

    /** 获取当前用户的会话列表 */
    public List<ChatConversation> listConversations(Integer userId) {
        return conversationMapper.listConversations(userId);
    }
    
    /** 根据ID获取会话 */
    public ChatConversation getConversationById(Integer id) {
        return conversationMapper.getConversationById(id);
    }

    /** 创建会话（避免重复创建，同时为双方创建会话记录） */
    @Transactional
    public ChatConversation createConversation(Integer currentUserId, CreateConversationRequest request) {
        Integer partnerId = request.getUserId();
        Integer orderId = request.getOrderId();
        
        // 检查当前用户是否已存在该会话
        Integer existId = conversationMapper.findConversationId(currentUserId, partnerId, orderId);
        if (existId != null) {
            // 若已存在，返回现有会话的完整信息
            return conversationMapper.getConversationById(existId);
        }

        // 获取双方用户信息
        UserInfo currentUserInfo = userInfoMapper.findById(currentUserId);
        UserInfo partnerInfo = userInfoMapper.findById(partnerId);
        
        // 对方的昵称和头像
        String partnerName = request.getPartnerName();
        String partnerAvatar = request.getPartnerAvatar();
        if (partnerInfo != null) {
            if (partnerName == null) {
                partnerName = partnerInfo.getNickname();
            }
            if (partnerAvatar == null) {
                partnerAvatar = partnerInfo.getAvatar();
            }
        }
        if (partnerName == null) {
            partnerName = "用户" + partnerId;
        }
        if (partnerAvatar == null) {
            partnerAvatar = "/images/avatars/default.svg";
        }
        
        // 当前用户的昵称和头像
        String currentUserName = currentUserInfo != null ? currentUserInfo.getNickname() : "用户" + currentUserId;
        String currentUserAvatar = currentUserInfo != null ? currentUserInfo.getAvatar() : "/images/avatars/default.svg";
        if (currentUserName == null) {
            currentUserName = "用户" + currentUserId;
        }
        if (currentUserAvatar == null) {
            currentUserAvatar = "/images/avatars/default.svg";
        }

        // 1. 为当前用户创建会话（显示对方信息）
        ChatConversation conversation = new ChatConversation();
        conversation.setUserId(currentUserId);
        conversation.setPartnerId(partnerId);
        conversation.setUserName(partnerName);
        conversation.setUserAvatar(partnerAvatar);
        conversation.setOrderId(orderId);
        conversation.setProductId(request.getProductId());
        conversation.setUnreadCount(0);
        conversationMapper.createConversation(conversation);
        
        // 2. 检查对方是否已有会话，如果没有则为对方也创建会话（显示当前用户信息）
        Integer partnerExistId = conversationMapper.findConversationId(partnerId, currentUserId, orderId);
        if (partnerExistId == null) {
            ChatConversation partnerConversation = new ChatConversation();
            partnerConversation.setUserId(partnerId);
            partnerConversation.setPartnerId(currentUserId);
            partnerConversation.setUserName(currentUserName);
            partnerConversation.setUserAvatar(currentUserAvatar);
            partnerConversation.setOrderId(orderId);
            partnerConversation.setProductId(request.getProductId());
            partnerConversation.setUnreadCount(0);
            conversationMapper.createConversation(partnerConversation);
        }
        
        return conversation;
    }

    /** 删除会话（仅删除当前用户的会话记录） */
    public boolean deleteConversation(Integer conversationId, Integer currentUserId) {
        int rows = conversationMapper.deleteConversation(conversationId, currentUserId);
        return rows > 0;
    }

    /** 更新会话最后一条消息（同时更新双方的会话） */
    public void updateLastMessage(Integer conversationId, String lastMessage, Integer unreadCount) {
        // 更新当前会话（发送者的会话，未读数不增加）
        conversationMapper.updateLastMessage(conversationId, lastMessage, 0);
        
        // 查找对方的会话ID并更新（接收者的会话，未读数+1）
        Integer partnerConversationId = conversationMapper.findPartnerConversationId(conversationId);
        if (partnerConversationId != null) {
            conversationMapper.updateLastMessage(partnerConversationId, lastMessage, unreadCount);
        }
    }
    
    /** 获取对方的会话ID */
    public Integer getPartnerConversationId(Integer conversationId) {
        return conversationMapper.findPartnerConversationId(conversationId);
    }
    
    /** 清除未读消息数 */
    public void clearUnreadCount(Integer conversationId, Integer userId) {
        conversationMapper.clearUnreadCount(conversationId, userId);
    }
}