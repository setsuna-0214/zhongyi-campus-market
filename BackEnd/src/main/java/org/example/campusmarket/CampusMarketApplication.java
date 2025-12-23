package org.example.campusmarket;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.example.campusmarket.config.JwtProperties;
import org.example.campusmarket.config.HotnessProperties;

@SpringBootApplication
@EnableConfigurationProperties({JwtProperties.class, HotnessProperties.class})
@EnableScheduling
public class CampusMarketApplication {

	public static void main(String[] args) {
		SpringApplication.run(CampusMarketApplication.class, args);
	}

}
