package org.example.campusmarket.Service;

import org.example.campusmarket.Mapper.CommentMapper;
import org.example.campusmarket.entity.Comment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CommentService {
    
    @Autowired
    private CommentMapper commentMapper;
    
    public Comment addComment(Integer productId, Integer userId, String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("评论内容不能为空");
        }
        if (content.length() > 500) {
            throw new IllegalArgumentException("评论内容不能超过500字");
        }
        
        Comment comment = new Comment();
        comment.setProductId(productId);
        comment.setUserId(userId);
        comment.setContent(content.trim());
        
        commentMapper.insertComment(comment);
        
        // 重新查询以获取完整信息（包括用户昵称和头像）
        List<Comment> comments = commentMapper.findByProductId(productId);
        return comments.stream()
                .filter(c -> c.getId().equals(comment.getId()))
                .findFirst()
                .orElse(comment);
    }
    
    public List<Comment> getCommentsByProductId(Integer productId) {
        return commentMapper.findByProductId(productId);
    }
    
    public int getCommentCount(Integer productId) {
        return commentMapper.countByProductId(productId);
    }
    
    public void deleteComment(Integer commentId, Integer userId) {
        Comment comment = commentMapper.findById(commentId);
        if (comment == null) {
            throw new IllegalArgumentException("评论不存在");
        }
        if (!comment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("无权删除此评论");
        }
        commentMapper.deleteById(commentId);
    }
}
