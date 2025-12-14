package org.example.campusmarket.config;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PreDestroy;

/**
 * 阿里云OSS配置类
 * 负责初始化OSS客户端并管理其生命周期
 */
@Configuration
@EnableConfigurationProperties(OssProperties.class)
public class OssConfig {

    private static final Logger log = LoggerFactory.getLogger(OssConfig.class);

    private OSS ossClient;

    /**
     * 创建并配置OSS客户端Bean
     * 
     * @param properties OSS配置属性
     * @return 配置好的OSS客户端实例
     */
    @Bean
    public OSS ossClient(OssProperties properties) {
        try {
            // 创建OSS客户端
            this.ossClient = new OSSClientBuilder().build(
                properties.getEndpoint(),
                properties.getAccessKeyId(),
                properties.getAccessKeySecret()
            );

            log.info("OSS客户端初始化成功 - endpoint: {}, bucket: {}", 
                     properties.getEndpoint(), properties.getBucketName());

            return this.ossClient;

        } catch (Exception e) {
            log.error("OSS客户端初始化失败 - endpoint: {}, bucket: {}, error: {}", 
                      properties.getEndpoint(), properties.getBucketName(), e.getMessage(), e);
            throw new IllegalStateException("无法初始化OSS客户端", e);
        }
    }

    /**
     * 应用关闭时优雅地关闭OSS客户端
     * 释放连接池资源
     */
    @PreDestroy
    public void shutdown() {
        if (ossClient != null) {
            try {
                ossClient.shutdown();
                log.info("OSS客户端已优雅关闭");
            } catch (Exception e) {
                log.error("关闭OSS客户端时发生错误", e);
            }
        }
    }
}
