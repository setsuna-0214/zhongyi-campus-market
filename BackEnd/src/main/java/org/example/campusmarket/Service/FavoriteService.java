package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.FavoriteDto;
import org.example.campusmarket.Mapper.FavoriteMapper;
import org.example.campusmarket.entity.Product;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class FavoriteService {
    @Autowired
    private FavoriteMapper favoriteMapper;

    //查找收藏商品（原始格式）
    public List<Product> GetFavoritesByUserId(Integer userId) {
        return favoriteMapper.getFavoritesByUserId(userId);
    }

    //查找收藏商品（符合API文档格式）
    public List<FavoriteDto.FavoriteItem> GetFavoritesWithDetails(Integer userId) {
        List<Map<String, Object>> rows = favoriteMapper.getFavoritesWithDetails(userId);
        List<FavoriteDto.FavoriteItem> result = new ArrayList<>();
        
        if (rows == null) return result;
        
        for (Map<String, Object> row : rows) {
            FavoriteDto.FavoriteItem item = new FavoriteDto.FavoriteItem();
            
            // 设置收藏记录信息
            item.setId(((Number) row.get("fav_id")).intValue());
            item.setProductId(((Number) row.get("pro_id")).intValue());
            
            // 处理创建时间
            Object createdAtObj = row.get("created_at");
            if (createdAtObj instanceof LocalDateTime) {
                item.setCreatedAt((LocalDateTime) createdAtObj);
            } else if (createdAtObj != null) {
                item.setCreatedAt(LocalDateTime.now()); // 兜底
            }
            
            // 设置商品摘要
            FavoriteDto.ProductSummary product = new FavoriteDto.ProductSummary();
            product.setId(((Number) row.get("pro_id")).intValue());
            product.setTitle((String) row.get("pro_name"));
            
            // 解析价格
            Object priceObj = row.get("price");
            if (priceObj != null) {
                try {
                    if (priceObj instanceof String) {
                        product.setPrice(new BigDecimal((String) priceObj).intValue());
                    } else if (priceObj instanceof Number) {
                        product.setPrice(((Number) priceObj).intValue());
                    }
                } catch (Exception e) {
                    product.setPrice(0);
                }
            }
            
            product.setImage((String) row.get("picture"));
            
            // 设置状态
            Object isSealObj = row.get("is_seal");
            boolean isSeal = false;
            if (isSealObj instanceof Boolean) {
                isSeal = (Boolean) isSealObj;
            } else if (isSealObj instanceof Number) {
                isSeal = ((Number) isSealObj).intValue() == 1;
            }
            product.setStatus(isSeal ? "已售出" : "在售");
            
            item.setProduct(product);
            result.add(item);
        }
        
        return result;
    }

    //增加收藏商品
    public FavoriteDto.AddResponse AddFavorite(Integer userId, Integer productId) {
        if (userId == null || productId == null) {
            return null;
        }
        int count = favoriteMapper.countByUserAndProduct(userId, productId);
        if (count > 0) {
            // 已存在，返回现有记录
            Integer existingId = favoriteMapper.getFavoriteId(userId, productId);
            return new FavoriteDto.AddResponse(existingId, productId, LocalDateTime.now());
        }
        
        LocalDateTime now = LocalDateTime.now();
        int rows = favoriteMapper.insertFavorite(userId, productId, now);
        if (rows == 1) {
            Integer newId = favoriteMapper.getFavoriteId(userId, productId);
            return new FavoriteDto.AddResponse(newId, productId, now);
        }
        return null;
    }

    //移除收藏商品
    public boolean RemoveFavorite(Integer userId, Integer productId) {
        if (userId == null || productId == null) {
            return false;
        }
        return favoriteMapper.deleteFavorite(userId, productId) >= 0; // 即使不存在也返回成功
    }
}