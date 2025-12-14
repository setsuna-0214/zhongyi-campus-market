package org.example.campusmarket.Controller;

import org.example.campusmarket.DTO.HomeDto;
import org.example.campusmarket.Service.HomeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/home")
public class HomeController {
    @Autowired
    private HomeService homeService; // 首页数据服务，封装热门与最新列表的获取

    @GetMapping("/hot")
    public List<HomeDto.HomeProduct> getHot(@RequestParam(value = "limit", required = false) Integer limit) {
        // limit：可选的返回条数限制，默认 10 条
        return homeService.getHotProducts(limit == null ? 10 : limit);
    }

    @GetMapping("/latest")
    public List<HomeDto.HomeProduct> getLatest(@RequestParam(value = "limit", required = false) Integer limit) {
        // limit：可选的返回条数限制，默认 10 条
        return homeService.getLatestProducts(limit == null ? 10 : limit);
    }
}