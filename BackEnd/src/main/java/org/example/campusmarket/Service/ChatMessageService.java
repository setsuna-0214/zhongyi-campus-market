package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.MessageResponseDTO;
import org.example.campusmarket.DTO.SendMessageDTO;
import org.example.campusmarket.Mapper.ChatConversationMapper;
import org.example.campusmarket.Mapper.ChatMessageMapper;
import org.example.campusmarket.entity.ChatConversation;
import org.example.campusmarket.entity.ChatMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.TimeZone;
import java.util.stream.Collectors;

/**
 * 聊天消息服务（彻底修复 Integer ↔ Long 类型不兼容问题）
 */
@Service
public class ChatMessageService {

    @Autowired
    private ChatMessageMapper messageMapper;

    @Autowired
    private ChatConversationMapper conversationMapper;

    @Autowired
    private ChatConversationService conversationService;

    // WebSocket消息推送（可选，若无WebSocket可注释）
    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    // 获取会话消息列表（全量适配 Long 类型）
    public List<MessageResponseDTO> getMessageByConversationId(Integer currentUserId, Integer conversationId) {
        // 1. 参数校验 + 类型转换（Integer → Long）
        if (currentUserId == null || conversationId == null) {
            throw new RuntimeException("用户ID和会话ID不能为空");
        }
        Long currentUserIdLong = Long.valueOf(currentUserId);
        Long conversationIdLong = Long.valueOf(conversationId);

        // 2. 校验会话归属（Long 类型对比，避免类型不兼容）
        ChatConversation conversation = conversationMapper.selectById(conversationIdLong);
        if (conversation == null) {
            throw new RuntimeException("会话不存在");
        }
        if (!conversation.getUserId().equals(currentUserIdLong)) {
            throw new RuntimeException("无权限访问该会话消息");
        }

        // 3. 清空未读数（转换为 Integer 调用 Service 方法）
        conversationService.clearUnreadCount(conversationId);

        // 4. 调用 Mapper（传 Long 类型参数） + 转换 DTO
        List<ChatMessage> messageList = messageMapper.selectByConversationId(conversationIdLong);
        return convertToMessageResponseDTOList(messageList);
    }

    // 发送消息（全量适配 Long 类型）
    @Transactional(rollbackFor = Exception.class)
    public MessageResponseDTO sendMessage(Integer currentUserId, Integer conversationId, SendMessageDTO dto) {
        // 1. 参数校验 + 类型转换
        if (currentUserId == null || conversationId == null || dto == null || dto.getContent() == null) {
            throw new RuntimeException("参数不能为空");
        }
        Long currentUserIdLong = Long.valueOf(currentUserId);
        Long conversationIdLong = Long.valueOf(conversationId);

        // 2. 校验会话归属（Long 类型对比）
        ChatConversation conversation = conversationMapper.selectById(conversationIdLong);
        if (conversation == null) {
            throw new RuntimeException("会话不存在");
        }
        if (!conversation.getUserId().equals(currentUserIdLong)) {
            throw new RuntimeException("无权限向该会话发送消息");
        }

        // 3. 构建消息实体（全量用 Long 类型赋值）
        ChatMessage message = new ChatMessage();
        message.setConversationId(conversationIdLong);       // Long 类型
        message.setSenderId(currentUserIdLong);              // Long 类型
        message.setReceiverId(conversation.getTargetUserId());// 直接用实体类的 Long 类型
        message.setContent(dto.getContent());
        message.setType(dto.getType() != null ? dto.getType() : "text"); // 默认文本类型
        message.setCreatedAt(new Date());
        message.setIsRead(0); // 0=未读

        // 4. 插入消息（传 Long 类型的实体类）
        messageMapper.insert(message);

        // 5. 更新会话最后一条消息（转换为 Integer 调用 Service）
        conversationService.updateConversationLastMessage(conversationId, dto.getContent(), true);

        // 6. 转换为响应 DTO
        MessageResponseDTO response = convertToMessageResponseDTO(message);

        // 7. WebSocket推送（Long → String 适配）
        if (messagingTemplate != null) {
            String targetUserIdStr = conversation.getTargetUserId().toString();
            messagingTemplate.convertAndSendToUser(
                    targetUserIdStr,
                    "/private",
                    response
            );
        }

        return response;
    }

    // 批量转换 ChatMessage → MessageResponseDTO（处理 Long → Integer）
    private List<MessageResponseDTO> convertToMessageResponseDTOList(List<ChatMessage> messageList) {
        return messageList.stream()
                .map(this::convertToMessageResponseDTO)
                .collect(Collectors.toList());
    }

    // 单个转换（核心：处理 Long 转 Integer 适配 DTO）
    private MessageResponseDTO convertToMessageResponseDTO(ChatMessage message) {
        MessageResponseDTO dto = new MessageResponseDTO();
        // 关键：Long 类型转 Integer（若 DTO 是 Integer 类型）
        dto.setId(message.getId() != null ? message.getId().intValue() : null);
        dto.setConversationId(message.getConversationId() != null ? message.getConversationId().intValue() : null);
        dto.setSenderId(message.getSenderId() != null ? message.getSenderId().intValue() : null);
        dto.setContent(message.getContent());
        dto.setType(message.getType());

        // UTC时间格式化（空值保护）
        if (message.getCreatedAt() != null) {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
            sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
            dto.setCreatedAt(sdf.format(message.getCreatedAt()));
        }

        return dto;
    }
}