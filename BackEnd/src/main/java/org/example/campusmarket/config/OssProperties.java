package org.example.campusmarket.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.NotBlank;

/**
 * 阿里云OSS配置属性类
 * 用于绑定application.properties中的aliyun.oss配置项
 */
@Validated
@ConfigurationProperties(prefix = "aliyun.oss")
public class OssProperties {

    /**
     * OSS服务端点，如oss-cn-hangzhou.aliyuncs.com
     */
    @NotBlank(message = "OSS Endpoint不能为空")
    private String endpoint;

    /**
     * 阿里云AccessKeyId
     */
    @NotBlank(message = "OSS AccessKeyId不能为空")
    private String accessKeyId;

    /**
     * 阿里云AccessKeySecret
     */
    @NotBlank(message = "OSS AccessKeySecret不能为空")
    private String accessKeySecret;

    /**
     * OSS存储桶名称
     */
    @NotBlank(message = "OSS Bucket名称不能为空")
    private String bucketName;

    /**
     * CDN加速域名（可选）
     */
    private String cdnDomain;

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getAccessKeyId() {
        return accessKeyId;
    }

    public void setAccessKeyId(String accessKeyId) {
        this.accessKeyId = accessKeyId;
    }

    public String getAccessKeySecret() {
        return accessKeySecret;
    }

    public void setAccessKeySecret(String accessKeySecret) {
        this.accessKeySecret = accessKeySecret;
    }

    public String getBucketName() {
        return bucketName;
    }

    public void setBucketName(String bucketName) {
        this.bucketName = bucketName;
    }

    public String getCdnDomain() {
        return cdnDomain;
    }

    public void setCdnDomain(String cdnDomain) {
        this.cdnDomain = cdnDomain;
    }
}
