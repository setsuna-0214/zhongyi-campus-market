package org.example.campusmarket.exception;

/**
 * 图片验证异常
 * 当上传的文件不符合验证规则时抛出此异常
 * 
 * <p>该异常用于表示文件验证失败的情况，包括：
 * <ul>
 *   <li>文件为空</li>
 *   <li>文件大小超过限制</li>
 *   <li>文件格式不支持</li>
 *   <li>MIME类型不匹配</li>
 *   <li>文件内容与格式不匹配（魔数检测失败）</li>
 * </ul>
 * 
 * @author Campus Market Team
 * @version 1.0
 */
public class ImageValidationException extends IllegalArgumentException {

    /**
     * 构造一个带有指定详细消息的图片验证异常
     * 
     * @param message 详细消息，描述验证失败的原因
     */
    public ImageValidationException(String message) {
        super(message);
    }

    /**
     * 构造一个带有指定详细消息和原因的图片验证异常
     * 
     * @param message 详细消息，描述验证失败的原因
     * @param cause 导致此异常的原因（可以为null）
     */
    public ImageValidationException(String message, Throwable cause) {
        super(message, cause);
    }
}
