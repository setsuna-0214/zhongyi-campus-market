package org.example.campusmarket.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Product {
    @JsonProperty("id")
    private Integer pro_id;
    
    @JsonProperty("title")
    private String  pro_name;
    
    private String  price;
    
    //物品是否售出
    private boolean is_seal;

    @JsonProperty("description")
    private String discription;
    
    //物品图片路径
    @JsonProperty("image")
    private String picture;
    
    //售出人
    private Integer saler_id;
}
