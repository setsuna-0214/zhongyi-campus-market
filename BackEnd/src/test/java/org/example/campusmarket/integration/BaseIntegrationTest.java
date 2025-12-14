package org.example.campusmarket.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

/**
 * 集成测试基类
 * 使用 H2 内存数据库，每个测试方法后回滚事务
 * 数据库初始化通过 application-test.properties 配置的 SQL 脚本完成
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public abstract class BaseIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    /**
     * Mock 邮件发送器，避免测试时连接真实邮件服务器
     */
    @MockBean
    protected JavaMailSender javaMailSender;

    /**
     * 创建模拟认证，principal 为 Integer userId
     */
    protected Authentication createAuth(Integer userId) {
        return new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
    }
}
