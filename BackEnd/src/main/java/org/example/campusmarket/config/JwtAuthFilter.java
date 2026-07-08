package org.example.campusmarket.config;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.function.Function;

/**
 * JWT 鉴权过滤器
 * <p>从 Authorization: Bearer 头中解析 JWT，校验后将 userId 作为 Principal 注入 SecurityContext。
 * <p>同时读取 token 中的 role claim，装配 Spring Security 角色权限（ROLE_USER / ROLE_ADMIN），
 *    以便 SecurityConfig 中 {@code .hasRole("ADMIN")} 对 /admin/** 的访问控制生效。
 * <p>对于不带 role claim 的旧 token（升级前签发），通过 roleResolver 回退查数据库兜底；
 *    roleResolver 由 SecurityConfig 注入，避免本过滤器直接依赖 Mapper 产生循环依赖。
 */
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtProperties props;
    /** 用于在缺失 role claim 时回退查询用户角色，参数为 userId，返回数据库中的 role 字符串 */
    private final Function<Integer, String> roleResolver;

    public JwtAuthFilter(JwtProperties props, Function<Integer, String> roleResolver) {
        this.props = props;
        this.roleResolver = roleResolver;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                DecodedJWT jwt = JWT.require(Algorithm.HMAC256(props.getSecret())).build().verify(token);
                String sub = jwt.getSubject();
                if (sub != null && !sub.isBlank()) {
                    Integer userId = Integer.valueOf(sub);
                    // 装配角色权限：优先读 token 中的 role claim，缺失时回退数据库
                    List<GrantedAuthority> authorities = buildAuthorities(jwt, userId);
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(userId, null, authorities);
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }

    /**
     * 根据 token 中的 role claim 构造 Spring Security 角色权限。
     * - token 中有 role：直接使用，避免每次请求查库；
     * - token 中无 role（升级前的旧 token）：用 roleResolver 回退查 users 表，查不到则按普通用户处理。
     * 角色统一转大写并加 ROLE_ 前缀，以匹配 SecurityConfig 的 hasRole("ADMIN")。
     */
    private List<GrantedAuthority> buildAuthorities(DecodedJWT jwt, Integer userId) {
        String role = jwt.getClaim("role").asString();
        if ((role == null || role.isBlank()) && roleResolver != null) {
            try {
                role = roleResolver.apply(userId);
            } catch (Exception ignored) {
                role = null;
            }
        }
        if (role == null || role.isBlank()) {
            role = "user";
        }
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
    }
}