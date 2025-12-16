package org.example.campusmarket.Controller;

import org.example.campusmarket.DTO.ProductDto;
import org.example.campusmarket.Service.ProductService;
import org.example.campusmarket.entity.Product;
import org.example.campusmarket.entity.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Arrays;

@RestController
@RequestMapping("/products")
public class ProductController {

    private static final Logger log = LoggerFactory.getLogger(ProductController.class);

    @Autowired
    private ProductService productService;

    // 搜索商品接口
    // GET /products
    // 支持多种筛选条件和分页
    // 参数说明：
    // keyword: 搜索关键词 (可选)
    // category: 分类 (可选, e.g. electronics)
    // location: 地点 (可选, e.g. 北京大学)
    // status: 状态 (可选, e.g. 在售/已下架)
    // priceMin/priceMax: 价格区间 (可选)
    // sort: 排序方式 (可选, latest/price-low/price-high/popular)
    // page: 页码 (默认1)
    // pageSize: 每页数量 (默认12)
    @GetMapping
    public ProductDto.ProductListResponse searchProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Double priceMin,
            @RequestParam(required = false) Double priceMax,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int pageSize
    ) {
        // 标准化分类参数（支持中文自动转换）
        String normalizedCategory = (category != null && !category.trim().isEmpty()) 
            ? normalizeCategory(category) 
            : null;
        return productService.searchProducts(keyword, normalizedCategory, location, status, priceMin, priceMax, sort, page, pageSize);
    }

    // 获取商品详情接口
    @GetMapping("/{id}")
    public ProductDto.ProductDetail getProductDetail(@PathVariable Integer id) {
        return productService.getProductDetail(id);
    }

    // 获取相关商品接口
    @GetMapping("/{id}/related")
    public List<ProductDto.ProductDetail> getRelatedProducts(@PathVariable Integer id) {
        return productService.getRelatedProducts(id);
    }

    // 有效的商品分类代码
    private static final java.util.Set<String> VALID_CATEGORIES = java.util.Set.of(
        "electronics", "books", "daily", "other"
    );
    
    // 中文分类到英文代码的映射
    private static final java.util.Map<String, String> CATEGORY_CN_TO_CODE = java.util.Map.of(
        "数码电子", "electronics",
        "图书教材", "books",
        "生活用品", "daily",
        "日常用品", "daily",
        "其他物品", "other",
        "其他", "other"
    );
    
    /**
     * 标准化分类代码
     * 如果传入中文分类，自动转换为英文代码
     */
    private String normalizeCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            return "other";
        }
        String trimmed = category.trim();
        // 如果已经是有效的英文代码，直接返回
        if (VALID_CATEGORIES.contains(trimmed)) {
            return trimmed;
        }
        // 尝试从中文转换
        String code = CATEGORY_CN_TO_CODE.get(trimmed);
        return code != null ? code : "other";
    }

    /**
     * 创建商品接口
     * POST /products
     * 
     * @param pro_name 商品名称
     * @param price 商品价格
     * @param discription 商品描述
     * @param images 商品图片（最多9张）
     * @param authentication 认证信息（自动注入）
     * @return 创建结果，包含商品ID
     */
    @PostMapping
    public Result createProduct(
            @RequestParam("pro_name") String pro_name,
            @RequestParam("price") String price,
            @RequestParam(value = "category", required = false, defaultValue = "other") String category,
            @RequestParam(value = "discription", required = false) String discription,
            @RequestParam(value = "images", required = false) MultipartFile[] images,
            Authentication authentication) {
        
        try {
            // 从认证信息获取当前用户ID
            Integer saler_id = (Integer) authentication.getPrincipal();
            
            // 标准化分类代码（支持中文自动转换）
            String normalizedCategory = normalizeCategory(category);
            
            log.info("收到创建商品请求 - name: {}, price: {}, category: {} -> {}, saler_id: {}, imageCount: {}", 
                     pro_name, price, category, normalizedCategory, saler_id, images != null ? images.length : 0);

            // 构建商品对象
            Product product = new Product();
            product.setPro_name(pro_name);
            product.setPrice(price);
            product.setCategory(normalizedCategory);
            product.setDiscription(discription);
            product.setSaler_id(saler_id);
            product.set_seal(false);

            // 调用服务层创建商品
            Integer productId = productService.createProduct(product, images);

            return new Result(200, "商品发布成功", productId);

        } catch (IllegalArgumentException e) {
            log.warn("商品创建参数错误 - error: {}", e.getMessage());
            return new Result(400, e.getMessage(), null);
        } catch (Exception e) {
            log.error("商品创建失败 - error: {}", e.getMessage(), e);
            return new Result(500, "商品发布失败，请稍后重试", null);
        }
    }

    /**
     * 更新商品接口
     * PUT /products/{id}
     * 
     * @param id 商品ID
     * @param pro_name 商品名称
     * @param price 商品价格
     * @param discription 商品描述
     * @param keepImages 保留的旧图片URL（逗号分隔）
     * @param newImages 新上传的图片
     * @return 更新结果
     */
    @PutMapping("/{id}")
    public Result updateProduct(
            @PathVariable Integer id,
            @RequestParam(value = "pro_name", required = false) String pro_name,
            @RequestParam(value = "price", required = false) String price,
            @RequestParam(value = "discription", required = false) String discription,
            @RequestParam(value = "keepImages", required = false) String keepImages,
            @RequestParam(value = "newImages", required = false) MultipartFile[] newImages) {
        
        try {
            log.info("收到更新商品请求 - id: {}, newImageCount: {}", 
                     id, newImages != null ? newImages.length : 0);

            // 构建商品对象
            Product product = new Product();
            product.setPro_name(pro_name);
            product.setPrice(price);
            product.setDiscription(discription);

            // 解析保留的图片URL
            List<String> keepImageUrls = null;
            if (keepImages != null && !keepImages.isEmpty()) {
                keepImageUrls = Arrays.asList(keepImages.split(","));
            }

            // 调用服务层更新商品
            productService.updateProduct(id, product, newImages, keepImageUrls);

            return new Result(200, "商品更新成功", null);

        } catch (IllegalArgumentException e) {
            log.warn("商品更新参数错误 - error: {}", e.getMessage());
            return new Result(400, e.getMessage(), null);
        } catch (Exception e) {
            log.error("商品更新失败 - id: {}, error: {}", id, e.getMessage(), e);
            return new Result(500, "商品更新失败，请稍后重试", null);
        }
    }

    /**
     * 删除商品接口
     * 
     * @param id 商品ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    public Result deleteProduct(@PathVariable Integer id) {
        try {
            log.info("收到删除商品请求 - id: {}", id);
            productService.deleteProduct(id);
            return new Result(200, "商品删除成功", null);
        } catch (IllegalArgumentException e) {
            log.warn("商品删除参数错误 - error: {}", e.getMessage());
            return new Result(400, e.getMessage(), null);
        } catch (Exception e) {
            log.error("商品删除失败 - id: {}, error: {}", id, e.getMessage(), e);
            return new Result(500, "商品删除失败，请稍后重试", null);
        }
    }

    /**
     * 更新商品状态接口
     * PATCH /products/{id}/status
     * 
     * @param id 商品ID
     * @param request 包含 status 字段的请求体
     * @return 更新结果
     */
    @PatchMapping("/{id}/status")
    public Result updateProductStatus(
            @PathVariable Integer id,
            @RequestBody ProductDto.StatusUpdateRequest request) {
        try {
            String status = request.getStatus();
            log.info("收到更新商品状态请求 - id: {}, status: {}", id, status);
            
            productService.updateProductStatus(id, status);
            return new Result(200, "商品状态更新成功", null);
            
        } catch (IllegalArgumentException e) {
            log.warn("商品状态更新参数错误 - error: {}", e.getMessage());
            return new Result(400, e.getMessage(), null);
        } catch (Exception e) {
            log.error("商品状态更新失败 - id: {}, error: {}", id, e.getMessage(), e);
            return new Result(500, "商品状态更新失败，请稍后重试", null);
        }
    }
}
