package org.example.campusmarket.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "ai.dashscope")
public class AiConfig {
    /**
     * 阿里通义千问 API Key
     */
    private String apiKey;

    /**
     * 模型名称，默认 qwen-vl-max（支持图片识别）
     */
    private String model = "qwen-vl-max";

    /**
     * 文本生成 API 地址
     */
    private String apiUrl = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

    /**
     * 多模态（VL）API 地址
     */
    private String vlApiUrl = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

    /**
     * 判断是否为VL多模态模型
     */
    public boolean isVLModel() {
        return model != null && model.toLowerCase().contains("-vl");
    }
}
