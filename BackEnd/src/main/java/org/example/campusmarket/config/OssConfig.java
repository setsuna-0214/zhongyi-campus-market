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
     * <p>当 OssProperties 的 endpoint/accessKeyId/accessKeySecret/bucketName 任一为空时，
     * 不创建 OSS 客户端而是返回 null，使应用在没有对象存储配置时也能正常启动。
     * 图片上传相关接口会在调用时给出中文提示，详见 ImageService。
     *
     * @param properties OSS配置属性
     * @return 配置好的OSS客户端实例；未配置时返回 null
     */
    @Bean
    public OSS ossClient(OssProperties properties) {
        if (!properties.isConfigured()) {
            log.warn("OSS 配置不完整（endpoint/accessKeyId/accessKeySecret/bucketName 至少一项为空），"
                    + "已跳过 OSS 客户端初始化，图片上传功能将不可用。配置完成后重启即可启用。");
            return null;
        }
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
            // 初始化失败也降级为 null，避免阻断应用启动
            return null;
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
