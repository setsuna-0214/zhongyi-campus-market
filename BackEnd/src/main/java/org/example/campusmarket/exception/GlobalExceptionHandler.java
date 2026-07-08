package org.example.campusmarket.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.util.ResultUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * 全局异常处理器
 * <p>统一拦截控制器抛出的异常，转换为项目约定的 Result JSON 结构，
 * 避免在各 Controller 中重复 try/catch，便于前端按 code 字段统一处理。
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** 业务参数错误（如校验失败、资源不存在等） */
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.OK)
    public Result handleIllegalArg(IllegalArgumentException e, HttpServletRequest request) {
        log.warn("参数错误 - {}: {}", request.getRequestURI(), e.getMessage());
        return ResultUtil.paramError(e.getMessage());
    }

    /** 请求体缺失或 JSON 解析失败 */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.OK)
    public Result handleMessageNotReadable(HttpMessageNotReadableException e, HttpServletRequest request) {
        log.warn("请求体解析失败 - {}: {}", request.getRequestURI(), e.getMessage());
        return ResultUtil.paramError("请求体格式不正确或为空");
    }

    /** @Valid 校验失败 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.OK)
    public Result handleValidation(MethodArgumentNotValidException e, HttpServletRequest request) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("参数校验失败");
        log.warn("校验失败 - {}: {}", request.getRequestURI(), msg);
        return ResultUtil.paramError(msg);
    }

    /** 参数类型转换失败（如把字符串塞给了 Integer） */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.OK)
    public Result handleTypeMismatch(MethodArgumentTypeMismatchException e, HttpServletRequest request) {
        log.warn("参数类型错误 - {}: {}", request.getRequestURI(), e.getMessage());
        return ResultUtil.paramError("参数类型不正确: " + e.getName());
    }

    /** 业务运行期异常（服务层手动抛出的 RuntimeException，含中文提示） */
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.OK)
    public Result handleRuntime(RuntimeException e, HttpServletRequest request) {
        log.error("业务异常 - {}: {}", request.getRequestURI(), e.getMessage(), e);
        return ResultUtil.error(e.getMessage() == null ? "操作失败" : e.getMessage());
    }

    /** 权限不足：访问需要管理员权限的资源（兜底，正常由 AccessDeniedHandler 处理） */
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.OK)
    public Result handleAccessDenied(AccessDeniedException e, HttpServletRequest request) {
        log.warn("权限不足 - {}", request.getRequestURI());
        return ResultUtil.custom(ResultUtil.UNAUTHORIZED_CODE + 2, "权限不足，需要管理员账号", null);
    }

    /** 未认证：token 缺失或失效（兜底） */
    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.OK)
    public Result handleAuth(AuthenticationException e, HttpServletRequest request) {
        log.warn("未认证 - {}", request.getRequestURI());
        return ResultUtil.unauthorized("用户未登录或令牌无效");
    }

    /** 未知异常兜底，防止暴露堆栈给前端 */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.OK)
    public Result handleException(Exception e, HttpServletRequest request) {
        log.error("未知异常 - {}: {}", request.getRequestURI(), e.getMessage(), e);
        return ResultUtil.error("服务器内部错误，请稍后重试");
    }
}