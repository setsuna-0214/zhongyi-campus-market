package org.example.campusmarket.Service;

import org.example.campusmarket.DTO.CartDto;
import org.example.campusmarket.Mapper.CartMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CartService {
    @Autowired
    private CartMapper cartMapper;

    public boolean AddToCart(Integer userId, Integer productId, Integer quantity) {
        if (userId == null || productId == null || quantity == null || quantity <= 0) {
            return false;
        }
        int exists = cartMapper.countByUserAndProduct(userId, productId);
        if (exists > 0) {
            return cartMapper.incrementCartItem(userId, productId, quantity) == 1;
        }
        return cartMapper.insertCartItem(userId, productId, quantity) == 1;
    }

    @Transactional
    public boolean BatchAddToCart(Integer userId, List<CartDto.Item> items) {
        if (userId == null || items == null || items.isEmpty()) {
            return false;
        }
        for (CartDto.Item item : items) {
            if (item == null || item.getProductId() == null || item.getQuantity() == null || item.getQuantity() <= 0) {
                return false;
            }
            boolean ok = AddToCart(userId, item.getProductId(), item.getQuantity());
            if (!ok) {
                return false;
            }
        }
        return true;
    }
}