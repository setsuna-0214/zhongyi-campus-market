package org.example.campusmarket.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SystemMessage {
    private Integer id;
    private Integer userId;
    private String type;
    private String title;
    private String content;
    private String link;
    private String linkText;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
