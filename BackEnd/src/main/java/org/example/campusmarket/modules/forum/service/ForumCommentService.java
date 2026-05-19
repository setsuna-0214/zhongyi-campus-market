package org.example.campusmarket.modules.forum.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.campusmarket.modules.forum.dto.ForumCommentDto;
import org.example.campusmarket.modules.forum.entity.ForumComment;
import org.example.campusmarket.modules.forum.mapper.ForumCommentMapper;
import org.example.campusmarket.modules.forum.repository.ForumCommentRepository;
import org.example.campusmarket.modules.forum.repository.ForumPostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 论坛评论 Service
 * 支持顶层评论和楼中楼回复的 CRUD
 */
@Service
@RequiredArgsConstructor
public class ForumCommentService {

    private final ForumCommentRepository commentRepository;
    private final ForumCommentMapper commentMapper;
    private final ForumPostRepository postRepository;
    private final ObjectMapper objectMapper;

    /**
     * 分页查询帖子评论（带楼中楼）
     *
     * @param postId   帖子ID
     * @param sort     排序：asc（默认）/ desc / hot
     * @param page     页码（1-indexed）
     * @param pageSize 每页数量
     */
    public ForumCommentDto.CommentPageResult getComments(Long postId, String sort, int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        List<ForumCommentDto.CommentItem> topComments = commentMapper.getTopLevelComments(postId, sort, offset, pageSize);
        long total = commentMapper.countTopLevelComments(postId);

        if (!topComments.isEmpty()) {
            // 批量查询所有顶层评论的楼中楼（避免 N+1）
            List<Long> rootIds = topComments.stream()
                    .map(ForumCommentDto.CommentItem::getId)
                    .collect(Collectors.toList());
            List<ForumCommentDto.ReplyItem> allReplies = commentMapper.getBatchNestedReplies(rootIds);

            // 按 rootId 分组
            Map<Long, List<ForumCommentDto.ReplyItem>> repliesMap = allReplies.stream()
                    .collect(Collectors.groupingBy(ForumCommentDto.ReplyItem::getRootId));

            // 解析图片 JSON，注入楼中楼
            topComments.forEach(comment -> {
                parseCommentImages(comment);
                comment.setReplies(repliesMap.getOrDefault(comment.getId(), new ArrayList<>()));
            });
        }

        return new ForumCommentDto.CommentPageResult(topComments, total, page, pageSize);
    }

    /**
     * 发表顶层评论（一级楼）
     */
    @Transactional
    public ForumComment createComment(Integer userId, ForumCommentDto.CreateCommentRequest req) {
        ForumComment comment = new ForumComment();
        comment.setPostId(req.getPostId());
        comment.setUserId(userId);
        comment.setContent(req.getContent());
        comment.setImages(serializeImages(req.getImages()));
        // 顶层评论：parentId 和 rootId 均为 null
        comment.setParentId(null);
        comment.setRootId(null);
        ForumComment saved = commentRepository.save(comment);

        // 更新帖子评论计数
        postRepository.incrementCommentCount(req.getPostId());
        return saved;
    }

    /**
     * 发表楼中楼回复
     */
    @Transactional
    public ForumComment createReply(Integer userId, ForumCommentDto.CreateReplyRequest req) {
        // 验证 rootId 指向的是一级评论
        ForumComment root = commentRepository.findById(req.getRootId())
                .orElseThrow(() -> new RuntimeException("根评论不存在"));
        if (root.getParentId() != null) {
            throw new RuntimeException("rootId 必须指向顶层评论");
        }

        ForumComment reply = new ForumComment();
        reply.setPostId(req.getPostId());
        reply.setUserId(userId);
        reply.setContent(req.getContent());
        reply.setParentId(req.getParentId());
        reply.setRootId(req.getRootId());
        reply.setReplyToUserId(req.getReplyToUserId());
        // 楼中楼不支持图片
        reply.setImages(null);
        ForumComment saved = commentRepository.save(reply);

        // 更新帖子评论计数
        postRepository.incrementCommentCount(req.getPostId());
        return saved;
    }

    /**
     * 删除评论（软删除，只有作者可操作）
     */
    @Transactional
    public void deleteComment(Long commentId, Integer userId) {
        ForumComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("评论不存在"));
        if (!comment.getUserId().equals(userId)) {
            throw new RuntimeException("无权限删除此评论");
        }
        int affected = commentRepository.softDeleteByIdAndUserId(commentId, userId);
        if (affected > 0) {
            postRepository.decrementCommentCount(comment.getPostId());
        }
    }

    // ----------------------------------------------------------------
    // 工具方法
    // ----------------------------------------------------------------

    private String serializeImages(List<String> images) {
        if (images == null || images.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(images);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private void parseCommentImages(ForumCommentDto.CommentItem comment) {
        if (comment.getImages() == null) return;
        try {
            List<String> imageList = objectMapper.readValue(
                    (String) (Object) comment.getImages(),
                    new TypeReference<List<String>>() {});
            comment.setImages(imageList);
        } catch (Exception ignored) {
        }
    }
}
