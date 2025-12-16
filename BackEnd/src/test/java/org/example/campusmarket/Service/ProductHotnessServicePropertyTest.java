package org.example.campusmarket.Service;

import net.jqwik.api.*;
import net.jqwik.api.constraints.IntRange;
import net.jqwik.api.constraints.Positive;
import org.example.campusmarket.Mapper.ProductMapper;
import org.example.campusmarket.config.HotnessProperties;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import redis.embedded.RedisServer;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;

import static org.mockito.Mockito.*;

/**
 * ProductHotnessService 属性测试
 * 使用 jqwik 进行属性测试，验证热度服务的正确性
 */
public class ProductHotnessServicePropertyTest {

    private static RedisServer redisServer;
    private static LettuceConnectionFactory connectionFactory;
    private static StringRedisTemplate stringRedisTemplate;
    private static ProductHotnessService hotnessService;
    private static ProductMapper mockProductMapper;

    @BeforeAll
    static void setUp() throws IOException {
        // 启动嵌入式 Redis
        redisServer = new RedisServer(6370);
        redisServer.start();

        // 配置 Redis 连接
        connectionFactory = new LettuceConnectionFactory("localhost", 6370);
        connectionFactory.afterPropertiesSet();

        stringRedisTemplate = new StringRedisTemplate();
        stringRedisTemplate.setConnectionFactory(connectionFactory);
        stringRedisTemplate.afterPropertiesSet();

        // 创建 Mock ProductMapper
        mockProductMapper = mock(ProductMapper.class);

        HotnessProperties properties = new HotnessProperties();
        hotnessService = new ProductHotnessService(stringRedisTemplate, properties, mockProductMapper);
    }

    @AfterAll
    static void tearDown() throws IOException {
        if (connectionFactory != null) {
            connectionFactory.destroy();
        }
        if (redisServer != null) {
            redisServer.stop();
        }
    }

    /**
     * Property 1: View Count Increment Consistency
     * **Feature: redis-product-hotness, Property 1: View Count Increment Consistency**
     * **Validates: Requirements 1.1, 1.3**
     * 
     * For any product ID and any number of increment operations N,
     * after calling incrementViewCount N times, the view count should equal the initial value plus N.
     */
    @Property(tries = 100)
    void viewCountIncrementConsistency(
            @ForAll @Positive @IntRange(min = 1, max = 10000) Integer productId,
            @ForAll @IntRange(min = 1, max = 50) int incrementCount) {
        
        // 清理测试数据
        String viewCountKey = hotnessService.getViewCountKey(productId);
        String viewDeltaKey = hotnessService.getViewDeltaKey(productId);
        stringRedisTemplate.delete(viewCountKey);
        stringRedisTemplate.delete(viewDeltaKey);
        stringRedisTemplate.opsForZSet().remove(ProductHotnessService.KEY_HOT_RANKING, productId.toString());

        // 获取初始值（应该为 null 或 0）
        String initialValue = stringRedisTemplate.opsForValue().get(viewCountKey);
        long initialCount = initialValue == null ? 0 : Long.parseLong(initialValue);

        // 执行 N 次递增
        Long lastCount = null;
        for (int i = 0; i < incrementCount; i++) {
            lastCount = hotnessService.incrementViewCount(productId);
        }

        // 验证最终计数等于初始值 + N
        assert lastCount != null : "incrementViewCount should return non-null value";
        assert lastCount == initialCount + incrementCount : 
            String.format("Expected count %d but got %d after %d increments", 
                initialCount + incrementCount, lastCount, incrementCount);

        // 验证 Redis 中存储的值也正确
        String storedValue = stringRedisTemplate.opsForValue().get(viewCountKey);
        assert storedValue != null : "View count should be stored in Redis";
        assert Long.parseLong(storedValue) == initialCount + incrementCount :
            "Stored value should match expected count";

        // 清理测试数据
        stringRedisTemplate.delete(viewCountKey);
        stringRedisTemplate.delete(viewDeltaKey);
        stringRedisTemplate.opsForZSet().remove(ProductHotnessService.KEY_HOT_RANKING, productId.toString());
    }

