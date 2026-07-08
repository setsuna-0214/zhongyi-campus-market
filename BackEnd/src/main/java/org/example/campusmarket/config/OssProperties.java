package org.example.campusmarket.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 阿里云OSS配置属性类
 * 用于绑定application.properties中的aliyun.oss配置项
 * <p>注：取消 @NotBlank / @Validated 强制校验，允许配置为空。
 * 当 endpoint/accessKeyId/accessKeySecret/bucketName 任一为空时，
 * 后端不再装配 OSS 客户端 Bean，应用照常启动；图片上传相关接口会在调用时
 * 返回中文提示"图片上传服务未配置"，详见 OssConfig 与 ImageService。
 */
@ConfigurationProperties(prefix = "aliyun.oss")
public class OssProperties {

    /** OSS服务端点，如oss-cn-hangzhou.aliyuncs.com；为空表示未配置 */
    private String endpoint;

    /** 阿里云AccessKeyId；为空表示未配置 */
    private String accessKeyId;

    /** 阿里云AccessKeySecret；为空表示未配置 */
    private String accessKeySecret;

    /** OSS存储桶名称；为空表示未配置 */
    private String bucketName;

    /** CDN加速域名（可选） */
    private String cdnDomain;

    /**
     * 判断 OSS 是否已配置可用（4 个必填项都不为空字符串）。
     */
    public boolean isConfigured() {
        return isNotBlank(endpoint)
                && isNotBlank(accessKeyId)
                && isNotBlank(accessKeySecret)
                && isNotBlank(bucketName);
    }

    private static boolean isNotBlank(String s) {
        return s != null && !s.isBlank();
    }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getAccessKeyId() { return accessKeyId; }
    public void setAccessKeyId(String accessKeyId) { this.accessKeyId = accessKeyId; }

    public String getAccessKeySecret() { return accessKeySecret; }
    public void setAccessKeySecret(String accessKeySecret) { this.accessKeySecret = accessKeySecret; }

    public String getBucketName() { return bucketName; }
    public void setBucketName(String bucketName) { this.bucketName = bucketName; }

    public String getCdnDomain() { return cdnDomain; }
    public void setCdnDomain(String cdnDomain) { this.cdnDomain = cdnDomain; }
}