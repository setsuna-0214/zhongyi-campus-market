package org.example.campusmarket.Service;

import org.example.campusmarket.Mapper.ProductMapper;
import org.example.campusmarket.config.HotnessProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * 商品热度服务
 * 负责管理商品热度数据的读写和同步
 */
@Service
public class ProductHotnessService {

    private static final Logger log = LoggerFactory.getLogger(ProductHotnessService.class);

    // Redis key 常量
    /** 商品浏览量计数 key 前缀，格式: product:view:{productId} */
    public static final String KEY_VIEW_COUNT = "product:view:";
    
    /** 待同步的浏览量增量 key 前缀，格式: product:view:delta:{productId} */
    public static final String KEY_VIEW_DELTA = "product:view:delta:";
    
    /** 热门商品排行榜 key */
    public static final String KEY_HOT_RANKING = "product:hot:ranking";

    private final StringRedisTemplate stringRedisTemplate;
    private final HotnessProperties hotnessProperties;
    private final ProductMapper productMapper;

    public ProductHotnessService(StringRedisTemplate stringRedisTemplate, 
                                  HotnessProperties hotnessProperties,
                                  ProductMapper productMapper) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.hotnessProperties = hotnessProperties;
        this.productMapper = productMapper;
    }

    /**
     * 获取浏览量 key
     */
    public String getViewCountKey(Integer productId) {
        return KEY_VIEW_COUNT + productId;
    }

    /**
     * 获取增量 key
     */
    public String getViewDeltaKey(Integer productId) {
        return KEY_VIEW_DELTA + productId;
    }

    /**
     * 增加商品浏览量
     * 使用 Redis INCR 原子递增浏览量，同时更新排行榜 ZSet 分数，
     * 并记录增量到 delta key 用于后续同步到数据库
     * 
     * 当 Redis 连接不可用时，降级到直接更新数据库
     *
     * @param productId 商品ID
     * @return 递增后的浏览量，降级模式下返回 null
     */
    public Long incrementViewCount(Integer productId) {
        if (productId == null) {
            throw new IllegalArgumentException("productId cannot be null");
        }

        try {
            String viewCountKey = getViewCountKey(productId);
            String viewDeltaKey = getViewDeltaKey(productId);

            // 1. 原子递增浏览量
            Long newCount = stringRedisTemplate.opsForValue().increment(viewCountKey);
            
            // 2. 记录增量到 delta key，用于后续同步到数据库
            stringRedisTemplate.opsForValue().increment(viewDeltaKey);
            
            // 3. 更新排行榜 ZSet 分数
            stringRedisTemplate.opsForZSet().incrementScore(KEY_HOT_RANKING, productId.toString(), 1);

            log.debug("商品 {} 浏览量递增，当前浏览量: {}", productId, newCount);
            
            return newCount;
        } catch (Exception e) {
            // Redis 连接失败，降级到直接更新 MySQL
            log.warn("Redis 连接失败，降级到直接更新数据库。商品ID: {}, 错误: {}", productId, e.getMessage());
            return fallbackIncrementViewCount(productId);
        }
    }
    
    /**
     * 安全增加商品浏览量（带防重复机制）
     * 使用 Redis SETNX 防止短时间内重复计数（1秒内同一请求不重复计数）
     * 
     * @param productId 商品ID
     * @param requestId 请求唯一标识（可以是 sessionId + timestamp 等）
     * @return 递增后的浏览量，如果是重复请求则返回当前浏览量而不递增
     */
    public Long incrementViewCountSafe(Integer productId, String requestId) {
        if (productId == null) {
            throw new IllegalArgumentException("productId cannot be null");
        }
        
        // 如果没有提供 requestId，直接调用普通的递增方法
        if (requestId == null || requestId.isEmpty()) {
            return incrementViewCount(productId);
        }

        try {
            // 使用 SETNX 检查是否是重复请求（1秒内）
            String dedupeKey = "product:view:dedupe:" + productId + ":" + requestId;
            Boolean isNew = stringRedisTemplate.opsForValue().setIfAbsent(
                dedupeKey, "1", java.time.Duration.ofSeconds(1));
            
            if (isNew == null || !isNew) {
                // 重复请求，只返回当前浏览量，不递增
                log.debug("商品 {} 重复浏览请求被忽略，requestId: {}", productId, requestId);
                return getViewCount(productId);
            }
            
            // 不是重复请求，执行正常的递增逻辑
            return incrementViewCount(productId);
        } catch (Exception e) {
            log.warn("防重复检查失败，降级到普通递增。商品ID: {}, 错误: {}", productId, e.getMessage());
            return incrementViewCount(productId);
        }
    }

    /**
     * 降级方法：直接更新数据库中的浏览量
     * 当 Redis 不可用时调用此方法
     *
     * @param productId 商品ID
     * @return 更新成功返回 null（无法获取实时计数），更新失败也返回 null
     */
    private Long fallbackIncrementViewCount(Integer productId) {
        try {
            int updated = productMapper.incrementViewCount(productId);
            if (updated > 0) {
                log.info("降级模式：商品 {} 浏览量已直接更新到数据库", productId);
            } else {
                log.warn("降级模式：商品 {} 不存在，无法更新浏览量", productId);
            }
            // 降级模式下无法返回准确的浏览量，返回 null
            return null;
        } catch (Exception dbException) {
            log.error("降级模式：更新数据库失败。商品ID: {}, 错误: {}", productId, dbException.getMessage());
            return null;
        }
    }

    /**
     * 获取单个商品浏览量
     * 从 Redis 获取商品的实时浏览量
     *
     * @param productId 商品ID
     * @return 当前浏览量，不存在时返回 0
     */
    public Long getViewCount(Integer productId) {
        if (productId == null) {
            return 0L;
        }

        String viewCountKey = getViewCountKey(productId);
        String value = stringRedisTemplate.opsForValue().get(viewCountKey);
        
        if (value == null) {
            return 0L;
        }
        
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            log.warn("商品 {} 浏览量格式错误: {}", productId, value);
            return 0L;
        }
    }

    /**
     * 批量获取商品浏览量
     * 使用 Redis mget 批量获取多个商品的浏览量
     *
     * @param productIds 商品ID列表
     * @return Map<商品ID, 浏览量>，不存在的商品浏览量为 0
     */
    public Map<Integer, Long> getViewCounts(List<Integer> productIds) {
        Map<Integer, Long> result = new HashMap<>();
        
        if (productIds == null || productIds.isEmpty()) {
            return result;
        }

        // 构建所有 key
        List<String> keys = new ArrayList<>();
        for (Integer productId : productIds) {
            if (productId != null) {
                keys.add(getViewCountKey(productId));
            }
        }

        if (keys.isEmpty()) {
            return result;
        }

        // 批量获取
        List<String> values = stringRedisTemplate.opsForValue().multiGet(keys);

        // 组装结果
        int index = 0;
        for (Integer productId : productIds) {
            if (productId != null) {
                String value = values != null && index < values.size() ? values.get(index) : null;
                long count = 0L;
                if (value != null) {
                    try {
                        count = Long.parseLong(value);
                    } catch (NumberFormatException e) {
                        log.warn("商品 {} 浏览量格式错误: {}", productId, value);
                    }
                }
                result.put(productId, count);
                index++;
            }
        }

        return result;
    }

    /**
     * 获取热门商品排行榜
     * 从 Redis Sorted Set 获取 Top N 商品，按热度分数降序排列
     *
     * @param topN 返回前 N 个商品，如果小于等于 0 则使用配置的默认值
     * @return 按热度降序排列的商品ID列表，如果排行榜中商品数量不足则返回所有可用商品
     */
    public List<Integer> getHotRanking(int topN) {
        // 如果 topN 无效，使用配置的默认排行榜大小
        int size = topN > 0 ? topN : hotnessProperties.getRankingSize();
        
        // 从 ZSet 获取 Top N，按分数降序排列（reverseRange）
        Set<String> productIds = stringRedisTemplate.opsForZSet()
                .reverseRange(KEY_HOT_RANKING, 0, size - 1);
        
        if (productIds == null || productIds.isEmpty()) {
            log.debug("热门排行榜为空");
            return Collections.emptyList();
        }
        
        // 转换为 Integer 列表
        List<Integer> result = new ArrayList<>();
        for (String productIdStr : productIds) {
            try {
                result.add(Integer.parseInt(productIdStr));
            } catch (NumberFormatException e) {
                log.warn("排行榜中商品ID格式错误: {}", productIdStr);
            }
        }
        
        log.debug("获取热门排行榜，请求数量: {}, 实际返回: {}", size, result.size());
        return result;
    }

    /**
     * 同步热度数据到数据库
     * 扫描所有 delta key，批量更新 MySQL 中的 view_count，然后清除已同步的 delta key
     * 
     * Requirements: 3.1, 3.2
     */
    @Transactional
    public void syncToDatabase() {
        log.info("开始同步热度数据到数据库...");
        
        // 扫描所有 delta key
        Set<String> deltaKeys = stringRedisTemplate.keys(KEY_VIEW_DELTA + "*");
        
        if (deltaKeys == null || deltaKeys.isEmpty()) {
            log.info("没有需要同步的热度数据");
            return;
        }
        
        int successCount = 0;
        int failCount = 0;
        List<String> syncedKeys = new ArrayList<>();
        
        for (String deltaKey : deltaKeys) {
            try {
                // 从 delta key 中提取商品ID
                String productIdStr = deltaKey.substring(KEY_VIEW_DELTA.length());
                Integer productId = Integer.parseInt(productIdStr);
                
                // 获取增量值
                String deltaValue = stringRedisTemplate.opsForValue().get(deltaKey);
                if (deltaValue == null || deltaValue.isEmpty()) {
                    continue;
                }
                
                long delta = Long.parseLong(deltaValue);
                if (delta <= 0) {
                    // 无效增量，直接删除
                    syncedKeys.add(deltaKey);
                    continue;
                }
                
                // 更新数据库
                int updated = productMapper.updateViewCountDelta(productId, delta);
                if (updated > 0) {
                    syncedKeys.add(deltaKey);
                    successCount++;
                    log.debug("商品 {} 浏览量增量 {} 已同步到数据库", productId, delta);
                } else {
                    // 商品可能已被删除，也清除 delta key
                    syncedKeys.add(deltaKey);
                    log.warn("商品 {} 不存在，跳过同步", productId);
                }
            } catch (NumberFormatException e) {
                log.error("解析 delta key 失败: {}", deltaKey, e);
                failCount++;
            } catch (Exception e) {
                log.error("同步商品热度数据失败: {}", deltaKey, e);
                failCount++;
            }
        }
        
        // 批量清除已同步的 delta key
        if (!syncedKeys.isEmpty()) {
            stringRedisTemplate.delete(syncedKeys);
            log.info("已清除 {} 个已同步的 delta key", syncedKeys.size());
        }
        
        log.info("热度数据同步完成，成功: {}, 失败: {}", successCount, failCount);
    }

    /**
     * 从数据库加载热度数据到 Redis
     * 在系统启动时调用，初始化 Redis 中的浏览量和排行榜
     * 
     * Requirements: 3.4
     */
    public void loadFromDatabase() {
        log.info("开始从数据库加载热度数据到 Redis...");
        
        try {
            // 查询所有商品的浏览量
            List<ProductMapper.ProductViewCount> viewCounts = productMapper.getAllProductViewCounts();
            
            if (viewCounts == null || viewCounts.isEmpty()) {
                log.info("数据库中没有商品数据");
                return;
            }
            
            int loadedCount = 0;
            
            for (ProductMapper.ProductViewCount vc : viewCounts) {
                Integer productId = vc.getPro_id();
                Long viewCount = vc.getViewCount();
                
                if (productId == null) {
                    continue;
                }
                
                // 设置浏览量到 Redis（仅当 Redis 中不存在时）
                String viewCountKey = getViewCountKey(productId);
                Boolean exists = stringRedisTemplate.hasKey(viewCountKey);
                
                if (exists == null || !exists) {
                    // Redis 中不存在，从数据库加载
                    long count = viewCount != null ? viewCount : 0L;
                    stringRedisTemplate.opsForValue().set(viewCountKey, String.valueOf(count));
                    
                    // 同时更新排行榜
                    if (count > 0) {
                        stringRedisTemplate.opsForZSet().add(KEY_HOT_RANKING, productId.toString(), count);
                    }
                    
                    loadedCount++;
                }
            }
            
            log.info("从数据库加载热度数据完成，加载了 {} 个商品的浏览量", loadedCount);
        } catch (Exception e) {
            log.error("从数据库加载热度数据失败", e);
            throw new RuntimeException("加载热度数据失败", e);
        }
    }

    /**
     * 获取 ProductMapper（用于测试）
     */
    public ProductMapper getProductMapper() {
        return productMapper;
    }
}
