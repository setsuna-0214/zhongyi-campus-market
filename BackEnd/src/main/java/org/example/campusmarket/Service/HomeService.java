package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.HomeDto;
import org.example.campusmarket.Mapper.HomeMapper;
import org.example.campusmarket.entity.HomeProductRow;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class HomeService {

    @Autowired
    private HomeMapper homeMapper; // 首页相关查询的 Mapper（执行热门/最新 SQL）

    @Autowired
    private ProductHotnessService productHotnessService; // 商品热度服务

    // 获取热门商品列表
    // limit：返回的最大条目数
    // 使用 Redis 热门排行榜获取热门商品ID，然后查询商品详情
    // 如果 Redis 排行榜中商品数量不足，从数据库补充未被浏览过的商品
    // Requirements: 2.1, 2.3
    // 获取热门商品列表
    // page：页码
    // limit：每页数量
    // remove restrictions: 使用数据库分页查询，不再限制只能看前 N 个
    public List<HomeDto.HomeProduct> getHotProducts(Integer page, Integer limit) {
        if (page == null || page < 1)
            page = 1;
        if (limit == null || limit < 1)
            limit = 10;
        int offset = (page - 1) * limit;

        // 直接从数据库获取分页数据（按 Fav+Buy 热度排序）
        List<HomeProductRow> rows = homeMapper.listHot(offset, limit);

        if (rows == null || rows.isEmpty()) {
            return new ArrayList<>();
        }

        // 收集商品ID
        List<Integer> productIds = new ArrayList<>();
        for (HomeProductRow row : rows) {
            productIds.add(row.getId());
        }

        // 批量获取实时浏览量 (Visits)
        Map<Integer, Long> viewCounts = productHotnessService.getViewCounts(productIds);

        // 构建返回列表
        List<HomeDto.HomeProduct> items = new ArrayList<>();
        for (HomeProductRow r : rows) {
            Integer priceInt = parsePriceToInt(r.getPrice());
            // 使用 Redis 中的实时浏览量
            Long viewCount = viewCounts.getOrDefault(r.getId(), 0L);
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
                    viewCount.intValue() // 显示实时浏览量
            ));
        }

        return items;
    }

    // 获取最新发布商品列表
    // page: 页码
    // limit：每页数量
    public List<HomeDto.HomeProduct> getLatestProducts(Integer page, Integer limit) {
        if (page == null || page < 1)
            page = 1;
        if (limit == null || limit < 1)
            limit = 10;
        int offset = (page - 1) * limit;

        // rows：数据库查询到的分页数据
        List<HomeProductRow> rows = homeMapper.listLatest(offset, limit);
        // items：转换后的返回数据
        List<HomeDto.HomeProduct> items = new ArrayList<>();
        // 为空保护
        if (rows == null)
            return items;
        // 逐条转换
        for (HomeProductRow r : rows) {
            // priceInt：转换价格为整数
            Integer priceInt = parsePriceToInt(r.getPrice());
            // 卖家名称：优先昵称，其次用户名
            String sellerName = r.getSeller() != null ? r.getSeller() : r.getSellerUsername();
            // 解析图片列表
            List<String> imageList = parseImageList(r.getImage());
            String firstImage = imageList.isEmpty() ? null : imageList.get(0);
            // 格式化发布时间为 ISO 字符串
            String publishTime = null;
            if (r.getCreatedAt() != null) {
                publishTime = r.getCreatedAt().toString();
            }
            // 构造返回条目
            items.add(new HomeDto.HomeProduct(
                    r.getId(), // id：商品唯一标识
                    r.getTitle(), // title：商品标题
                    firstImage, // image：首张商品图片
                    imageList, // images：商品图片列表
                    priceInt, // price：整数价格
                    null, // publishedAt：最新接口不使用该字段
                    publishTime, // publishTime：商品发布时间 ISO 字符串
                    r.getSellerId(), // sellerId：卖家ID
                    sellerName, // seller：卖家昵称或用户名
                    r.getLocation(), // location：卖家地址/学校
                    r.getCategory(), // category：类目（可能为 null）
                    r.getStatus(), // status：在售/已售
                    r.getViews() // views：热度值
            ));
        }
        // 返回转换后的列表
        return items;
    }

    // 将价格字符串安全转换为整数
    // s：价格的字符串表示，可能包含空格或非法值
    private Integer parsePriceToInt(String s) {
        // 为空直接返回 null
        if (s == null)
            return null;
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