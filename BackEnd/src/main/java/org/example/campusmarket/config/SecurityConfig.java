package org.example.campusmarket.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.example.campusmarket.Mapper.AuthMapper;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.entity.User;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
import java.util.List;
import java.util.function.Function;

@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {
    @Bean
    public JwtAuthFilter jwtAuthFilter(JwtProperties props, Function<Integer, String> roleResolver) {
        return new JwtAuthFilter(props, roleResolver);
    }

    /**
     * 角色回退解析器：当 token 中没有 role claim（升级前签发的旧 token）时，
     * 根据userId回退查 users 表的 role 字段。惰性求值，仅对携带旧 token 的请求生效一次。
     */
    @Bean
    public Function<Integer, String> roleResolver(AuthMapper authMapper) {
        return userId -> {
            User u = authMapper.findById(userId);
            return u == null ? null : u.getRole();
        };
    }

    @Bean
    public AuthenticationEntryPoint jsonEntryPoint() {
        ObjectMapper mapper = new ObjectMapper();
        return (request, response, ex) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            Result body = new Result(401, "用户未登录或令牌无效", null);
            response.getWriter().write(mapper.writeValueAsString(body));
        };
    }

    /**
     * 管理员权限不足时的统一 403 JSON 响应处理器。
     * 普通用户访问 /admin/** 时由该处理器返回中文提示，便于前端识别为"权限不足"而非"未登录"。
     */
    @Bean
    public AccessDeniedHandler jsonAccessDeniedHandler() {
        ObjectMapper mapper = new ObjectMapper();
        return (request, response, ex) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            Result body = new Result(403, "权限不足，需要管理员账号", null);
            response.getWriter().write(mapper.writeValueAsString(body));
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // 允许的前端地址
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://8.141.101.174:*"));
        // 允许的 HTTP 方法
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        // 允许的请求头
        configuration.setAllowedHeaders(List.of("*"));
        // 允许携带凭证（如 Cookie、Authorization）
        configuration.setAllowCredentials(true);
        // 预检请求缓存时间（秒）
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain apiSecurity(HttpSecurity http, JwtAuthFilter jwtAuthFilter,
            AuthenticationEntryPoint entryPoint, AccessDeniedHandler accessDeniedHandler) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()));
        http.csrf(csrf -> csrf.disable());
        // 配置 CSP 允许 blob: 和 data: 协议，解决图片预览和 AI 生成描述的问题
        http.headers(headers -> headers
                .contentSecurityPolicy(csp -> csp
                        .policyDirectives(
                                "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: data: blob:;")));

        http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        http.exceptionHandling(eh -> eh
                .authenticationEntryPoint(entryPoint)
                .accessDeniedHandler(accessDeniedHandler));
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/home/**", "/products/**").permitAll()
                .requestMatchers("/users/**").permitAll()
                // 评论接口：GET公开，POST/DELETE需要认证
                .requestMatchers(HttpMethod.GET, "/api/comments/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/comments/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/comments/**").authenticated()
                // 获取指定用户信息和发布的商品（公开接口）
                .requestMatchers(HttpMethod.GET, "/user/search").authenticated()
                .requestMatchers(HttpMethod.GET, "/user/{id}").permitAll()
                .requestMatchers(HttpMethod.GET, "/user/{id}/published").permitAll()
                .requestMatchers(HttpMethod.POST, "/user/me/avatar").authenticated()
                .requestMatchers("/user/**", "/favorites/**", "/orders/**", "/cart/**").authenticated()
                // 论坛接口：GET 公开，写操作需要认证
                .requestMatchers(HttpMethod.GET, "/forum/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/forum/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/forum/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/forum/**").authenticated()
                // 求购接口：大厅/详情/匹配公开，发布/编辑/关闭需要登录
                .requestMatchers(HttpMethod.GET, "/wants/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/wants/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/wants/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/wants/**").authenticated()
                // AI接口需要认证
                .requestMatchers("/ai/**").authenticated()
                // 系统消息接口需要认证
                .requestMatchers("/system-messages/**").authenticated()
                // 管理员后台接口：仅管理员可访问
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().permitAll());
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