    /**
     * Property 6: View Count Query Correctness
     * **Feature: redis-product-hotness, Property 6: View Count Query Correctness**
     * **Validates: Requirements 4.1**
     * 
     * For any product with a known view count in Redis, 
     * calling getViewCount should return exactly that value.
     */
    @Property(tries = 100)
    void viewCountQueryCorrectness(
            @ForAll @Positive @IntRange(min = 1, max = 10000) Integer productId,
            @ForAll @IntRange(min = 0, max = 100000) long expectedCount) {
        
        String viewCountKey = hotnessService.getViewCountKey(productId);
        
        // 清理并设置已知的浏览量
        stringRedisTemplate.delete(viewCountKey);
        if (expectedCount > 0) {
            stringRedisTemplate.opsForValue().set(viewCountKey, String.valueOf(expectedCount));
        }

        // 查询浏览量
        Long actualCount = hotnessService.getViewCount(productId);

        // 验证返回值正确
        assert actualCount != null : "getViewCount should never return null";
        assert actualCount == expectedCount : 
            String.format("Expected count %d but got %d for product %d", 
                expectedCount, actualCount, productId);

        // 清理测试数据
        stringRedisTemplate.delete(viewCountKey);
    }

    /**
     * 测试不存在的商品返回 0
     */
    @Property(tries = 100)
    void viewCountReturnsZeroForNonExistent(
            @ForAll @Positive @IntRange(min = 100001, max = 200000) Integer productId) {
        
        String viewCountKey = hotnessService.getViewCountKey(productId);
        
        // 确保 key 不存在
        stringRedisTemplate.delete(viewCountKey);

        // 查询浏览量
        Long actualCount = hotnessService.getViewCount(productId);

        // 验证返回 0
        assert actualCount != null : "getViewCount should never return null";
        assert actualCount == 0L : 
            String.format("Expected 0 for non-existent product but got %d", actualCount);
    }

    /**
     * Property 2: Hot Ranking Order Correctness
     * **Feature: redis-product-hotness, Property 2: Hot Ranking Order Correctness**
     * **Validates: Requirements 2.1**
     * 
     * For any set of products with different hotness scores, 
     * the hot ranking list returned by getHotRanking should be sorted in strictly descending order by score.
     */
    @Property(tries = 100)
    void hotRankingOrderCorrectness(
            @ForAll("productScorePairs") java.util.List<int[]> productScorePairs) {
        
        // 清理排行榜
        stringRedisTemplate.delete(ProductHotnessService.KEY_HOT_RANKING);
        
        if (productScorePairs.isEmpty()) {
            // 空排行榜应返回空列表
            java.util.List<Integer> ranking = hotnessService.getHotRanking(10);
            assert ranking != null : "getHotRanking should never return null";
            assert ranking.isEmpty() : "Empty ranking should return empty list";
            return;
        }
        
        // 添加商品到排行榜，使用不同的分数
        java.util.Map<Integer, Double> expectedScores = new java.util.HashMap<>();
        for (int[] pair : productScorePairs) {
            int productId = pair[0];
            double score = pair[1];
            stringRedisTemplate.opsForZSet().add(
                ProductHotnessService.KEY_HOT_RANKING, 
                String.valueOf(productId), 
                score
            );
            expectedScores.put(productId, score);
        }
        
        // 获取排行榜
        java.util.List<Integer> ranking = hotnessService.getHotRanking(productScorePairs.size());
        
        // 验证排行榜按分数降序排列
        assert ranking != null : "getHotRanking should never return null";
        
        Double previousScore = null;
        for (Integer productId : ranking) {
            Double currentScore = expectedScores.get(productId);
            assert currentScore != null : "Ranking should only contain products we added";
            
            if (previousScore != null) {
                assert currentScore <= previousScore : 
                    String.format("Ranking not in descending order: %f should be <= %f", 
                        currentScore, previousScore);
            }
            previousScore = currentScore;
        }
        
        // 清理测试数据
        stringRedisTemplate.delete(ProductHotnessService.KEY_HOT_RANKING);
    }

