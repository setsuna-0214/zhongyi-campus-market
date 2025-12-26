package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.HomeDto;
import org.example.campusmarket.Mapper.HomeMapper;
import org.example.campusmarket.entity.HomeProductRow;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class HomeService {
    private static final Logger log = LoggerFactory.getLogger(HomeService.class);

    @Autowired
    private HomeMapper homeMapper; // 首页相关查询的 Mapper（执行热门/最新 SQL）

    @Autowired
    private ProductHotnessService productHotnessService; // 商品热度服务

    // 获取热门商品列表
    // limit：返回的最大条目数
    // 使用 Redis 热门排行榜获取热门商品ID，然后查询商品详情
    // 如果 Redis 排行榜中商品数量不足，从数据库补充未被浏览过的商品
    // Requirements: 2.1, 2.3
    public List<HomeDto.HomeProduct> getHotProducts(Integer limit) {
        // 1. 从 Redis 获取热门商品ID列表
        List<Integer> hotProductIds = productHotnessService.getHotRanking(limit);
        
        // 如果 Redis 排行榜为空，降级到原有的数据库查询
        if (hotProductIds == null || hotProductIds.isEmpty()) {
            log.debug("Redis 热门排行榜为空，降级到数据库查询");
            return getHotProductsFromDatabase(limit);
        }
        
        // 2. 根据ID列表查询商品详情
        List<HomeProductRow> rows = homeMapper.findByIds(hotProductIds);
        
        if (rows == null || rows.isEmpty()) {
            log.warn("根据热门ID列表查询商品为空，降级到数据库查询");
            return getHotProductsFromDatabase(limit);
        }
        
        // 3. 将查询结果按照热门排行榜顺序排序
        Map<Integer, HomeProductRow> rowMap = new HashMap<>();
        for (HomeProductRow row : rows) {
            rowMap.put(row.getId(), row);
        }
        
        // 4. 批量获取实时浏览量
        Map<Integer, Long> viewCounts = productHotnessService.getViewCounts(hotProductIds);
        
        // 5. 按照热门排行榜顺序构建返回列表
        List<HomeDto.HomeProduct> items = new ArrayList<>();
        for (Integer productId : hotProductIds) {
            HomeProductRow r = rowMap.get(productId);
            if (r != null) {
                Integer priceInt = parsePriceToInt(r.getPrice());
                // 使用 Redis 中的实时浏览量
                Long viewCount = viewCounts.getOrDefault(productId, 0L);
                // 卖家名称：优先昵称，其次用户名
                String sellerName = r.getSeller() != null ? r.getSeller() : r.getSellerUsername();
                // 解析图片列表
                List<String> imageList = parseImageList(r.getImage());
                String firstImage = imageList.isEmpty() ? null : imageList.get(0);
                items.add(new HomeDto.HomeProduct(
                        r.getId(),
                        r.getTitle(),
                        firstImage,
                        imageList,
                        priceInt,
                        "",
                        null,
                        r.getSellerId(),
                        sellerName,
                        r.getLocation(),
                        r.getCategory(),
                        r.getStatus(),
                        viewCount.intValue()
                ));
            }
        }
        
        // 6. 如果 Redis 排行榜中商品数量不足，从数据库补充
        // Requirements: 2.3 - 当 Hot_Ranking 中不存在请求的商品数量时，返回所有可用的热门商品
        if (items.size() < limit) {
            int remaining = limit - items.size();
            log.debug("Redis 热门排行榜商品数量不足，需要从数据库补充 {} 个商品", remaining);
            
            // 从数据库获取更多商品（排除已经在列表中的商品）
            List<HomeProductRow> dbRows = homeMapper.listHot(limit + items.size());
            if (dbRows != null) {
                // 收集已有商品的ID
                java.util.Set<Integer> existingIds = new java.util.HashSet<>();
                for (HomeDto.HomeProduct item : items) {
                    existingIds.add(item.getId());
                }
                
                // 补充不在列表中的商品
                for (HomeProductRow r : dbRows) {
                    if (items.size() >= limit) break;
                    if (!existingIds.contains(r.getId())) {
                        Integer priceInt = parsePriceToInt(r.getPrice());
                        // 卖家名称：优先昵称，其次用户名
                        String sellerName = r.getSeller() != null ? r.getSeller() : r.getSellerUsername();
                        // 解析图片列表
                        List<String> imageList = parseImageList(r.getImage());
                        String firstImage = imageList.isEmpty() ? null : imageList.get(0);
                        // 未被浏览过的商品，浏览量为 0
                        items.add(new HomeDto.HomeProduct(
                                r.getId(),
                                r.getTitle(),
                                firstImage,
                                imageList,
                                priceInt,
                                "",
                                null,
                                r.getSellerId(),
                                sellerName,
                                r.getLocation(),
                                r.getCategory(),
                                r.getStatus(),
                                r.getViews() != null ? r.getViews() : 0
                        ));
                        existingIds.add(r.getId());
                    }
                }
            }
        }
        
        log.debug("最终返回 {} 个热门商品", items.size());
        return items;
    }
    
    // 从数据库获取热门商品（降级方法）
    private List<HomeDto.HomeProduct> getHotProductsFromDatabase(Integer limit) {
        List<HomeProductRow> rows = homeMapper.listHot(limit);
        List<HomeDto.HomeProduct> items = new ArrayList<>();
        if (rows == null) return items;
        for (HomeProductRow r : rows) {
            Integer priceInt = parsePriceToInt(r.getPrice());
            // 卖家名称：优先昵称，其次用户名
            String sellerName = r.getSeller() != null ? r.getSeller() : r.getSellerUsername();
            // 解析图片列表
            List<String> imageList = parseImageList(r.getImage());
            String firstImage = imageList.isEmpty() ? null : imageList.get(0);
            items.add(new HomeDto.HomeProduct(
                    r.getId(),
                    r.getTitle(),
                    firstImage,
                    imageList,
                    priceInt,
                    "",
                    null,
                    r.getSellerId(),
                    sellerName,
                    r.getLocation(),
                    r.getCategory(),
                    r.getStatus(),
                    r.getViews()
            ));
        }
        return items;
    }

    // 获取最新发布商品列表
    // limit：返回的最大条目数
    public List<HomeDto.HomeProduct> getLatestProducts(Integer limit) {
        // rows：数据库查询到的原始行（最近 pro_id 较大）
        List<HomeProductRow> rows = homeMapper.listLatest(limit);
        // items：转换后的返回数据
        List<HomeDto.HomeProduct> items = new ArrayList<>();
        // 为空保护
        if (rows == null) return items;
        // 逐条转换
        for (HomeProductRow r : rows) {
            // priceInt：转换价格为整数
            Integer priceInt = parsePriceToInt(r.getPrice());
            // 卖家名称：优先昵称，其次用户名
            String sellerName = r.getSeller() != null ? r.getSeller() : r.getSellerUsername();
            // 解析图片列表
            List<String> imageList = parseImageList(r.getImage());
            String firstImage = imageList.isEmpty() ? null : imageList.get(0);
            // 构造返回条目
            items.add(new HomeDto.HomeProduct(
                    r.getId(),           // id：商品唯一标识
                    r.getTitle(),        // title：商品标题
                    firstImage,          // image：首张商品图片
                    imageList,           // images：商品图片列表
                    priceInt,            // price：整数价格
                    null,                // publishedAt：最新接口不使用该字段
                    "",                 // publishTime：可选发布时间占位，留空字符串
                    r.getSellerId(),     // sellerId：卖家ID
                    sellerName,          // seller：卖家昵称或用户名
                    r.getLocation(),     // location：卖家地址/学校
                    r.getCategory(),     // category：类目（可能为 null）
                    r.getStatus(),       // status：在售/已售
                    r.getViews()         // views：热度值
            ));
        }
        // 返回转换后的列表
        return items;
    }

    // 将价格字符串安全转换为整数
    // s：价格的字符串表示，可能包含空格或非法值
    private Integer parsePriceToInt(String s) {
        // 为空直接返回 null
        if (s == null) return null;
        try {
            // 去除首尾空格并用 BigDecimal 解析，保证数值精度
            BigDecimal bd = new BigDecimal(s.trim());
            // 以整数形式返回（单位元）
            return bd.intValue();
        } catch (Exception e) {
            // 解析失败返回 null，避免抛出异常
            return null;
        }
    }

    // 将逗号分隔的图片字符串解析为列表
    // imageStr：数据库中存储的图片路径，可能是单张或逗号分隔的多张
    private List<String> parseImageList(String imageStr) {
        if (imageStr == null || imageStr.trim().isEmpty()) {
            return new ArrayList<>();
        }
        // 按逗号分隔并过滤空字符串
        String[] parts = imageStr.split(",");
        List<String> result = new ArrayList<>();
        for (String part : parts) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                result.add(trimmed);
            }
        }
        return result;
    }
}