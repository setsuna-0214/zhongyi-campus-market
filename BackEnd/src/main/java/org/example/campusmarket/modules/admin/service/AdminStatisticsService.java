package org.example.campusmarket.modules.admin.service;

import lombok.RequiredArgsConstructor;
import org.example.campusmarket.modules.admin.dto.AdminDto;
import org.example.campusmarket.modules.admin.mapper.AdminMapper;
import org.example.campusmarket.modules.want.repository.WantRequestRepository;
import org.springframework.stereotype.Service;

/**
 * 管理员首页统计服务
 * 汇总各业务模块的计数与今日新增，供首页仪表盘展示。
 */
@Service
@RequiredArgsConstructor
public class AdminStatisticsService {

    private final AdminMapper adminMapper;
    private final WantRequestRepository wantRequestRepository;

    public AdminDto.Statistics getStatistics() {
        AdminDto.Statistics s = new AdminDto.Statistics();
        s.setUserCount(adminMapper.countUsers());
        s.setProductCount(adminMapper.countProducts());
        s.setOrderCount(adminMapper.countOrders());
        s.setForumPostCount(adminMapper.countForumPosts());
        s.setWantCount(wantRequestRepository.count());
        s.setPendingReportCount(0L);
        s.setTodayNewProducts(adminMapper.countTodayNewProducts());
        s.setTodayNewPosts(adminMapper.countTodayNewPosts());
        return s;
    }
}