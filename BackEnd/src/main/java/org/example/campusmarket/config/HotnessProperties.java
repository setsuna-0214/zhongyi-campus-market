package org.example.campusmarket.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * 商品热度配置属性类
 * 用于绑定 application.properties 中的 hotness 配置项
 */
@Validated
@ConfigurationProperties(prefix = "hotness")
public class HotnessProperties {

    /**
     * 热度数据同步到数据库的间隔时间（毫秒）
     * 默认 5 分钟（300000 毫秒）
     */
    private long syncInterval = 300000;

    /**
     * 热门商品排行榜返回的最大商品数量
     * 默认 100 个
     */
    private int rankingSize = 100;

    public long getSyncInterval() {
        return syncInterval;
    }

    public void setSyncInterval(long syncInterval) {
        this.syncInterval = syncInterval;
    }

    public int getRankingSize() {
        return rankingSize;
    }

    public void setRankingSize(int rankingSize) {
        this.rankingSize = rankingSize;
    }
}
