package org.example.campusmarket.Service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.CannedAccessControlList;
import com.aliyun.oss.model.ObjectMetadata;
import com.aliyun.oss.model.PutObjectRequest;
import org.example.campusmarket.config.OssProperties;
import org.example.campusmarket.exception.ImageUploadException;
import org.example.campusmarket.exception.ImageValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * 图片服务
 * 提供图片上传、删除的核心业务逻辑
 * 
 * <p>该服务负责：
 * <ul>
 *   <li>验证文件格式（JPG、JPEG、PNG、GIF）</li>
 *   <li>验证文件大小（不超过5MB）</li>
 *   <li>验证文件MIME类型和内容（魔数检测）</li>
 *   <li>生成唯一的文件名，防止路径遍历攻击</li>
 *   <li>上传文件到阿里云OSS</li>
 *   <li>删除OSS中的图片文件</li>
 * </ul>
 * 
 * @author Campus Market Team
 * @version 1.0
 */
@Service
public class ImageService {

    private static final Logger log = LoggerFactory.getLogger(ImageService.class);

    /**
     * 允许的图片MIME类型
     */
    private static final Set<String> ALLOWED_MIME_TYPES = new HashSet<>(Arrays.asList(
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif"
    ));

    /**
     * 允许的文件扩展名
     */
    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>(Arrays.asList(
        ".jpg",
        ".jpeg",
        ".png",
        ".gif"
    ));


    /**
     * 最大文件大小：5MB
     */
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    private final OSS ossClient;
    private final OssProperties ossProperties;

    public ImageService(OSS ossClient, OssProperties ossProperties) {
        this.ossClient = ossClient;
        this.ossProperties = ossProperties;
    }

    // ==================== 公共方法 ====================

    /**
     * 上传图片到阿里云OSS
     * 
     * <p>该方法会执行以下操作：
     * <ul>
     *   <li>验证文件格式（JPG、JPEG、PNG、GIF）</li>
     *   <li>验证文件大小（不超过5MB）</li>
     *   <li>验证文件MIME类型和内容</li>
     *   <li>生成唯一的文件名</li>
     *   <li>上传文件到指定目录</li>
     *   <li>返回可访问的完整URL</li>
     * </ul>
     * 
     * @param file 要上传的文件，不能为空
     * @param directory 存储目录（如 "avatars" 或 "products"），不能为空
     * @return 图片的完整访问URL（HTTP/HTTPS地址）
     * @throws ImageValidationException 当文件验证失败时（文件为空、格式不支持、大小超限等）
     * @throws ImageUploadException 当OSS上传操作失败时
     */
    public String uploadImage(MultipartFile file, String directory) {
        long startTime = System.currentTimeMillis();
        String originalFilename = file.getOriginalFilename();
        long fileSize = file.getSize();

        try {
            // 1. 验证文件
            validateFile(file);
            log.debug("文件验证通过 - file: {}, size: {}", originalFilename, fileSize);

            // 2. 生成唯一文件名
            String fileName = generateUniqueFileName(originalFilename);
            String objectKey = directory + "/" + fileName;
            log.debug("生成对象键 - objectKey: {}", objectKey);

            // 3. 准备上传元数据
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(fileSize);
            metadata.setContentType(file.getContentType());

            // 4. 上传到OSS
            try (InputStream inputStream = file.getInputStream()) {
                PutObjectRequest putObjectRequest = new PutObjectRequest(
                    ossProperties.getBucketName(),
                    objectKey,
                    inputStream,
                    metadata
                );

                ossClient.putObject(putObjectRequest);
                
                // 设置公共读权限
                ossClient.setObjectAcl(ossProperties.getBucketName(), objectKey, CannedAccessControlList.PublicRead);
            }

            // 5. 构建并返回完整URL
            String imageUrl = buildImageUrl(objectKey);

            long duration = System.currentTimeMillis() - startTime;
            log.info("图片上传成功 - file: {}, size: {}, duration: {}ms, url: {}",
                     originalFilename, fileSize, duration, imageUrl);

            return imageUrl;

        } catch (ImageValidationException e) {
            log.warn("图片验证失败 - file: {}, error: {}", originalFilename, e.getMessage());
            throw e;
        } catch (IOException e) {
            log.error("图片上传失败（IO错误） - file: {}, size: {}, error: {}",
                      originalFilename, fileSize, e.getMessage(), e);
            throw new ImageUploadException("图片上传失败：文件读取错误", e);
        } catch (Exception e) {
            log.error("图片上传失败 - file: {}, size: {}, error: {}",
                      originalFilename, fileSize, e.getMessage(), e);
            throw new ImageUploadException("图片上传失败", e);
        }
    }


