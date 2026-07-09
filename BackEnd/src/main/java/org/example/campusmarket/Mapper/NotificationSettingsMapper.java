package org.example.campusmarket.Mapper;

import org.apache.ibatis.annotations.*;
import org.example.campusmarket.entity.NotificationSettings;

@Mapper
public interface NotificationSettingsMapper {

    @Select("SELECT user_id, notify_product, notify_order, notify_social " +
            "FROM user_notification_settings WHERE user_id = #{userId}")
    @Results({
            @Result(property = "userId", column = "user_id"),
            @Result(property = "notifyProduct", column = "notify_product"),
            @Result(property = "notifyOrder", column = "notify_order"),
            @Result(property = "notifySocial", column = "notify_social")
    })
    NotificationSettings findByUserId(Integer userId);

    @Insert("INSERT INTO user_notification_settings (user_id, notify_product, notify_order, notify_social) " +
            "VALUES (#{userId}, #{notifyProduct}, #{notifyOrder}, #{notifySocial}) " +
            "ON DUPLICATE KEY UPDATE notify_product = #{notifyProduct}, notify_order = #{notifyOrder}, notify_social = #{notifySocial}")
    void upsert(NotificationSettings settings);
}
