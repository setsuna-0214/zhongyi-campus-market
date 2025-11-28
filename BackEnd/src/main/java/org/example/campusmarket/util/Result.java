package org.example.campusmarket.util;

import lombok.Data;

@Data
public class Result {
    private int code; // 200=成功，400=失败
    private String msg;
    private Object data;

    // 成功返回
    public static Result success(Object data) {
        Result result = new Result();
        result.setCode(200);
        result.setMsg("操作成功");
        result.setData(data);
        return result;
    }

    // 失败返回
    public static Result fail(String msg) {
        Result result = new Result();
        result.setCode(400);
        result.setMsg(msg);
        result.setData(null);
        return result;
    }
}