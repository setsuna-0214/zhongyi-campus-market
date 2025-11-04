package org.example.campusmarket;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.example.campusmarket.config.JwtProperties;
@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class) // 注册 JwtProperties
public class CampusMarketApplication {

	public static void main(String[] args) {
		SpringApplication.run(CampusMarketApplication.class, args);
	}

}
