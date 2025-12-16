package org.example.campusmarket.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 热度数据加载器
 * 在应用启动时从数据库加载热度数据到 Redis
 * 
 * Requirements: 3.4
 */
@Component
public class HotnessDataLoader implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(HotnessDataLoader.class);

    private final ProductHotnessService productHotnessService;

    public HotnessDataLoader(ProductHotnessService productHotnessService) {
        this.productHotnessService = productHotnessService;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("应用启动：开始加载热度数据到 Redis...");
        try {
            productHotnessService.loadFromDatabase();
            log.info("应用启动：热度数据加载完成");
        } catch (Exception e) {
            log.error("应用启动：热度数据加载失败，系统将继续运行但热度数据可能不完整", e);
            // 不抛出异常，允许应用继续启动
        }
    }
}
