package org.example.campusmarket.util;

import org.example.campusmarket.entity.Result;

/**
 * 统一返回结果工具类
 */
public class ResultUtil {

    // 成功状态码
    public static final Integer SUCCESS_CODE = 200;
    // 失败状态码
    public static final Integer ERROR_CODE = 500;
    // 参数错误状态码
    public static final Integer PARAM_ERROR_CODE = 400;
    // 未授权状态码
    public static final Integer UNAUTHORIZED_CODE = 401;
    // 资源不存在状态码
    public static final Integer NOT_FOUND_CODE = 404;

    /**
     * 通用成功返回（带数据）
     */
    public static Result success(Object data) {
        return new Result(SUCCESS_CODE, "操作成功", data);
    }

    /**
     * 通用成功返回（无数据，仅提示）
     */
    public static Result success(String message) {
        return new Result(SUCCESS_CODE, message, null);
    }

    /**
     * 通用成功返回（无数据，默认提示）
     */
    public static Result success() {
        return new Result(SUCCESS_CODE, "操作成功", null);
    }

    /**
     * 通用失败返回（默认提示）
     */
    public static Result error() {
        return new Result(ERROR_CODE, "操作失败", null);
    }

    /**
     * 通用失败返回（自定义提示）
     */
    public static Result error(String message) {
        return new Result(ERROR_CODE, message, null);
    }

    /**
     * 自定义状态码返回
     */
    public static Result custom(Integer code, String message, Object data) {
        return new Result(code, message, data);
    }

    /**
     * 参数错误返回
     */
    public static Result paramError(String message) {
        return new Result(PARAM_ERROR_CODE, message, null);
    }

    /**
     * 未授权返回
     */
    public static Result unauthorized(String message) {
        return new Result(UNAUTHORIZED_CODE, message, null);
    }

    /**
     * 资源不存在返回
     */
    public static Result notFound(String message) {
        return new Result(NOT_FOUND_CODE, message, null);
    }
}