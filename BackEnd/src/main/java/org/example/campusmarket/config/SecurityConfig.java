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
    public SecurityFilterChain apiSecurity(HttpSecurity http, JwtAuthFilter jwtAuthFilter, AuthenticationEntryPoint entryPoint) throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        http.exceptionHandling(eh -> eh.authenticationEntryPoint(entryPoint));
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/home/**", "/products/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/user/me/avatar").authenticated()
                .requestMatchers("/user/**", "/favorites/**", "/orders/**", "/cart/**").authenticated()
                .anyRequest().permitAll()
        );
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
