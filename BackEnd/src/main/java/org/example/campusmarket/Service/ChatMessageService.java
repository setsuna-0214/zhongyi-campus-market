package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.MessageDTO;
import org.example.campusmarket.entity.ChatMessage;
import org.example.campusmarket.Mapper.ChatMessageMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.Date;
import java.util.List;
import java.util.UUID; // 新增：用于自动生成msgId
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ChatService {
    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatMessageMapper chatMessageMapper;

    // 发送私聊消息：修复重复插入+自动生成msgId（兼容前端没传的情况）
    public void sendPrivateMessage(MessageDTO dto) {
        // 1. 兼容前端没传msgId的情况：自动生成唯一msgId
        String msgId = dto.getMsgId();
        if (msgId == null || msgId.trim().isEmpty()) {
            msgId = UUID.randomUUID().toString().replace("-", ""); // 自动生成32位唯一ID
            log.info("前端未传msgId，自动生成：{}，发送人：{}，接收人：{}",
                    msgId, dto.getSenderId(), dto.getReceiverId());
            dto.setMsgId(msgId); // 把生成的msgId回写到DTO（可选）
        }

        // 打印接收的消息基础信息
        log.info("收到前端消息：senderId={}, receiverId={}, content={}, msgId={}",
                dto.getSenderId(), dto.getReceiverId(), dto.getContent(), msgId);

        // 2. 构建实体类，匹配表字段（包含msgId）
        ChatMessage message = new ChatMessage();
        message.setSenderId(dto.getSenderId());
        message.setReceiverId(dto.getReceiverId());
        message.setContent(dto.getContent());
        message.setSendTime(new Date());
        message.setIsRead(0);
        message.setMsgId(msgId); // 存入msgId（自动生成/前端传的）

        try {
            // 3. 插入数据库（仅执行一次）
            int insertResult = chatMessageMapper.insert(message);
            log.info("消息插入数据库成功！msgId={}, 插入结果={}, 消息ID={}",
                    msgId, insertResult, message.getId());

            // 4. 推送消息给接收者（仅执行一次）
            log.info("准备推送消息给用户{}，msgId={}", dto.getReceiverId(), msgId);
            messagingTemplate.convertAndSendToUser(
                    dto.getReceiverId().toString(),
                    "/private",
                    dto
            );
            log.info("消息推送完成！msgId={}", msgId);

        } catch (Exception e) {
            // 5. 捕获重复插入异常（唯一索引冲突）
            if (e.getMessage() != null && e.getMessage().contains("idx_msg_id")) {
                log.warn("消息已存在，避免重复插入！msgId={}", msgId);
            } else {
                log.error("消息处理失败！msgId={}", msgId, e);
            }
        }
    }

    // 查询历史消息：复用Mapper的selectHistory
    public List<ChatMessage> getHistoryMessage(Long userId1, Long userId2) {
        log.info("查询历史消息：用户{}和用户{}的聊天记录", userId1, userId2);
        return chatMessageMapper.selectHistory(userId1, userId2);
    }
}