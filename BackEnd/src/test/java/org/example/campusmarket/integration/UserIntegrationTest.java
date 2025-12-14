package org.example.campusmarket.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 用户模块集成测试
 * 测试用户相关 API 的完整流程
 */
@DisplayName("用户模块集成测试")
class UserIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("获取用户信息 - 成功")
    void testGetUserInfo_Success() throws Exception {
        mockMvc.perform(get("/user/me")
                        .with(authentication(createAuth(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.username").value("testuser1"))
                .andExpect(jsonPath("$.data.email").value("test1@test.com"));
    }

    @Test
    @DisplayName("获取用户信息 - 用户不存在")
    void testGetUserInfo_NotFound() throws Exception {
        mockMvc.perform(get("/user/me")
                        .with(authentication(createAuth(999))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    @DisplayName("获取用户发布的商品")
    void testGetPublishedProducts() throws Exception {
        mockMvc.perform(get("/user/published")
                        .with(authentication(createAuth(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("关注用户 - 成功")
    void testFollowUser_Success() throws Exception {
        // 用户1关注用户3（之前没有关注）
        mockMvc.perform(post("/user/follows/3")
                        .with(authentication(createAuth(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("取消关注用户 - 成功")
    void testUnfollowUser_Success() throws Exception {
        // 用户1取消关注用户2（之前已关注）
        mockMvc.perform(delete("/user/follows/2")
                        .with(authentication(createAuth(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("获取关注列表")
    void testGetFollowList() throws Exception {
        mockMvc.perform(get("/user/follows")
                        .with(authentication(createAuth(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("检查关注状态 - 已关注")
    void testCheckFollowStatus_Following() throws Exception {
        // 用户1已关注用户2
        mockMvc.perform(get("/user/follows/2/check")
                        .with(authentication(createAuth(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.following").value(true));
    }

    @Test
    @DisplayName("检查关注状态 - 未关注")
    void testCheckFollowStatus_NotFollowing() throws Exception {
        // 用户1未关注用户3
        mockMvc.perform(get("/user/follows/3/check")
                        .with(authentication(createAuth(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.following").value(false));
    }

    @Test
    @DisplayName("搜索用户")
    void testSearchUsers() throws Exception {
        mockMvc.perform(get("/user/search")
                        .param("keyword", "test")
                        .param("page", "1")
                        .param("pageSize", "10")
                        .with(authentication(createAuth(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }
}
