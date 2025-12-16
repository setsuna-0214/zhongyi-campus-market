package org.example.campusmarket.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis 配置类
 * 配置 RedisTemplate 和 StringRedisTemplate，设置序列化方式
 */
@Configuration
public class RedisConfig {

    private static final Logger log = LoggerFactory.getLogger(RedisConfig.class);

    /**
     * 配置 RedisTemplate
     * 使用 String 序列化 key，JSON 序列化 value
     *
     * @param connectionFactory Redis 连接工厂
     * @return 配置好的 RedisTemplate 实例
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // 设置 key 的序列化方式为 String
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);

        // 设置 value 的序列化方式为 JSON
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer();
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();

        log.info("RedisTemplate 初始化成功");
        return template;
    }

    /**
     * 配置 StringRedisTemplate
     * 用于热度计数等纯字符串操作场景
     *
     * @param connectionFactory Redis 连接工厂
     * @return 配置好的 StringRedisTemplate 实例
     */
    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        StringRedisTemplate template = new StringRedisTemplate();
        template.setConnectionFactory(connectionFactory);

        log.info("StringRedisTemplate 初始化成功");
        return template;
    }
}
