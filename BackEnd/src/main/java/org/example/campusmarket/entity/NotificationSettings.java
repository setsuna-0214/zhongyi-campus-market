package org.example.campusmarket.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificationSettings {
    private Integer userId;
    private Boolean notifyProduct;
    private Boolean notifyOrder;
    private Boolean notifySocial;
}
