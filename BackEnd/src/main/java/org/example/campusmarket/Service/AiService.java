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
            "other", "其他物品");

    /**
     * 生成商品描述
     */
    /**
     * 生成商品描述
     */
    public AiDto.GenerateDescriptionResponse generateProductDescription(AiDto.GenerateDescriptionRequest request) {
        String apiKey = aiConfig.getApiKey();

        if (apiKey == null || apiKey.isBlank() || apiKey.equals("your-api-key")) {
            log.warn("AI API Key 未配置");
            throw new RuntimeException("AI服务暂不可用：API Key未配置");
        }

        try {
            boolean hasImages = request.getImages() != null && !request.getImages().isEmpty();
            if (hasImages && aiConfig.isVLModel()) {
                return callDashScopeVLApi(request);
            } else {
                return callDashScopeApi(request);
            }
        } catch (RuntimeException e) {
            throw e; // 重新抛出RuntimeException
        } catch (Exception e) {
            log.error("调用AI API失败: {}", e.getMessage());
            throw new RuntimeException("AI服务暂不可用：" + e.getMessage());
        }
    }

    /**
     * 调用通义千问VL多模态API（支持图片）
     */
    /**
     * 调用通义千问VL多模态API（支持图片）
     */
    private AiDto.GenerateDescriptionResponse callDashScopeVLApi(AiDto.GenerateDescriptionRequest request)
            throws Exception {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", aiConfig.getModel());

        Map<String, Object> input = new HashMap<>();
        List<Map<String, Object>> messages = new ArrayList<>();

        // 系统消息
        Map<String, Object> systemMsg = new HashMap<>();
        systemMsg.put("role", "system");
        List<Map<String, String>> systemContent = new ArrayList<>();
        systemContent.add(Map.of("text", buildVLSystemPrompt()));
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
                String.class);

        return parseVLResponse(response.getBody(), request.getCategory() == null || request.getCategory().isBlank());
    }

    /**
     * 解析VL API响应
     */
    private AiDto.GenerateDescriptionResponse parseVLResponse(String responseBody, boolean expectCategory)
            throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode output = root.path("output");
        JsonNode choices = output.path("choices");

        String content = "";
        if (choices.isArray() && choices.size() > 0) {
            JsonNode messageContent = choices.get(0).path("message").path("content");
            if (messageContent.isArray() && messageContent.size() > 0) {
                content = messageContent.get(0).path("text").asText();
            } else if (messageContent.isTextual()) {
                content = messageContent.asText();
            }
        }

        if (content.isEmpty()) {
            // Fallback try simple text
            content = output.path("text").asText();
        }

        if (content == null || content.isEmpty()) {
            throw new RuntimeException("无法解析VL API响应");
        }

        // 解析分类和描述
        String category = null;
        String description = content;

        if (expectCategory) {
            // 尝试解析 CATEGORY: xxx \n DESCRIPTION: xxx 格式
            // 或者仅仅是内容
            if (content.contains("CATEGORY:")) {
                String[] parts = content.split("DESCRIPTION:", 2);
                String catPart = parts[0];
                if (catPart.toUpperCase().contains("CATEGORY:")) {
                    String[] catLines = catPart.split("\n");
                    for (String line : catLines) {
                        if (line.trim().toUpperCase().startsWith("CATEGORY:")) {
                            category = line.substring(line.indexOf(":") + 1).trim().toLowerCase();
                            // 简单的映射检查，确保是有效类别
                            if (category.contains("electronics") || category.contains("数码"))
                                category = "electronics";
                            else if (category.contains("books") || category.contains("书"))
                                category = "books";
                            else if (category.contains("daily") || category.contains("生活"))
                                category = "daily";
                            else
                                category = "other"; // 默认 fallback
                            break;
                        }
                    }
                }

                if (parts.length > 1) {
                    description = parts[1].trim();
                } else {
                    // 如果没有明确的 DESCRIPTION: 标记，则移除 CATEGORY 行后作为描述
                    description = content.replaceFirst("(?i)CATEGORY:.*(\\n|\\r\\n)?", "").trim();
                }
            }
        }

        // 清理描述中的前缀（如果有残留）
        description = description.replaceAll("(?i)^(DESCRIPTION:|描述:|文案:)\\s*", "").trim();

        AiDto.GenerateDescriptionResponse response = new AiDto.GenerateDescriptionResponse(description);
        response.setInferredCategory(category);
        return response;
    }

    /**
     * 构建VL模型系统提示词
     */
    /**
     * 构建VL模型系统提示词
     */
    private String buildVLSystemPrompt() {
        return """
                # 角色设定
                你就是这就物品的**卖家**（一位大学生）。你正在「中易」校园二手交易平台出售闲置物品。
                你**不是**一个描述图片的AI助手，而是**卖家本人**。

                # 核心任务
                1. **识别物品**：仔细观察图片，通过标题（如果有）辅助判断物品的**具体类别**和细节。
                2. **撰写文案**：以卖家第一人称视角，写一段自然真诚的转让描述。
                请仔细观察图片，识别以下信息：
                ## 动漫/游戏角色识别
                观察角色的外貌特征（发色、发型、服装、配饰、武器等），尝试识别：
                - 角色名字（如：可莉、胡桃、雷电将军、初音未来、路飞、鸣人）
                - 出处作品（如：原神、崩坏星穹铁道、明日方舟、Hololive、海贼王、火影忍者）
                - 如果是联动/皮肤款，说明具体版本

                ## 商品信息识别
                - 商品类型：手办、立牌、亚克力立牌、徽章、挂件、抱枕、海报、卡牌等
                - 品牌/厂商：万代、良笑社(GSC)、寿屋、Alter、miHoYo官方等
                - 尺寸估计：根据参照物或常见尺寸推断

                ## 电子产品/书籍识别
                - 品牌、型号、版本
                - 书名、作者、出版社

                # 必须遵守的规则
                1. **语气自然**：使用第一人称，像同学间交流。
                2. **绝对禁止**使用"这张图片展示了..."、"图片中..."、"可以看出..."、"图中..."等以第三人称观察者角度描述图片的措辞。
                3. **绝对禁止**出现对自己或他人身份的描述（如："我是..."、"我叫..."、"我是...的..."等）。
                4. **绝对禁止**出现对商品价格的描述（如："这个商品价格是..."、"这个商品价格是...元"等）。
                5. **结合标题**：如果提供了商品标题，请务必结合标题信息来确认物品型号/书名/角色等，确保准确。
                6. **识别类别**：如果用户未指定分类，你必须根据图片判断它属于以下哪一类：
                   - electronics (数码电子)
                   - books (图书教材)
                   - daily (生活用品)
                   - other (其他物品)
                
                    如果用户**提供了**分类，则直接输出文案。
                    当用户没有提供商品类别时，自动识别商品类别
                    不要在描述中直接出现商品类别
            
                
                # 输出要求
                - 使用第一人称（我、我的）
                - 将识别到的具体信息融入描述开头
                - 语气自然真诚，像同学间对话
                - 80-150字
                - 不要用Markdown，不要有前缀
                """;
    }

    /**
     * 构建VL模型用户提示词
     */
    private String buildVLPrompt(AiDto.GenerateDescriptionRequest request) {
        StringBuilder prompt = new StringBuilder();

        // 任务指令
        prompt.append("【任务】请作为卖家，为这张图片里的物品写一段转让文案。\n");

        boolean missingCategory = request.getCategory() == null || request.getCategory().isBlank();

        // 添加商品基本信息
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            prompt.append("我的商品标题是：\"").append(request.getTitle()).append("\"\n");
            prompt.append("（请结合标题和图片确认物品的具体信息，如型号、书名、角色名等）\n");
        } else {
            prompt.append("（请根据图片自动识别物品信息）\n");
        }

        if (!missingCategory) {
            String categoryName = CATEGORY_MAP.getOrDefault(request.getCategory(), request.getCategory());
            prompt.append("我选择的分类是：").append(categoryName).append("\n");
        } else {
            prompt.append("我没有选择分类，请你帮我判断分类 (electronics/books/daily/other)。\n");
        }

        // 识别辅助和引导
        prompt.append("\n【识别建议】\n");
        prompt.append("1. 先看标题（如有），确认物品名称。\n");
        prompt.append("2. 再看图片，确认成色、外观细节、角色特征。\n");
        prompt.append("3. 如果是动漫周边，务必识别出角色名和作品名。\n");

        prompt.append("\n【最终输出】\n");
        if (missingCategory) {
            prompt.append("请严格按照以下格式输出（不要有其他废话）：\n");
            prompt.append("CATEGORY: [电子/书/日用/其他 的对应英文编码]\n");
            prompt.append("DESCRIPTION: [你的卖家文案]\n");
            prompt.append("注意：DESCRIPTION部分直接写文案，不要有\"这张图片...\"之类的描述。\n");
        } else {
            prompt.append("直接输出卖家的文案，不要有任何前缀。");
            prompt.append("再次提醒：不要描述图片，而是直接卖东西（例如：\"出一双...\"）。开始：");
        }

        return prompt.toString();
    }

    /**
     * 调用阿里通义千问文本API
     */
    private AiDto.GenerateDescriptionResponse callDashScopeApi(AiDto.GenerateDescriptionRequest request)
            throws Exception {
        String prompt = buildPrompt(request);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", aiConfig.getModel());

        Map<String, Object> input = new HashMap<>();
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", buildTextSystemPrompt()));
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
                String.class);

        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode output = root.path("output");
        JsonNode choices = output.path("choices");

        String description = "";
        if (choices.isArray() && choices.size() > 0) {
            description = choices.get(0).path("message").path("content").asText();
        } else {
            description = output.path("text").asText();
        }

        if (description != null && !description.isEmpty()) {
            return new AiDto.GenerateDescriptionResponse(description);
        }

        throw new RuntimeException("无法解析AI响应");
    }

    /**
     * 构建纯文本模型系统提示词
     */
    private String buildTextSystemPrompt() {
        return """
                # 角色设定
                你是一位正在「中易」校园二手交易平台出售闲置物品的大学生。你需要以第一人称视角撰写商品描述，就像你自己在卖东西一样。

                # 写作风格
                - 使用第一人称（我、我的）
                - 语气真诚自然，像在跟同学介绍自己的东西
                - 可以简单提及购买/使用背景，让描述更有温度
                - 适当使用1-2个emoji，但不要过多

                # 内容要求
                - 简要描述商品状态
                - 强调商品的实用价值
                - 可以提及转让原因（毕业、升级等）
                - 字数控制在80-150字

                # 禁止事项
                - 不要编造具体参数
                - 不要使用夸张营销词汇
                - 不要提及价格
                - 不要使用Markdown格式
                - 不要有任何前缀，直接输出描述正文
                """;
    }

    /**
     * 构建纯文本模型用户提示词
     */
    private String buildPrompt(AiDto.GenerateDescriptionRequest request) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("请以卖家第一人称视角，为以下商品写一段转让描述：\n\n");

        // 商品信息
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            prompt.append("商品：").append(request.getTitle()).append("\n");
        }
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            String categoryName = CATEGORY_MAP.getOrDefault(request.getCategory(), request.getCategory());
            prompt.append("分类：").append(categoryName).append("\n");
        }

        // 分类特定引导
        prompt.append("\n描述建议：\n");
        String category = request.getCategory() != null ? request.getCategory() : "";
        switch (category) {
            case "electronics":
                prompt.append("- 说说这个设备的使用情况和成色\n");
                prompt.append("- 功能是否正常\n");
                prompt.append("- 为什么转让\n");
                break;
            case "books":
                prompt.append("- 书的品相如何（有无笔记）\n");
                prompt.append("- 适合什么课程或考试\n");
                prompt.append("- 自己的使用感受\n");
                break;
            case "daily":
                prompt.append("- 物品的使用状态\n");
                prompt.append("- 有什么实用价值\n");
                prompt.append("- 为什么闲置了\n");
                break;
            default:
                prompt.append("- 物品的状态和用途\n");
                prompt.append("- 为什么想转让\n");
        }

        prompt.append("\n直接输出描述正文，不要有任何前缀。");

        return prompt.toString();
    }

}