    /**
     * 生成商品ID和分数对的列表
     * 确保商品ID唯一，分数可以不同
     */
    @Provide
    Arbitrary<java.util.List<int[]>> productScorePairs() {
        return Arbitraries.integers().between(1, 1000)
            .flatMap(size -> {
                int actualSize = Math.min(size, 50); // 限制最大数量
                return Arbitraries.integers().between(1, 100000)
                    .set().ofMinSize(0).ofMaxSize(actualSize)
                    .flatMap(productIds -> {
                        java.util.List<int[]> pairs = new java.util.ArrayList<>();
                        int score = 1000;
                        for (Integer productId : productIds) {
                            // 使用递减的分数确保每个商品分数不同
                            pairs.add(new int[]{productId, score});
                            score += Arbitraries.integers().between(1, 100).sample();
                        }
                        return Arbitraries.just(pairs);
                    });
            });
    }

    /**
     * Property 3: Ranking Score Synchronization
     * **Feature: redis-product-hotness, Property 3: Ranking Score Synchronization**
     * **Validates: Requirements 2.2**
     * 
     * For any product, after incrementing its view count, 
     * the product's score in the hot ranking should increase by the same amount.
     */
    @Property(tries = 100)
    void rankingScoreSynchronization(
            @ForAll @Positive @IntRange(min = 1, max = 10000) Integer productId,
            @ForAll @IntRange(min = 1, max = 20) int incrementCount) {
        
        // 清理测试数据
        String viewCountKey = hotnessService.getViewCountKey(productId);
        String viewDeltaKey = hotnessService.getViewDeltaKey(productId);
        stringRedisTemplate.delete(viewCountKey);
        stringRedisTemplate.delete(viewDeltaKey);
        stringRedisTemplate.opsForZSet().remove(ProductHotnessService.KEY_HOT_RANKING, productId.toString());
        
        // 获取初始排行榜分数（应该为 null）
        Double initialScore = stringRedisTemplate.opsForZSet()
            .score(ProductHotnessService.KEY_HOT_RANKING, productId.toString());
        double startScore = initialScore == null ? 0.0 : initialScore;
        
        // 执行 N 次递增
        for (int i = 0; i < incrementCount; i++) {
            hotnessService.incrementViewCount(productId);
        }
        
        // 获取递增后的排行榜分数
        Double finalScore = stringRedisTemplate.opsForZSet()
            .score(ProductHotnessService.KEY_HOT_RANKING, productId.toString());
        
        // 验证分数增加了正确的数量
        assert finalScore != null : "Product should be in ranking after increment";
        double expectedScore = startScore + incrementCount;
        assert Math.abs(finalScore - expectedScore) < 0.001 : 
            String.format("Expected score %f but got %f after %d increments", 
                expectedScore, finalScore, incrementCount);
        
        // 清理测试数据
        stringRedisTemplate.delete(viewCountKey);
        stringRedisTemplate.delete(viewDeltaKey);
        stringRedisTemplate.opsForZSet().remove(ProductHotnessService.KEY_HOT_RANKING, productId.toString());
    }

