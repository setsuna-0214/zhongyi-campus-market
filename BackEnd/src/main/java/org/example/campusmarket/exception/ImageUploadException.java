package org.example.campusmarket.exception;

/**
 * 图片上传异常
 * 当OSS上传操作失败时抛出此异常
 * 
 * <p>该异常用于封装OSS上传过程中发生的各种错误，包括：
 * <ul>
 *   <li>网络连接失败</li>
 *   <li>认证失败</li>
 *   <li>存储空间不足</li>
 *   <li>上传超时</li>
 *   <li>文件读取错误</li>
 * </ul>
 * 
 * @author Campus Market Team
 * @version 1.0
 */
public class ImageUploadException extends RuntimeException {

    /**
     * 构造一个带有指定详细消息的图片上传异常
     * 
     * @param message 详细消息，描述上传失败的原因
     */
    public ImageUploadException(String message) {
        super(message);
    }

    /**
     * 构造一个带有指定详细消息和原因的图片上传异常
     * 
     * @param message 详细消息，描述上传失败的原因
     * @param cause 导致此异常的原因（可以为null）
     */
    public ImageUploadException(String message, Throwable cause) {
        super(message, cause);
    }
}
