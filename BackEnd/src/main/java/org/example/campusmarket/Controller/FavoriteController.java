package org.example.campusmarket.Controller;

import org.example.campusmarket.DTO.FavoriteDto;
import org.example.campusmarket.Service.FavoriteService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/favorites")
public class FavoriteController {
    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    //查找收藏商品
    @GetMapping
    public List<FavoriteDto.FavoriteItem> getFavorites(Authentication authentication) {
        Integer userId = (Integer) authentication.getPrincipal();
        return favoriteService.GetFavoritesWithDetails(userId);
    }

    //添加收藏商品
    @PostMapping
    public FavoriteDto.AddResponse addFavorite(@RequestBody FavoriteDto.AddRequest request, Authentication authentication) {
        Integer userId = (Integer) authentication.getPrincipal();
        if (request == null || request.getProductId() == null) {
            return null;
        }
        return favoriteService.AddFavorite(userId, request.getProductId());
    }

    //删除收藏商品（根据商品ID）
    @DeleteMapping("/{id}")
    public FavoriteDto.DeleteResponse removeFavorite(@PathVariable Integer id, Authentication authentication) {
        Integer userId = (Integer) authentication.getPrincipal();
        boolean ok = favoriteService.RemoveFavorite(userId, id);
        return new FavoriteDto.DeleteResponse(ok);
    }

    //根据商品ID取消收藏（可选接口）
    @DeleteMapping("/by-product/{productId}")
    public FavoriteDto.DeleteResponse removeFavoriteByProduct(@PathVariable Integer productId, Authentication authentication) {
        Integer userId = (Integer) authentication.getPrincipal();
        boolean ok = favoriteService.RemoveFavorite(userId, productId);
        return new FavoriteDto.DeleteResponse(ok);
    }
}
