package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.HomeDto;
import org.example.campusmarket.Mapper.HomeMapper;
import org.example.campusmarket.entity.HomeProductRow;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class HomeService {
    @Autowired
    private HomeMapper homeMapper; // 首页相关查询的 Mapper（执行热门/最新 SQL）

    // 获取热门商品列表
    // limit：返回的最大条目数
    public List<HomeDto.HomeProduct> getHotProducts(Integer limit) {
        // rows：数据库查询到的原始行（字段仍为字符串/原始类型）
        List<HomeProductRow> rows = homeMapper.listHot(limit);
        // items：转换后的返回数据，字段对齐前端需求
        List<HomeDto.HomeProduct> items = new ArrayList<>();
        // rows 为空时直接返回空列表，避免 NullPointerException
        if (rows == null) return items;
        // 遍历每一行，逐条转换为 HomeProduct
        for (HomeProductRow r : rows) {
            // priceInt：将字符串价格安全转换为整数
            Integer priceInt = parsePriceToInt(r.getPrice());
            // 构造 HomeProduct，填充各字段
            items.add(new HomeDto.HomeProduct(
                    r.getId(),           // id：商品唯一标识
                    r.getTitle(),        // title：商品标题
                    r.getImage(),        // image：商品图片
                    priceInt,            // price：整数价格
                    "",                 // publishedAt：热门接口无需真实日期，留空字符串
                    null,                // publishTime：热门接口无发布时间，置为 null
                    r.getSeller(),       // seller：卖家昵称
                    r.getLocation(),     // location：卖家地址/学校
                    r.getCategory(),     // category：类目（当前可能为 null）
                    r.getStatus(),       // status：在售/已售
                    r.getViews()         // views：热度值
            ));
        }
        // 返回转换后的列表
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
            // 构造返回条目
            items.add(new HomeDto.HomeProduct(
                    r.getId(),           // id：商品唯一标识
                    r.getTitle(),        // title：商品标题
                    r.getImage(),        // image：商品图片
                    priceInt,            // price：整数价格
                    null,                // publishedAt：最新接口不使用该字段
                    "",                 // publishTime：可选发布时间占位，留空字符串
                    r.getSeller(),       // seller：卖家昵称
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
}