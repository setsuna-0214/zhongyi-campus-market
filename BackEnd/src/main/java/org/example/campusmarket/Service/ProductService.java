package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.ProductDto;
import org.example.campusmarket.Mapper.ProductMapper;
import org.example.campusmarket.entity.Product;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Map;
import java.util.stream.Collectors;

// 商品服务层，处理商品相关的业务逻辑
// 包括搜索、详情查询、关联商品推荐、图片管理等
@Service
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    @Autowired
    private ProductMapper productMapper;

    @Autowired
    private ImageService imageService;

    @Autowired
    private ProductHotnessService productHotnessService;

    // 搜索商品的核心业务方法
    // keyword: 搜索关键词
    // category: 分类过滤
    // location: 地点过滤
    // status: 状态过滤
    // priceMin/priceMax: 价格区间
    // sort: 排序方式
    // page/pageSize: 分页参数
    // Requirements: 2.1 - 热度排序时从 Redis 获取浏览量
    public ProductDto.ProductListResponse searchProducts(String keyword, String category, String location, 
                                                         String status, Double priceMin, Double priceMax, 
                                                         String sort, int page, int pageSize) {
        // 计算分页偏移量 (Offset)
        int offset = (page - 1) * pageSize;
        
        // 调用 Mapper 查询商品列表
        List<ProductDto.ProductDetail> items = productMapper.searchProducts(keyword, category, location, status, priceMin, priceMax, sort, offset, pageSize);
        
        // 调用 Mapper 查询符合条件的总数
        long total = productMapper.countProducts(keyword, category, location, status, priceMin, priceMax);
        
        // 对查询结果进行后处理：填充图片列表和卖家信息结构
        if (items != null) {
            items.forEach(this::populateDetails);
            
            // 热度排序时从 Redis 获取实时浏览量并重新排序
            // Requirements: 2.1 - 热度排序时从 Redis 获取浏览量
            if ("popular".equals(sort) && !items.isEmpty()) {
                items = sortByRedisHotness(items);
            } else if (!items.isEmpty()) {
                // 非热度排序时，也需要填充 Redis 中的实时浏览量
                fillRedisViewCounts(items);
            }
        } else {
            items = new ArrayList<>();
        }
        
        // 返回包含列表和总数的响应对象
        return new ProductDto.ProductListResponse(items, total);
    }
    
    /**
     * 使用 Redis 中的实时浏览量对商品列表进行热度排序
     * Requirements: 2.1
     */
    private List<ProductDto.ProductDetail> sortByRedisHotness(List<ProductDto.ProductDetail> items) {
        // 获取所有商品ID
        List<Integer> productIds = items.stream()
                .map(ProductDto.ProductDetail::getId)
                .collect(Collectors.toList());
        
        // 批量获取 Redis 中的实时浏览量
        Map<Integer, Long> viewCounts = productHotnessService.getViewCounts(productIds);
        
        // 更新每个商品的浏览量并按热度降序排序
        for (ProductDto.ProductDetail item : items) {
            Long viewCount = viewCounts.getOrDefault(item.getId(), 0L);
            item.setViews(viewCount.intValue());
        }
        
        // 按浏览量降序排序
        return items.stream()
                .sorted(Comparator.comparingInt(ProductDto.ProductDetail::getViews).reversed())
                .collect(Collectors.toList());
    }
    
    /**
     * 填充商品列表的 Redis 实时浏览量
     */
    private void fillRedisViewCounts(List<ProductDto.ProductDetail> items) {
        List<Integer> productIds = items.stream()
                .map(ProductDto.ProductDetail::getId)
                .collect(Collectors.toList());
        
        Map<Integer, Long> viewCounts = productHotnessService.getViewCounts(productIds);
        
        for (ProductDto.ProductDetail item : items) {
            Long viewCount = viewCounts.getOrDefault(item.getId(), 0L);
            item.setViews(viewCount.intValue());
        }
    }

    // 获取单个商品详情的业务方法
    // id: 商品ID
    // 同时增加浏览量并从 Redis 获取实时浏览量
    // Requirements: 1.1, 4.1
    public ProductDto.ProductDetail getProductDetail(Integer id) {
        log.debug("getProductDetail 被调用，商品ID: {}", id);
        ProductDto.ProductDetail detail = productMapper.getProductDetail(id);
        if (detail != null) {
            // 同样需要填充图片和卖家信息
            populateDetails(detail);
            
            // 增加商品浏览量（使用带防重复机制的方法）
            // Requirements: 1.1 - 用户访问商品详情页时自动增加浏览量
            // 使用时间戳作为 requestId，防止短时间内重复计数
            String requestId = String.valueOf(System.currentTimeMillis() / 1000); // 1秒内的请求视为同一请求
            productHotnessService.incrementViewCountSafe(id, requestId);
            
            // 从 Redis 获取实时浏览量填充到返回结果
            // Requirements: 4.1 - 返回 Redis 中的实时 View_Count
            Long viewCount = productHotnessService.getViewCount(id);
            detail.setViews(viewCount != null ? viewCount.intValue() : 0);
        }
        return detail;
    }

    // 获取相关商品推荐的业务方法
    // id: 当前商品ID (用于排除自身)
    public List<ProductDto.ProductDetail> getRelatedProducts(Integer id) {
        // 先获取当前商品信息以确定分类
        ProductDto.ProductDetail current = productMapper.getProductDetail(id);
        if (current == null) {
             return new ArrayList<>();
        }
        
        // 获取当前商品的分类
        String category = current.getCategory();
        if (category == null) {
            return new ArrayList<>();
        }

        // 查询同分类下的其他商品
        List<ProductDto.ProductDetail> related = productMapper.getRelatedProducts(category, id);
        if (related != null) {
            related.forEach(this::populateDetails);
        } else {
            related = new ArrayList<>();
        }
        return related;
    }




    /**
     * 创建商品并上传图片
     * 
     * @param product 商品信息
     * @param images 商品图片数组（最多9张）
     * @return 创建的商品ID
     * @throws IllegalArgumentException 如果图片数量超过9张
     */
    public Integer createProduct(Product product, MultipartFile[] images) {
        log.info("开始创建商品 - name: {}, imageCount: {}", 
                 product.getPro_name(), images != null ? images.length : 0);

        // 1. 验证图片数量
        if (images != null && images.length > 9) {
            throw new IllegalArgumentException("商品图片数量不能超过9张，当前数量：" + images.length);
        }

        // 2. 上传商品图片
        List<String> imageUrls = new ArrayList<>();
        if (images != null && images.length > 0) {
            for (MultipartFile image : images) {
                if (image != null && !image.isEmpty()) {
                    try {
                        String url = imageService.uploadImage(image, "products");
                        imageUrls.add(url);
                        log.debug("商品图片上传成功 - url: {}", url);
                    } catch (Exception e) {
                        log.error("商品图片上传失败 - filename: {}, error: {}", 
                                  image.getOriginalFilename(), e.getMessage());
                        // 如果部分图片上传失败，清理已上传的图片
                        if (!imageUrls.isEmpty()) {
                            imageService.deleteImages(imageUrls);
                        }
                        throw new RuntimeException("商品图片上传失败：" + e.getMessage(), e);
                    }
                }
            }
        }

        // 3. 将图片URL列表转换为逗号分隔的字符串
        String pictureUrls = String.join(",", imageUrls);
        product.setPicture(pictureUrls);

        // 4. 保存商品到数据库
        try {
            productMapper.insertProduct(product);
            log.info("商品创建成功 - id: {}, name: {}, imageCount: {}", 
                     product.getPro_id(), product.getPro_name(), imageUrls.size());
            return product.getPro_id();
        } catch (Exception e) {
            log.error("商品保存到数据库失败 - error: {}", e.getMessage());
            // 如果数据库保存失败，清理已上传的图片
            if (!imageUrls.isEmpty()) {
                imageService.deleteImages(imageUrls);
            }
            throw new RuntimeException("商品创建失败：" + e.getMessage(), e);
        }
    }




    /**
     * 删除商品及其关联的所有图片
     * 
     * @param productId 商品ID
     */
    public void deleteProduct(Integer productId) {
        log.info("开始删除商品 - id: {}", productId);

        // 1. 获取商品信息
        Product product = productMapper.findProductBasicById(productId);
        if (product == null) {
            log.warn("商品不存在 - id: {}", productId);
            throw new IllegalArgumentException("商品不存在");
        }

        // 2. 删除商品图片
        if (product.getPicture() != null && !product.getPicture().isEmpty()) {
            List<String> imageUrls = Arrays.asList(product.getPicture().split(","));
            imageService.deleteImages(imageUrls);
            log.info("商品图片删除完成 - productId: {}, imageCount: {}", productId, imageUrls.size());
        }

        // 3. 删除商品记录
        productMapper.deleteProduct(productId);
        log.info("商品删除成功 - id: {}", productId);
    }




    /**
     * 更新商品信息和图片
     * 
     * @param productId 商品ID
     * @param product 更新的商品信息
     * @param newImages 新的商品图片（可选）
     * @param keepImageUrls 保留的旧图片URL列表（可选）
     */
    public void updateProduct(Integer productId, Product product, 
                             MultipartFile[] newImages, List<String> keepImageUrls) {
        log.info("开始更新商品 - id: {}, newImageCount: {}, keepImageCount: {}", 
                 productId, newImages != null ? newImages.length : 0, 
                 keepImageUrls != null ? keepImageUrls.size() : 0);

        // 1. 获取当前商品信息
        Product existingProduct = productMapper.findProductBasicById(productId);
        if (existingProduct == null) {
            throw new IllegalArgumentException("商品不存在");
        }

        // 2. 获取当前所有图片URL
        List<String> currentImageUrls = new ArrayList<>();
        if (existingProduct.getPicture() != null && !existingProduct.getPicture().isEmpty()) {
            currentImageUrls = Arrays.asList(existingProduct.getPicture().split(","));
        }

        // 3. 上传新图片
        List<String> newImageUrls = new ArrayList<>();
        if (newImages != null && newImages.length > 0) {
            for (MultipartFile image : newImages) {
                if (image != null && !image.isEmpty()) {
                    try {
                        String url = imageService.uploadImage(image, "products");
                        newImageUrls.add(url);
                    } catch (Exception e) {
                        log.error("新图片上传失败 - error: {}", e.getMessage());
                        // 清理已上传的新图片
                        if (!newImageUrls.isEmpty()) {
                            imageService.deleteImages(newImageUrls);
                        }
                        throw new RuntimeException("图片上传失败：" + e.getMessage(), e);
                    }
                }
            }
        }

        // 4. 合并保留的旧图片和新上传的图片
        List<String> finalImageUrls = new ArrayList<>();
        if (keepImageUrls != null) {
            finalImageUrls.addAll(keepImageUrls);
        }
        finalImageUrls.addAll(newImageUrls);

        // 5. 验证图片总数不超过9张
        if (finalImageUrls.size() > 9) {
            // 清理新上传的图片
            if (!newImageUrls.isEmpty()) {
                imageService.deleteImages(newImageUrls);
            }
            throw new IllegalArgumentException("商品图片总数不能超过9张，当前数量：" + finalImageUrls.size());
        }

        // 6. 删除未保留的旧图片
        List<String> imagesToDelete = currentImageUrls.stream()
            .filter(url -> keepImageUrls == null || !keepImageUrls.contains(url))
            .collect(Collectors.toList());
        
        if (!imagesToDelete.isEmpty()) {
            imageService.deleteImages(imagesToDelete);
            log.info("删除未使用的旧图片 - count: {}", imagesToDelete.size());
        }

        // 7. 更新商品信息
        product.setPro_id(productId);
        product.setPicture(String.join(",", finalImageUrls));
        productMapper.updateProduct(product);
        
        log.info("商品更新成功 - id: {}, finalImageCount: {}", productId, finalImageUrls.size());
    }

    // 私有辅助方法：填充商品详情中的复杂字段
    // 将数据库扁平化的查询结果转换为嵌套对象结构
    private void populateDetails(ProductDto.ProductDetail product) {
        // 处理图片：将逗号分隔的图片字符串转为列表
        if (product.getTempImage() != null && !product.getTempImage().isEmpty()) {
            // 支持多图片，用逗号分隔
            String[] imageArray = product.getTempImage().split(",");
            product.setImages(Arrays.asList(imageArray));
        } else {
            product.setImages(new ArrayList<>());
        }
        
        // 处理卖家信息：将扁平的 tempSeller* 字段封装到 SellerInfo 对象中
        if (product.getTempSellerId() != null) {
            ProductDto.SellerInfo seller = new ProductDto.SellerInfo(
                product.getTempSellerId(),
                product.getTempSellerName(),
                product.getTempSellerAvatar(),
                product.getTempSellerRating()
            );
            product.setSeller(seller);
        }
    }

    /**
     * 更新商品状态
     * 
     * @param productId 商品ID
     * @param status 新状态，如 "在售", "已下架", "已售出"
     */
    public void updateProductStatus(Integer productId, String status) {
        log.info("更新商品状态 - id: {}, status: {}", productId, status);
        
        // 验证商品是否存在
        Product product = productMapper.findProductBasicById(productId);
        if (product == null) {
            throw new IllegalArgumentException("商品不存在");
        }
        
        // 验证状态值
        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("状态不能为空");
        }
        
        // 更新状态
        productMapper.updateProductStatus(productId, status);
        log.info("商品状态更新成功 - id: {}, status: {}", productId, status);
    }
}
