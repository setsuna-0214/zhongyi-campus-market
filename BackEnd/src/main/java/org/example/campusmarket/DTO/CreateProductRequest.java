package org.example.campusmarket.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateProductRequest {
    @NotBlank
    //物品名称
    private String pro_name;

    @NotBlank
    private String price;
    private String discription;
    //物品图片路径
    private String picture;

}
