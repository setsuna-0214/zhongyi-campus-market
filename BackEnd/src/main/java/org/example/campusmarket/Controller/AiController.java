package org.example.campusmarket.Controller;

import org.example.campusmarket.DTO.AiDto;
import org.example.campusmarket.Service.AiService;
import org.example.campusmarket.entity.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai")
public class AiController {

    private static final Logger log = LoggerFactory.getLogger(AiController.class);

    @Autowired
    private AiService aiService;

    /**
     * AI生成商品描述
     * POST /ai/generate-description
     */
    @PostMapping("/generate-description")
    public Result generateDescription(@RequestBody AiDto.GenerateDescriptionRequest request) {
        try {
            log.info("收到AI生成描述请求 - title: {}, category: {}", 
                     request.getTitle(), request.getCategory());

            String description = aiService.generateProductDescription(request);

            AiDto.GenerateDescriptionResponse response = new AiDto.GenerateDescriptionResponse(description);
            return new Result(200, "生成成功", response);

        } catch (Exception e) {
            log.error("AI生成描述失败: {}", e.getMessage(), e);
            return new Result(500, "生成失败: " + e.getMessage(), null);
        }
    }
}
