package org.example.campusmarket.modules.want.service;

import lombok.RequiredArgsConstructor;
import org.example.campusmarket.modules.want.dto.WantDto;
import org.example.campusmarket.modules.want.entity.WantRequest;
import org.example.campusmarket.modules.want.mapper.WantMapper;
import org.example.campusmarket.modules.want.repository.WantRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 求购匹配服务
 * 规则算法全部写在 Service 中，便于答辩时直接说明每一项分数来源。
 * 当前版本不依赖大数据推荐，仅做可解释的规则匹配。
 */
@Service
@RequiredArgsConstructor
public class WantMatchService {

    private final WantRequestRepository wantRequestRepository;
    private final WantMapper wantMapper;

    /**
     * 对单条求购执行匹配，返回分数 >= 40 的商品。
     * 规则：
     * - 分类相同：+40
     * - 标题命中关键词：每个关键词 +15
     * - 描述命中关键词：每个关键词 +8
     * - 价格在预算范围内：+30
     * - 价格略高于预算但不超过20%：+10
     * - 商品状态为在售：+20（候选集已限定未售出且未下架，仍保留理由用于演示）
     * - 成色维度：按用户确认，本版本仅展示期望成色，不参与打分
     */
    @Transactional(readOnly = true)
    public List<WantDto.MatchItem> matchForWant(Long wantId) {
        WantRequest want = wantRequestRepository.findById(wantId)
                .orElseThrow(() -> new RuntimeException("求购信息不存在"));

        List<Map<String, Object>> candidates = wantMapper.listMatchCandidates();
        List<WantDto.MatchItem> result = new ArrayList<>();

        for (Map<String, Object> row : candidates) {
            MatchScore score = scoreOne(want, row);
            if (score.score >= 40) {
                WantDto.MatchItem item = new WantDto.MatchItem();
                item.setProductId(asInt(row.get("productId")));
                item.setTitle(asString(row.get("title")));
                item.setPicture(firstImage(asString(row.get("picture"))));
                item.setCategory(asString(row.get("category")));
                item.setPrice(asBigDecimal(row.get("price")));
                item.setSellerId(asInt(row.get("sellerId")));
                item.setSellerName(asString(row.get("sellerName")));
                item.setMatchScore(score.score);
                item.setMatchReasons(score.reasons);
                result.add(item);
            }
        }

        result.sort((a, b) -> Integer.compare(b.getMatchScore(), a.getMatchScore()));
        if (result.size() > 10) {
            return result.subList(0, 10);
        }
        return result;
    }

    /**
     * 根据商品查询相关求购：用于商品详情页展示“哪些求购可能对这个商品感兴趣”。
     */
    @Transactional(readOnly = true)
    public List<WantDto.WantItem> findRelatedWants(String category, String productTitle) {
        String keyword = null;
        if (productTitle != null && !productTitle.isBlank()) {
            keyword = productTitle.length() > 12 ? productTitle.substring(0, 12) : productTitle;
        }
        return wantMapper.findRelatedWants(category, keyword);
    }

