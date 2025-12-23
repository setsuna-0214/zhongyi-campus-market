package org.example.campusmarket.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Comment {
    private Integer id;
    private Integer productId;
    private Integer userId;
    private String content;
    private LocalDateTime createdAt;
    
    // 关联的用户信息（查询时填充）
    private String userNickname;
    private String userAvatar;
}
