package org.example.campusmarket.Controller;

import org.example.campusmarket.Service.ImageService;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.exception.ImageValidationException;
import org.example.campusmarket.exception.ImageUploadException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

/**
 * 文件上传控制器
 * 处理用户头像和商品图片的上传请求
 * 该控制器提供以下功能：
 *单文件上传（用户头像）
 *多文件上传（商品图片，最多9张）
 *统一的异常处理和友好的错误消息
 */
@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    private static final Logger log = LoggerFactory.getLogger(FileUploadController.class);

    // 商品图片最大数量限制为9

    private static final int MAX_PRODUCT_IMAGES = 9;
    private final ImageService imageService;

    public FileUploadController(ImageService imageService) {
        this.imageService = imageService;
    }

    /**
     * 上传用户头像
     * <p>该端点接收单个图片文件，验证后上传到OSS的avatars目录。
     * @param file 头像图片文件，必须是JPG、JPEG、PNG或GIF格式，大小不超过5MB
     * @return Result对象，包含上传成功的图片URL或错误消息
     */
    @PostMapping("/avatar")
    public Result uploadAvatar(@RequestParam("file") MultipartFile file) {
        log.info("收到头像上传请求 - filename: {}, size: {}", 
                 file.getOriginalFilename(), file.getSize());

        try {
            String imageUrl = imageService.uploadImage(file, "avatars");
            log.info("头像上传成功 - url: {}", imageUrl);
            return new Result(200, "头像上传成功", imageUrl);

        } catch (ImageValidationException e) {
            log.warn("头像验证失败 - error: {}", e.getMessage());
            return new Result(400, e.getMessage(), null);

        } catch (ImageUploadException e) {
            log.error("头像上传失败 - error: {}", e.getMessage(), e);
            return new Result(500, "头像上传失败，请稍后重试", null);

        } catch (Exception e) {
            log.error("头像上传发生未知错误", e);
            return new Result(500, "系统错误，请稍后重试", null);
        }
    }

    /**
     * 上传商品图片（支持多文件）
     * <p>该端点接收多个图片文件（最多9张），验证后上传到OSS的products目录。
     * 所有图片必须是JPG、JPEG、PNG或GIF格式，每张大小不超过5MB。
     * @param files 商品图片文件数组，最多9张
     * @return Result对象，包含上传成功的图片URL列表或错误消息
     */
    @PostMapping("/product")
    public Result uploadProductImages(@RequestParam("files") MultipartFile[] files) {
        log.info("收到商品图片上传请求 - count: {}", files.length);

        try {
            // 验证图片数量
            if (files == null || files.length == 0) {
                return new Result(400, "请至少上传一张商品图片", null);
            }

            if (files.length > MAX_PRODUCT_IMAGES) {
                return new Result(400, 
                    String.format("商品图片最多上传%d张，当前上传了%d张", MAX_PRODUCT_IMAGES, files.length), 
                    null);
            }

            // 批量上传图片
            List<String> imageUrls = new ArrayList<>();
            for (int i = 0; i < files.length; i++) {
                MultipartFile file = files[i];
                log.debug("上传第{}张商品图片 - filename: {}, size: {}", 
                         i + 1, file.getOriginalFilename(), file.getSize());

                try {
                    String imageUrl = imageService.uploadImage(file, "products");
                    imageUrls.add(imageUrl);
                    log.debug("第{}张商品图片上传成功 - url: {}", i + 1, imageUrl);

                } catch (ImageValidationException e) {
                    log.warn("第{}张商品图片验证失败 - error: {}", i + 1, e.getMessage());
                    // 如果已经上传了部分图片，需要清理
                    if (!imageUrls.isEmpty()) {
                        log.info("清理已上传的{}张图片", imageUrls.size());
                        imageService.deleteImages(imageUrls);
                    }
                    return new Result(400, 
                        String.format("第%d张图片验证失败：%s", i + 1, e.getMessage()), 
                        null);

                } catch (ImageUploadException e) {
                    log.error("第{}张商品图片上传失败 - error: {}", i + 1, e.getMessage(), e);
                    // 清理已上传的图片
                    if (!imageUrls.isEmpty()) {
                        log.info("清理已上传的{}张图片", imageUrls.size());
                        imageService.deleteImages(imageUrls);
                    }
                    return new Result(500, 
                        String.format("第%d张图片上传失败，请稍后重试", i + 1), 
                        null);
                }
            }

            log.info("商品图片批量上传成功 - count: {}", imageUrls.size());
            return new Result(200, "商品图片上传成功", imageUrls);

        } catch (Exception e) {
            log.error("商品图片上传发生未知错误", e);
            return new Result(500, "系统错误，请稍后重试", null);
        }
    }
}
