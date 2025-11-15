package org.example.campusmarket.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Product {
    private Integer pro_id;
    private String  pro_name;
    private String  price;
    //物品是否售出
    private boolean is_seal;

    private String discription;
    //物品图片路径
    private String picture;
    //售出人
    private Integer saler_id;
}
