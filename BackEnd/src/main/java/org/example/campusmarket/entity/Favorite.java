
package org.example.campusmarket.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Favorite {
    private Integer id;
    private Integer user_id;
    private Integer pro_id;
    private Product product;
    private LocalDateTime createdAt;
}