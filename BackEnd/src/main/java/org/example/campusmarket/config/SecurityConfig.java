package org.example.campusmarket.config;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.example.campusmarket.entity.Result;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {
    @Bean
    public JwtAuthFilter jwtAuthFilter(JwtProperties props) {
        return new JwtAuthFilter(props);
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

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // 允许的前端地址
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3001",
            "http://localhost:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:3000"
        ));
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
    public SecurityFilterChain apiSecurity(HttpSecurity http, JwtAuthFilter jwtAuthFilter, AuthenticationEntryPoint entryPoint) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()));
        http.csrf(csrf -> csrf.disable());
        http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        http.exceptionHandling(eh -> eh.authenticationEntryPoint(entryPoint));
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
                .anyRequest().permitAll()
        );
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
