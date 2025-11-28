package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.ConversationDTO;
import org.example.campusmarket.DTO.CreateConversationDTO;
import org.example.campusmarket.DTO.CreateConversationResponseDTO;
import org.example.campusmarket.entity.ChatConversation;
import org.example.campusmarket.entity.UserInfo;
import org.example.campusmarket.Mapper.ChatConversationMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.TimeZone;

/**
 * 聊天会话服务（原生 MyBatis 版，移除所有 MP 语法）
 */
@Service
public class ChatConversationService {

    @Autowired
    private ChatConversationMapper conversationMapper;

    @Autowired
    private UserService userService;

    // 获取用户会话列表（适配原生 MyBatis Mapper 方法）
    public List<ConversationDTO> getConversationList(Integer userId) {
        if (userId == null) {
            throw new RuntimeException("用户ID不能为空");
        }
        // 调用原生 MyBatis Mapper 的 selectByUserId 方法（替代 MP 的 selectList + Wrapper）
        List<ChatConversation> conversationList = conversationMapper.selectByUserId(Long.valueOf(userId));
        // 转换为 DTO（需补充 ConversationDTO 转换逻辑）
        return convertToConversationDTOList(conversationList);
    }

    // 创建会话（移除 QueryWrapper，改用原生 MyBatis 自定义查询）
    @Transactional(rollbackFor = Exception.class)
    public CreateConversationResponseDTO createConversation(Integer currentUserId, CreateConversationDTO dto) {
        // 参数校验
        if (currentUserId == null) {
            throw new RuntimeException("当前用户ID不能为空");
        }
        if (dto == null || dto.getUserId() == null) {
            throw new RuntimeException("目标用户ID不能为空");
        }
        Integer targetUserId = dto.getUserId();

        // 查询对方用户
        UserInfo targetUser = userService.GetUserInfoById(targetUserId);
        if (targetUser == null) {
            throw new RuntimeException("对方用户不存在");
        }

        // 查询已有会话（替代 MP 的 QueryWrapper + selectOne）
        ChatConversation existConversation = conversationMapper.selectByUserAndTarget(
                Long.valueOf(currentUserId),
                Long.valueOf(targetUserId),
                dto.getOrderId() != null ? Long.valueOf(dto.getOrderId()) : null
        );

        if (existConversation != null) {
            return convertToCreateResponseDTO(existConversation);
        }

        // 创建新会话
        ChatConversation conversation = new ChatConversation();
        conversation.setUserId(Long.valueOf(currentUserId));
        conversation.setTargetUserId(Long.valueOf(targetUserId));
        conversation.setTargetUserName(targetUser.getNickname());
        conversation.setTargetUserAvatar(targetUser.getAvatar());
        conversation.setOrderId(dto.getOrderId() != null ? Long.valueOf(dto.getOrderId()) : null);
        conversation.setProductId(dto.getProductId() != null ? Long.valueOf(dto.getProductId()) : null);
        conversation.setUnreadCount(0);
        conversation.setCreatedAt(new Date());
        conversation.setUpdatedAt(new Date());

        // 插入数据库（调用原生 MyBatis 的 insert 方法）
        conversationMapper.insert(conversation);

        return convertToCreateResponseDTO(conversation);
    }

    // 删除会话（适配原生 MyBatis）
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteConversation(Integer currentUserId, Integer conversationId) {
        if (currentUserId == null || conversationId == null) {
            throw new RuntimeException("参数不能为空");
        }

        // 校验会话归属（调用原生 MyBatis 的 selectById 方法）
        ChatConversation conversation = conversationMapper.selectById(Long.valueOf(conversationId));
        if (conversation == null) {
            throw new RuntimeException("会话不存在");
        }
        // 注意：实体类已改为 Long 类型，需转换对比
        if (!conversation.getUserId().equals(Long.valueOf(currentUserId))) {
            throw new RuntimeException("无权限删除该会话");
        }

        // 调用原生 MyBatis 的 deleteById 方法
        return conversationMapper.deleteById(Long.valueOf(conversationId)) > 0;
    }

    // 更新会话最后一条消息（适配原生 MyBatis）
    public void updateConversationLastMessage(Integer conversationId, String lastMessage, boolean isUnread) {
        if (conversationId == null || lastMessage == null) {
            throw new RuntimeException("会话ID和消息内容不能为空");
        }
        // 调用原生 MyBatis 的自定义更新方法
        conversationMapper.updateConversationLastMessage(
                Long.valueOf(conversationId),
                lastMessage,
                isUnread ? 1 : 0
        );
    }

    // 清空未读数（适配原生 MyBatis）
    public void clearUnreadCount(Integer conversationId) {
        if (conversationId == null) {
            throw new RuntimeException("会话ID不能为空");
        }
        // 调用原生 MyBatis 的自定义更新方法
        conversationMapper.clearUnreadCount(Long.valueOf(conversationId));
    }

    // 转换为响应DTO（适配 Long 类型主键）
    private CreateConversationResponseDTO convertToCreateResponseDTO(ChatConversation conversation) {
        CreateConversationResponseDTO response = new CreateConversationResponseDTO();
        // 实体类 ID 已改为 Long，需转换为 Integer（或修改 DTO 为 Long 类型）
        response.setId(conversation.getId().intValue());
        response.setUserId(conversation.getTargetUserId().intValue());
        response.setUserName(conversation.getTargetUserName());
        response.setUserAvatar(conversation.getTargetUserAvatar());
        response.setOrderId(conversation.getOrderId() != null ? conversation.getOrderId().intValue() : null);

        // UTC时间格式化
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        response.setCreatedAt(sdf.format(conversation.getCreatedAt()));

        return response;
    }

    // 补充：ChatConversation 转 ConversationDTO 列表（核心转换逻辑）
    private List<ConversationDTO> convertToConversationDTOList(List<ChatConversation> conversationList) {
        // 实现实体类到 DTO 的转换逻辑，示例：
        return conversationList.stream().map(conversation -> {
            ConversationDTO dto = new ConversationDTO();
            dto.setId(conversation.getId().intValue());
            dto.setUserId(conversation.getUserId().intValue());
            dto.setTargetUserId(conversation.getTargetUserId().intValue());
            dto.setTargetUserName(conversation.getTargetUserName());
            dto.setTargetUserAvatar(conversation.getTargetUserAvatar());
            dto.setOrderId(conversation.getOrderId() != null ? conversation.getOrderId().intValue() : null);
            dto.setProductId(conversation.getProductId() != null ? conversation.getProductId().intValue() : null);
            dto.setLastMessage(conversation.getLastMessage());
            dto.setUnreadCount(conversation.getUnreadCount());
            dto.setCreatedAt(conversation.getCreatedAt());
            dto.setUpdatedAt(conversation.getUpdatedAt());
            return dto;
        }).toList();
    }
}