    /**
     * Property 4: Database Sync Round Trip
     * **Feature: redis-product-hotness, Property 4: Database Sync Round Trip**
     * **Validates: Requirements 3.1, 3.2**
     * 
     * For any set of view count increments in Redis, after executing syncToDatabase,
     * the MySQL database should contain the accumulated increments, 
     * and the Redis delta keys should be cleared.
     */
    @Property(tries = 100)
    void databaseSyncRoundTrip(
            @ForAll @Positive @IntRange(min = 1, max = 10000) Integer productId,
            @ForAll @IntRange(min = 1, max = 50) int incrementCount) {
        
        // 清理测试数据
        String viewCountKey = hotnessService.getViewCountKey(productId);
        String viewDeltaKey = hotnessService.getViewDeltaKey(productId);
        stringRedisTemplate.delete(viewCountKey);
        stringRedisTemplate.delete(viewDeltaKey);
        stringRedisTemplate.opsForZSet().remove(ProductHotnessService.KEY_HOT_RANKING, productId.toString());
        
        // 重置 mock
        reset(mockProductMapper);
        
        // 记录实际传递给数据库的增量值
        AtomicInteger actualDelta = new AtomicInteger(0);
        when(mockProductMapper.updateViewCountDelta(eq(productId), anyLong()))
            .thenAnswer(invocation -> {
                long delta = invocation.getArgument(1);
                actualDelta.addAndGet((int) delta);
                return 1; // 模拟更新成功
            });
        
        // 执行 N 次递增
        for (int i = 0; i < incrementCount; i++) {
            hotnessService.incrementViewCount(productId);
        }
        
        // 验证 delta key 存在且值正确
        String deltaValue = stringRedisTemplate.opsForValue().get(viewDeltaKey);
        assert deltaValue != null : "Delta key should exist before sync";
        assert Long.parseLong(deltaValue) == incrementCount : 
            String.format("Delta should be %d but was %s", incrementCount, deltaValue);
        
        // 执行同步
        hotnessService.syncToDatabase();
        
        // 验证数据库收到了正确的增量
        assert actualDelta.get() == incrementCount : 
            String.format("Database should receive delta %d but got %d", incrementCount, actualDelta.get());
        
        // 验证 delta key 已被清除
        String deltaAfterSync = stringRedisTemplate.opsForValue().get(viewDeltaKey);
        assert deltaAfterSync == null : "Delta key should be cleared after sync";
        
        // 清理测试数据
        stringRedisTemplate.delete(viewCountKey);
        stringRedisTemplate.opsForZSet().remove(ProductHotnessService.KEY_HOT_RANKING, productId.toString());
    }

    /**
     * Property 5: Database Load Consistency
     * **Feature: redis-product-hotness, Property 5: Database Load Consistency**
     * **Validates: Requirements 3.4**
     * 
     * For any product with view_count in the database, after calling loadFromDatabase,
     * querying Redis should return the same view count value.
     */
    @Property(tries = 100)
    void databaseLoadConsistency(
            @ForAll @Positive @IntRange(min = 1, max = 10000) Integer productId,
            @ForAll @IntRange(min = 0, max = 100000) long dbViewCount) {
        
        // 清理测试数据
        String viewCountKey = hotnessService.getViewCountKey(productId);
        stringRedisTemplate.delete(viewCountKey);
        stringRedisTemplate.opsForZSet().remove(ProductHotnessService.KEY_HOT_RANKING, productId.toString());
        
        // 重置 mock
        reset(mockProductMapper);
        
        // 模拟数据库返回的商品浏览量
        ProductMapper.ProductViewCount viewCount = new ProductMapper.ProductViewCount();
        viewCount.setPro_id(productId);
        viewCount.setViewCount(dbViewCount);
        
        when(mockProductMapper.getAllProductViewCounts())
            .thenReturn(java.util.Collections.singletonList(viewCount));
        
        // 执行加载
        hotnessService.loadFromDatabase();
        
        // 验证 Redis 中的值与数据库一致
        Long redisViewCount = hotnessService.getViewCount(productId);
        assert redisViewCount != null : "Redis should have the view count after load";
        assert redisViewCount == dbViewCount : 
            String.format("Redis view count %d should match database %d", redisViewCount, dbViewCount);
        
        // 如果浏览量大于 0，验证排行榜也被更新
        if (dbViewCount > 0) {
            Double rankingScore = stringRedisTemplate.opsForZSet()
                .score(ProductHotnessService.KEY_HOT_RANKING, productId.toString());
            assert rankingScore != null : "Product should be in ranking after load";
            assert Math.abs(rankingScore - dbViewCount) < 0.001 : 
                String.format("Ranking score %f should match database %d", rankingScore, dbViewCount);
        }
        
        // 清理测试数据
        stringRedisTemplate.delete(viewCountKey);
        stringRedisTemplate.opsForZSet().remove(ProductHotnessService.KEY_HOT_RANKING, productId.toString());
    }
}
