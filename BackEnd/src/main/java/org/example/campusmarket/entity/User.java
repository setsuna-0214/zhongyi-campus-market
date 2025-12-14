package org.example.campusmarket.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@AllArgsConstructor
@NoArgsConstructor
//定义用户实体类
public class User {
    @JsonProperty("id")
    private Integer user_id;
    private String username;

    private String email;
    private String password;

}
