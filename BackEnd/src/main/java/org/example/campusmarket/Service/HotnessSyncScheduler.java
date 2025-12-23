package org.example.campusmarket.Service;

import org.example.campusmarket.config.HotnessProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 热度数据同步定时任务
 * 定期将 Redis 中的热度增量数据同步到 MySQL 数据库
 * 
 * Requirements: 3.1
 */
@Component
public class HotnessSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(HotnessSyncScheduler.class);

    private final ProductHotnessService productHotnessService;
    private final HotnessProperties hotnessProperties;

    public HotnessSyncScheduler(ProductHotnessService productHotnessService,
                                 HotnessProperties hotnessProperties) {
        this.productHotnessService = productHotnessService;
        this.hotnessProperties = hotnessProperties;
    }

    /**
     * 定时同步热度数据到数据库
     * 同步间隔从配置文件读取，默认 5 分钟（300000 毫秒）
     */
    @Scheduled(fixedRateString = "${hotness.sync-interval:300000}")
    public void syncHotnessData() {
        log.info("定时任务：开始同步热度数据，同步间隔: {} ms", hotnessProperties.getSyncInterval());
        try {
            productHotnessService.syncToDatabase();
            log.info("定时任务：热度数据同步完成");
        } catch (Exception e) {
            log.error("定时任务：热度数据同步失败", e);
        }
    }
}
