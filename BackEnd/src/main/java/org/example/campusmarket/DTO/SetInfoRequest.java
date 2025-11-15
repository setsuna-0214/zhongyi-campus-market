package org.example.campusmarket.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SetInfoRequest {
    @NotBlank
    @Size(min = 1,max = 20)
    private String nickname;

    //用户简介
    @Size(max = 100)
    private String bio;

    @Size(min = 11,max = 11)
    private String phone;

    @Size(max = 100)
    private String address;

    //头像路径
    private String avatar;
}
