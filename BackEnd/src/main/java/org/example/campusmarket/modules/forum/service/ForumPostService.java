package org.example.campusmarket.modules.forum.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.campusmarket.modules.forum.dto.ForumPostDto;
import org.example.campusmarket.modules.forum.entity.ForumPost;
import org.example.campusmarket.modules.forum.mapper.ForumPostMapper;
import org.example.campusmarket.modules.forum.repository.ForumPostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 论坛帖子 Service
 * - 发帖/编辑/删除：使用 JPA
 * - 列表查询：使用 MyBatis 动态 SQL
 */
@Service
@RequiredArgsConstructor
public class ForumPostService {

    private final ForumPostRepository postRepository;
    private final ForumPostMapper postMapper;
    private final ObjectMapper objectMapper;

    // ----------------------------------------------------------------
    // 分页查询（MyBatis）
    // ----------------------------------------------------------------

    /**
     * 分页查询帖子列表
     *
     * @param postType 帖子类型（null/all 不过滤）
     * @param keyword  关键字搜索
     * @param userId   指定用户（null 不过滤）
     * @param sort     排序方式：latest（默认）/ hot / views
     * @param page     当前页（1-indexed）
     * @param pageSize 每页数量
     */
    public ForumPostDto.PostPageResult searchPosts(String postType, String keyword,
                                                    Integer userId, String sort,
                                                    int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        List<ForumPostDto.PostListItem> posts = postMapper.searchPosts(
                postType, keyword, userId, sort, offset, pageSize);
        long total = postMapper.countPosts(postType, keyword, userId);

        // 解析图片 JSON，提取 coverImage
        posts.forEach(this::processPostImages);

        return new ForumPostDto.PostPageResult(posts, total, page, pageSize);
    }

    /**
     * 获取帖子详情
     */
    public ForumPostDto.PostDetail getPostDetail(Long postId) {
        ForumPostDto.PostDetail detail = postMapper.getPostDetail(postId);
        if (detail == null) return null;
        // 解析图片 JSON
        if (detail.getImages() == null && detail.getContent() != null) {
            // images 字段由 mapper 直接映射，此处仅处理类型转换
        }
        return detail;
    }

    /**
     * 获取某用户的帖子列表（用于个人中心/他人主页）
     */
    public ForumPostDto.PostPageResult getPostsByUserId(Integer userId, int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        List<ForumPostDto.PostListItem> posts = postMapper.getPostsByUserId(userId, offset, pageSize);
        long total = postMapper.countPostsByUserId(userId);
        posts.forEach(this::processPostImages);
        return new ForumPostDto.PostPageResult(posts, total, page, pageSize);
    }

    // ----------------------------------------------------------------
    // 基础 CRUD（JPA）
    // ----------------------------------------------------------------

    /**
     * 发布帖子
     */
    @Transactional
    public ForumPost createPost(Integer userId, ForumPostDto.CreatePostRequest req) {
        ForumPost post = new ForumPost();
        post.setUserId(userId);
        post.setTitle(req.getTitle().trim());
        post.setContent(req.getContent());
        post.setPostType(req.getPostType() != null ? req.getPostType() : "normal");
        post.setImages(serializeImages(req.getImages()));
        return postRepository.save(post);
    }

    /**
     * 编辑帖子（只有作者可以编辑）
     */
    @Transactional
    public ForumPost updatePost(Long postId, Integer userId, ForumPostDto.UpdatePostRequest req) {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("帖子不存在"));
        if (!post.getUserId().equals(userId)) {
            throw new RuntimeException("无权限编辑此帖子");
        }
        if (post.getIsDeleted()) {
            throw new RuntimeException("帖子已删除");
        }
        if (req.getTitle() != null) post.setTitle(req.getTitle().trim());
        if (req.getContent() != null) post.setContent(req.getContent());
        if (req.getPostType() != null) post.setPostType(req.getPostType());
        if (req.getImages() != null) post.setImages(serializeImages(req.getImages()));
        return postRepository.save(post);
    }

    /**
     * 删除帖子（软删除，只有作者可操作）
     */
    @Transactional
    public void deletePost(Long postId, Integer userId) {
        int affected = postRepository.softDeleteByIdAndUserId(postId, userId);
        if (affected == 0) {
            throw new RuntimeException("帖子不存在或无权限删除");
        }
    }

    // ----------------------------------------------------------------
    // 工具方法
    // ----------------------------------------------------------------

    /**
     * 将图片 URL 列表序列化为 JSON 字符串
     */
    private String serializeImages(List<String> images) {
        if (images == null || images.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(images);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    /**
     * 解析 images JSON 字段，提取 coverImage
     */
    private void processPostImages(ForumPostDto.PostListItem item) {
        if (item.getImages() == null) return;
        try {
            List<String> imageList = objectMapper.readValue(
                    (String) (Object) item.getImages(),
                    new TypeReference<List<String>>() {});
            item.setImages(imageList);
            if (!imageList.isEmpty()) {
                item.setCoverImage(imageList.get(0));
            }
        } catch (Exception ignored) {
            // images 字段非 JSON 或解析失败时忽略
        }
    }
}
