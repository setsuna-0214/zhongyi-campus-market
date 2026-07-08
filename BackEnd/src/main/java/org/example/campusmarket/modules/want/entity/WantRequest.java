package org.example.campusmarket.modules.want.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 求购需求实体
 * 对应 want_requests 表。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "want_requests")
public class WantRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** 商品类目：沿用 products.category（electronics/books/daily/other） */
    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "min_price", precision = 10, scale = 2)
    private BigDecimal minPrice;

    @Column(name = "max_price", precision = 10, scale = 2)
    private BigDecimal maxPrice;

    /** 关键词：逗号分隔字符串，便于低成本规则匹配与答辩讲解 */
    @Column(name = "keywords", length = 500)
    private String keywords;

    /** 期望成色：仅展示，不参与当前版本打分 */
    @Column(name = "expected_condition", length = 40)
    private String expectedCondition;

    /** 紧急程度：低/中/高 */
    @Column(name = "urgency", length = 20)
    private String urgency;

    /** 状态：OPEN / MATCHED / CLOSED */
    @Column(name = "status", length = 20)
    private String status = "OPEN";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null || status.isBlank()) {
            status = "OPEN";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}