    /**
     * 从阿里云OSS删除单个图片
     * 
     * <p>该方法会从图片URL中提取对象键（objectKey），然后从OSS中删除对应的文件。
     * 如果文件不存在或删除失败，方法会记录日志但不会抛出异常，以避免影响主流程。
     * 
     * @param imageUrl 图片的完整URL或相对路径
     */
    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            log.debug("图片URL为空，跳过删除操作");
            return;
        }

        try {
            String objectKey = extractObjectKeyFromUrl(imageUrl);

            if (objectKey == null || objectKey.isEmpty()) {
                log.warn("无法从URL提取对象键 - url: {}", imageUrl);
                return;
            }

            ossClient.deleteObject(ossProperties.getBucketName(), objectKey);
            log.info("图片删除成功 - objectKey: {}", objectKey);

        } catch (Exception e) {
            log.warn("图片删除失败 - url: {}, error: {}", imageUrl, e.getMessage());
        }
    }

    /**
     * 从阿里云OSS批量删除多个图片
     * 
     * <p>该方法会遍历URL列表，逐个删除对应的图片文件。
     * 对于每个删除操作，如果失败会记录日志但继续处理后续文件。
     * 
     * @param imageUrls 图片URL列表，可以为空或null
     */
    public void deleteImages(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            log.debug("图片URL列表为空，跳过批量删除操作");
            return;
        }

        log.info("开始批量删除图片 - count: {}", imageUrls.size());
        int successCount = 0;
        int failCount = 0;

        for (String imageUrl : imageUrls) {
            try {
                deleteImage(imageUrl);
                successCount++;
            } catch (Exception e) {
                failCount++;
                log.warn("批量删除中的单个图片删除失败 - url: {}, error: {}", imageUrl, e.getMessage());
            }
        }

        log.info("批量删除完成 - total: {}, success: {}, fail: {}",
                 imageUrls.size(), successCount, failCount);
    }

    // ==================== 私有方法 ====================

    /**
     * 验证上传的文件
     */
    private void validateFile(MultipartFile file) {
        // 1. 验证文件是否为空
        if (file == null || file.isEmpty()) {
            throw new ImageValidationException("文件不能为空");
        }

        // 2. 验证文件大小
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ImageValidationException(
                String.format("文件大小不能超过5MB，当前文件大小：%.2fMB", file.getSize() / (1024.0 * 1024.0))
            );
        }

        // 3. 验证文件扩展名
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new ImageValidationException("文件名不能为空");
        }

        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ImageValidationException(
                String.format("不支持的文件格式：%s，仅支持 JPG、JPEG、PNG、GIF", extension)
            );
        }

        // 4. 验证MIME类型
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new ImageValidationException(
                String.format("不支持的文件类型：%s，仅支持图片格式", contentType)
            );
        }

        // 5. 验证文件内容（魔数检测）
        try {
            validateFileContent(file);
        } catch (IOException e) {
            throw new ImageValidationException("文件读取失败，无法验证文件内容", e);
        }
    }


    /**
     * 验证文件内容（魔数检测）
     */
    private void validateFileContent(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream()) {
            byte[] header = new byte[12];
            int bytesRead = inputStream.read(header);

            if (bytesRead < 2) {
                throw new ImageValidationException("文件内容不完整，无法验证");
            }

            if (!isValidImageHeader(header)) {
                throw new ImageValidationException("文件内容与格式不匹配，可能不是有效的图片文件");
            }
        }
    }

    /**
     * 检查文件头部字节是否为有效的图片格式
     */
    private boolean isValidImageHeader(byte[] header) {
        if (header == null || header.length < 2) {
            return false;
        }

        // JPEG: FF D8 FF
        if (header[0] == (byte) 0xFF && header[1] == (byte) 0xD8 && header[2] == (byte) 0xFF) {
            return true;
        }

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (header.length >= 8 &&
            header[0] == (byte) 0x89 && header[1] == (byte) 0x50 &&
            header[2] == (byte) 0x4E && header[3] == (byte) 0x47 &&
            header[4] == (byte) 0x0D && header[5] == (byte) 0x0A &&
            header[6] == (byte) 0x1A && header[7] == (byte) 0x0A) {
            return true;
        }

        // GIF: 47 49 46 38 (GIF8)
        if (header.length >= 4 &&
            header[0] == (byte) 0x47 && header[1] == (byte) 0x49 &&
            header[2] == (byte) 0x46 && header[3] == (byte) 0x38) {
            return true;
        }

        return false;
    }

    /**
     * 提取文件扩展名
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }

        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < filename.length() - 1) {
            return filename.substring(lastDotIndex);
        }

        return "";
    }

    /**
     * 生成唯一的文件名
     * 使用UUID + 时间戳确保唯一性，防止文件覆盖和路径遍历攻击
     */
    private String generateUniqueFileName(String originalFilename) {
        String extension = getFileExtension(originalFilename);

        // 清理扩展名中的路径遍历字符
        if (extension.contains("/") || extension.contains("\\") || extension.contains("..")) {
            log.warn("检测到不安全的文件扩展名：{}，使用默认扩展名", extension);
            extension = ".jpg";
        }

        String uuid = UUID.randomUUID().toString().replace("-", "");
        long timestamp = System.currentTimeMillis();

        return uuid + "_" + timestamp + extension;
    }

    /**
     * 构建图片的完整访问URL
     */
    private String buildImageUrl(String objectKey) {
        String cdnDomain = ossProperties.getCdnDomain();

        if (cdnDomain != null && !cdnDomain.isEmpty()) {
            String url = cdnDomain;
            if (!url.endsWith("/")) {
                url += "/";
            }
            return url + objectKey;
        } else {
            // 阿里云OSS URL格式: https://bucket-name.endpoint/object-key
            String endpoint = ossProperties.getEndpoint();
            // 移除endpoint中的协议前缀（如果有）
            if (endpoint.startsWith("https://")) {
                endpoint = endpoint.substring(8);
            } else if (endpoint.startsWith("http://")) {
                endpoint = endpoint.substring(7);
            }
            return "https://" + ossProperties.getBucketName() + "." + endpoint + "/" + objectKey;
        }
    }

    /**
     * 从图片URL中提取对象键（objectKey）
     */
    private String extractObjectKeyFromUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return null;
        }

        // 如果是相对路径，直接返回
        if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
            return imageUrl;
        }

        try {
            String cdnDomain = ossProperties.getCdnDomain();
            if (cdnDomain != null && !cdnDomain.isEmpty() && imageUrl.startsWith(cdnDomain)) {
                String objectKey = imageUrl.substring(cdnDomain.length());
                if (objectKey.startsWith("/")) {
                    objectKey = objectKey.substring(1);
                }
                return objectKey;
            }

            // 阿里云OSS URL格式: https://bucket-name.endpoint/object-key
            String endpoint = ossProperties.getEndpoint();
            if (endpoint.startsWith("https://")) {
                endpoint = endpoint.substring(8);
            } else if (endpoint.startsWith("http://")) {
                endpoint = endpoint.substring(7);
            }
            String ossUrlPrefix = "https://" + ossProperties.getBucketName() + "." + endpoint + "/";
            if (imageUrl.startsWith(ossUrlPrefix)) {
                return imageUrl.substring(ossUrlPrefix.length());
            }

            // 尝试提取路径部分
            int thirdSlashIndex = imageUrl.indexOf("/", 8);
            if (thirdSlashIndex > 0 && thirdSlashIndex < imageUrl.length() - 1) {
                return imageUrl.substring(thirdSlashIndex + 1);
            }

        } catch (Exception e) {
            log.warn("从URL提取对象键失败 - url: {}, error: {}", imageUrl, e.getMessage());
        }

        return null;
    }
}
