package org.example.campusmarket.Controller;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContext;
import org.springframework.security.test.context.support.WithSecurityContextFactory;
import org.springframework.security.web.SecurityFilterChain;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.util.Collections;

/**
 * 测试安全配置
 * 用于模拟 Authentication.getPrincipal() 返回 Integer userId
 */
@TestConfiguration
@EnableWebSecurity
public class TestSecurityConfig {

    @Bean
    public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    /**
     * 自定义注解，用于模拟带有 Integer userId 的认证
     */
    @Retention(RetentionPolicy.RUNTIME)
    @WithSecurityContext(factory = WithMockUserIdSecurityContextFactory.class)
    public @interface WithMockUserId {
        int value() default 1;
    }

    /**
     * 创建包含 Integer userId 作为 principal 的 SecurityContext
     */
    public static class WithMockUserIdSecurityContextFactory 
            implements WithSecurityContextFactory<WithMockUserId> {
        
        @Override
        public SecurityContext createSecurityContext(WithMockUserId annotation) {
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            
            // 创建 Authentication，principal 为 Integer userId
            Authentication auth = new UsernamePasswordAuthenticationToken(
                annotation.value(),  // principal 是 Integer
                null,
                Collections.emptyList()
            );
            
            context.setAuthentication(auth);
            return context;
        }
    }
}