    private MatchScore scoreOne(WantRequest want, Map<String, Object> row) {
        int score = 0;
        List<String> reasons = new ArrayList<>();

        String wantCategory = safeLower(want.getCategory());
        String productCategory = safeLower(asString(row.get("category")));
        String productTitle = safeLower(asString(row.get("title")));
        String productDescription = safeLower(asString(row.get("description")));
        BigDecimal price = asBigDecimal(row.get("price"));

        // 1) 分类一致 +40
        if (!wantCategory.isBlank() && wantCategory.equals(productCategory)) {
            score += 40;
            reasons.add("分类一致");
        }

        // 2) 关键词命中
        List<String> hitKeywords = new ArrayList<>();
        for (String keyword : collectKeywords(want)) {
            String kw = safeLower(keyword);
            boolean hitTitle = productTitle.contains(kw);
            boolean hitDesc = productDescription.contains(kw);
            if (hitTitle) {
                score += 15;
                hitKeywords.add(keyword);
            } else if (hitDesc) {
                score += 8;
                hitKeywords.add(keyword);
            }
        }
        if (!hitKeywords.isEmpty()) {
            reasons.add("命中关键词：" + String.join("、", hitKeywords));
        }

        // 3) 预算匹配
        if (price != null) {
            BigDecimal min = want.getMinPrice();
            BigDecimal max = want.getMaxPrice();
            if (min != null && max != null && price.compareTo(min) >= 0 && price.compareTo(max) <= 0) {
                score += 30;
                reasons.add("价格在预算范围内");
            } else if (max != null) {
                BigDecimal upper20 = max.multiply(new BigDecimal("1.2"));
                if (price.compareTo(max) > 0 && price.compareTo(upper20) <= 0) {
                    score += 10;
                    reasons.add("价格略高于预算但仍可接受");
                }
            }
        }

        // 4) 在售状态 +20（候选集已保证，但保留理由提升演示可解释性）
        score += 20;
        reasons.add("商品仍在售");

        // 5) 用户确认当前版本不对成色打分，仅在有期望成色时加说明，不加分
        if (want.getExpectedCondition() != null && !want.getExpectedCondition().isBlank()) {
            reasons.add("期望成色：" + want.getExpectedCondition() + "（当前版本仅展示，不参与打分）");
        }

        return new MatchScore(score, reasons);
    }

    private static class MatchScore {
        private final int score;
        private final List<String> reasons;
        private MatchScore(int score, List<String> reasons) {
            this.score = score;
            this.reasons = reasons;
        }
    }

    private List<String> splitKeywords(String keywords) {
        if (keywords == null || keywords.isBlank()) return List.of();
        return Arrays.stream(keywords.split("[,，、\\s]+"))
                .map(String::trim)
                .filter(s -> s.length() >= 2)
                .filter(s -> !s.isBlank())
                .distinct()
                .collect(Collectors.toList());
    }

    private List<String> collectKeywords(WantRequest want) {
        List<String> keywords = new ArrayList<>(splitKeywords(want.getKeywords()));
        if (keywords.isEmpty()) {
            keywords.addAll(extractTitleKeywords(want.getTitle()));
        }
        if (keywords.isEmpty() && want.getDescription() != null) {
            keywords.addAll(extractTitleKeywords(want.getDescription()));
        }
        return keywords.stream().limit(8).collect(Collectors.toList());
    }

    private List<String> extractTitleKeywords(String text) {
        if (text == null || text.isBlank()) return List.of();
        String cleaned = text.replaceAll("求购|想买|收一个|收台|收|购买|二手|闲置", " ")
                .replaceAll("[^\\p{IsHan}A-Za-z0-9]+", " ")
                .trim();
        List<String> words = new ArrayList<>(splitKeywords(cleaned));
        if (cleaned.length() >= 2 && cleaned.length() <= 12) {
            words.add(cleaned.replace(" ", ""));
        }
        String compact = cleaned.replace(" ", "");
        int maxLen = Math.min(compact.length(), 6);
        for (int len = maxLen; len >= 2; len--) {
            for (int start = 0; start + len <= compact.length(); start++) {
                words.add(compact.substring(start, start + len));
            }
        }
        return words.stream().filter(s -> s.length() >= 2).distinct().limit(8).collect(Collectors.toList());
    }

    private String firstImage(String pictures) {
        if (pictures == null || pictures.isBlank()) return null;
        return pictures.split(",")[0];
    }

    private String safeLower(String s) {
        return s == null ? "" : s.toLowerCase(Locale.ROOT);
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Integer asInt(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.intValue();
        return Integer.valueOf(String.valueOf(value));
    }

    private BigDecimal asBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal bd) return bd;
        return new BigDecimal(String.valueOf(value));
    }
}
