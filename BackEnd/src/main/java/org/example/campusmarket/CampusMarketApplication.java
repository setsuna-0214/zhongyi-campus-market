package org.example.campusmarket;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;

// 排除 MyBatis-Plus 自动配置 + Security 无需排除
@SpringBootApplication(exclude = {
		com.baomidou.mybatisplus.autoconfigure.MybatisPlusAutoConfiguration.class // 彻底禁用 MyBatis-Plus 自动配置
})
@MapperScan("org.example.campusmarket.Mapper") // 仅保留 MyBatis 原生 Mapper 扫描
public class CampusMarketApplication {

	// 兜底：确保 ddlApplicationRunner 存在（即使 MyBatis-Plus 被禁用）
	@Bean("ddlApplicationRunner")
	public ApplicationRunner ddlApplicationRunner() {
		return args -> {};
	}

	public static void main(String[] args) {
		SpringApplication.run(CampusMarketApplication.class, args);
	}
}