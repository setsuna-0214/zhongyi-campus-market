package org.example.campusmarket.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.campusmarket.DTO.AiDto;
import org.example.campusmarket.config.AiConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    @Autowired
    private AiConfig aiConfig;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Map<String, String> CATEGORY_MAP = Map.of(
            "electronics", "数码电子",
            "books", "图书教材",
            "daily", "生活用品",
            "other", "其他物品"
    );

    /**
     * 生成商品描述
     */
    public String generateProductDescription(AiDto.GenerateDescriptionRequest request) {
        String apiKey = aiConfig.getApiKey();

        if (apiKey == null || apiKey.isBlank() || apiKey.equals("your-api-key")) {
            log.warn("AI API Key 未配置，使用模板生成描述");
            return generateTemplateDescription(request);
        }

        try {
            boolean hasImages = request.getImages() != null && !request.getImages().isEmpty();
            if (hasImages && aiConfig.isVLModel()) {
                return callDashScopeVLApi(request);
            } else {
                return callDashScopeApi(request);
            }
        } catch (Exception e) {
            log.error("调用通义千问API失败，使用模板生成: {}", e.getMessage());
            return generateTemplateDescription(request);
        }
    }


    /**
     * 调用通义千问VL多模态API（支持图片）
     */
    private String callDashScopeVLApi(AiDto.GenerateDescriptionRequest request) throws Exception {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", aiConfig.getModel());

        Map<String, Object> input = new HashMap<>();
        List<Map<String, Object>> messages = new ArrayList<>();

        // 系统消息
        Map<String, Object> systemMsg = new HashMap<>();
        systemMsg.put("role", "system");
        List<Map<String, String>> systemContent = new ArrayList<>();
        systemContent.add(Map.of("text", "你是一个校园二手交易平台的商品描述生成助手。请根据用户提供的商品图片和信息，生成吸引人的商品描述。描述应该简洁、真实、有吸引力，适合大学生群体。但是描述应当更贴近现实生活的二手物品买卖。"));
        systemMsg.put("content", systemContent);
        messages.add(systemMsg);

        // 用户消息（包含图片和文字）
        Map<String, Object> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        List<Map<String, String>> userContent = new ArrayList<>();

        // 添加图片（只处理URL类型，base64暂不支持）
        for (AiDto.ImageData img : request.getImages()) {
            if (img.getData() != null && !img.getData().isBlank()) {
                if ("url".equals(img.getType())) {
                    // 直接使用图片URL
                    userContent.add(Map.of("image", img.getData()));
                    log.info("添加图片URL: {}", img.getData());
                } else if ("base64".equals(img.getType())) {
                    // base64图片：提取正确的MIME类型
                    String base64Data = img.getData();
                    String mimeType = "image/jpeg"; // 默认
                    
                    if (base64Data.startsWith("data:")) {
                        // 格式: data:image/png;base64,xxxxx
                        int mimeEnd = base64Data.indexOf(";");
                        if (mimeEnd > 5) {
                            mimeType = base64Data.substring(5, mimeEnd);
                        }
                        int dataStart = base64Data.indexOf(",");
                        if (dataStart > 0) {
                            base64Data = base64Data.substring(dataStart + 1);
                        }
                    }
                    
                    String imageDataUrl = "data:" + mimeType + ";base64," + base64Data;
                    userContent.add(Map.of("image", imageDataUrl));
                    log.info("添加base64图片，MIME类型: {}", mimeType);
                }
            }
        }

        // 添加文字提示
        userContent.add(Map.of("text", buildVLPrompt(request)));
        userMsg.put("content", userContent);
        messages.add(userMsg);

        input.put("messages", messages);
        requestBody.put("input", input);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + aiConfig.getApiKey());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                aiConfig.getVlApiUrl(),
                HttpMethod.POST,
                entity,
                String.class
        );

        return parseVLResponse(response.getBody());
    }

    /**
     * 解析VL API响应
     */
    private String parseVLResponse(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode output = root.path("output");
        JsonNode choices = output.path("choices");

        if (choices.isArray() && choices.size() > 0) {
            JsonNode content = choices.get(0).path("message").path("content");
            if (content.isArray() && content.size() > 0) {
                return content.get(0).path("text").asText();
            }
            if (content.isTextual()) {
                return content.asText();
            }
        }
        throw new RuntimeException("无法解析VL API响应");
    }

    /**
     * 构建VL模型提示词
     */
    private String buildVLPrompt(AiDto.GenerateDescriptionRequest request) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("请根据上面的商品图片，为这个二手商品生成一段简洁真实的描述。\n\n");

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            prompt.append("商品名称：").append(request.getTitle()).append("\n");
        }
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            String categoryName = CATEGORY_MAP.getOrDefault(request.getCategory(), request.getCategory());
            prompt.append("商品分类：").append(categoryName).append("\n");
        }

        prompt.append("\n要求：\n");
        prompt.append("1. 描述长度在100-200字左右\n");
        prompt.append("2. 根据图片描述商品的实际外观和成色\n");
        prompt.append("3. 语气真实，聚焦于描述商品\n");
        prompt.append("4. 可以适当使用emoji表情\n");

        return prompt.toString();
    }


    /**
     * 调用阿里通义千问文本API
     */
    private String callDashScopeApi(AiDto.GenerateDescriptionRequest request) throws Exception {
        String prompt = buildPrompt(request);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", aiConfig.getModel());

        Map<String, Object> input = new HashMap<>();
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", "你是一个校园二手交易平台的商品描述生成助手。请根据用户提供的商品信息，生成吸引人的商品描述。描述应该简洁、真实、有吸引力，适合大学生群体。"));
        messages.add(Map.of("role", "user", "content", prompt));
        input.put("messages", messages);
        requestBody.put("input", input);

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("result_format", "message");
        requestBody.put("parameters", parameters);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + aiConfig.getApiKey());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                aiConfig.getApiUrl(),
                HttpMethod.POST,
                entity,
                String.class
        );

        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode output = root.path("output");
        JsonNode choices = output.path("choices");

        if (choices.isArray() && choices.size() > 0) {
            return choices.get(0).path("message").path("content").asText();
        }

        String text = output.path("text").asText();
        if (text != null && !text.isEmpty()) {
            return text;
        }

        throw new RuntimeException("无法解析AI响应");
    }

    /**
     * 构建提示词
     */
    private String buildPrompt(AiDto.GenerateDescriptionRequest request) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("请为以下二手商品生成一段吸引人的描述：\n\n");

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            prompt.append("商品名称：").append(request.getTitle()).append("\n");
        }
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            String categoryName = CATEGORY_MAP.getOrDefault(request.getCategory(), request.getCategory());
            prompt.append("商品分类：").append(categoryName).append("\n");
        }
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            prompt.append("已上传图片数量：").append(request.getImages().size()).append("张\n");
        }

        prompt.append("\n要求：\n");
        prompt.append("1. 描述长度在100-200字左右\n");
        prompt.append("2. 语气友好、真诚，适合大学生群体\n");
        prompt.append("3. 突出商品的优点和性价比\n");
        prompt.append("4. 可以适当使用emoji表情\n");
        prompt.append("5. 结尾可以加上欢迎咨询的话语\n");

        return prompt.toString();
    }


    /**
     * 模板生成描述（API不可用时的备选方案）
     */
    private String generateTemplateDescription(AiDto.GenerateDescriptionRequest request) {
        String title = request.getTitle();
        String category = request.getCategory();
        int imageCount = request.getImages() != null ? request.getImages().size() : 0;

        String categoryName = CATEGORY_MAP.getOrDefault(category, "物品");

        StringBuilder desc = new StringBuilder();
        desc.append("【").append(title != null && !title.isBlank() ? title : categoryName).append("】\n\n");

        switch (category != null ? category : "") {
            case "electronics":
                desc.append("📱 这是一款性能优良的电子设备，功能完好，无任何故障。购买后一直小心使用，外观保持良好。配件齐全，价格实惠。\n\n");
                break;
            case "books":
                desc.append("📚 正版书籍，内页干净整洁，无笔记无划线，品相良好。适合学习参考或收藏。因课程结束不再需要，现转让给有需要的同学。\n\n");
                break;
            case "daily":
                desc.append("🏠 物品保存完好，功能正常，使用方便。因毕业/搬家等原因闲置转让，价格实惠。\n\n");
                break;
            default:
                desc.append("✨ 这是一件品质优良的商品，成色较新，功能完好。现因个人原因低价转让，诚心出售，价格可小刀。\n\n");
        }

        if (imageCount > 0) {
            desc.append("📷 已上传 ").append(imageCount).append(" 张实物图片，所见即所得。\n\n");
        }

        desc.append("欢迎感兴趣的同学联系咨询，支持当面验货交易！");

        return desc.toString();
    }
}
