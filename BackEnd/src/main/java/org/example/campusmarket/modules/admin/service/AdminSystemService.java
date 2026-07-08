package org.example.campusmarket.modules.admin.service;

import lombok.RequiredArgsConstructor;
import org.example.campusmarket.modules.admin.dto.AdminDto;
import org.example.campusmarket.modules.admin.mapper.AdminMapper;
import org.example.campusmarket.modules.want.repository.WantRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 管理员系统状态服务
 * 探测后端、数据库、Redis 的连通性，并汇总当前环境与各业务计数，
 * 供管理员后台"系统状态"页面展示。任一外部依赖探测失败不影响其它项。
 */
@Service
@RequiredArgsConstructor
public class AdminSystemService {

    private static final Logger log = LoggerFactory.getLogger(AdminSystemService.class);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final DataSource dataSource;
    private final RedisConnectionFactory redisConnectionFactory;
    private final Environment environment;
    private final AdminMapper adminMapper;
    private final WantRequestRepository wantRequestRepository;

    public AdminDto.SystemStatus getSystemStatus() {
        AdminDto.SystemStatus status = new AdminDto.SystemStatus();
        // 后端本身能响应即视为正常
        status.setBackend("正常");
        status.setDatabase(probeDatabase());
        status.setRedis(probeRedis());
        // 当前激活的 Spring Profile（多个用逗号分隔）
        status.setProfile(String.join(",", environment.getActiveProfiles()));
        status.setServerTime(LocalDateTime.now().format(FMT));
        status.setUserCount(adminMapper.countUsers());
        status.setProductCount(adminMapper.countProducts());
        status.setOrderCount(adminMapper.countOrders());
        status.setForumPostCount(adminMapper.countForumPosts());
        status.setWantCount(wantRequestRepository.count());
        return status;
    }

    /** 探测数据库连通性：尝试获取连接并简单校验 */
    private String probeDatabase() {
        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(2)) {
                return "正常";
            }
            return "异常";
        } catch (Exception e) {
            log.warn("数据库探活失败: {}", e.getMessage());
            return "异常";
        }
    }

    /** 探测 Redis 连通性：打开连接并发送 PING */
    private String probeRedis() {
        try {
            String pong = redisConnectionFactory.getConnection().ping();
            return "PONG".equalsIgnoreCase(pong) ? "正常" : "异常";
        } catch (Exception e) {
            log.warn("Redis 探活失败: {}", e.getMessage());
            return "异常";
        }
    }
}