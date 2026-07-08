package org.example.campusmarket.modules.want.controller;

import lombok.RequiredArgsConstructor;
import org.example.campusmarket.entity.Result;
import org.example.campusmarket.modules.want.dto.WantDto;
import org.example.campusmarket.modules.want.entity.WantRequest;
import org.example.campusmarket.modules.want.service.WantMatchService;
import org.example.campusmarket.modules.want.service.WantService;
import org.example.campusmarket.util.ResultUtil;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 求购模块控制器
 */
@RestController
@RequestMapping("/wants")
@RequiredArgsConstructor
public class WantController {

    private final WantService wantService;
    private final WantMatchService wantMatchService;

    @GetMapping
    public Result list(@RequestParam(required = false) String category,
                       @RequestParam(required = false) String status,
                       @RequestParam(required = false) String keyword,
                       @RequestParam(required = false) Integer userId,
                       @RequestParam(defaultValue = "1") int page,
                       @RequestParam(defaultValue = "10") int pageSize) {
        return ResultUtil.success(wantService.search(category, status, keyword, userId, page, pageSize));
    }

    @GetMapping("/{id}")
    public Result detail(@PathVariable Long id) {
        WantDto.WantItem item = wantService.getDetail(id);
        if (item == null) return ResultUtil.notFound("求购信息不存在");
        return ResultUtil.success(item);
    }

    @PostMapping
    public Result create(@RequestBody WantDto.SaveWantRequest req, Authentication auth) {
        Integer userId = (Integer) auth.getPrincipal();
        WantRequest want = wantService.create(userId, req);
        Map<String, Object> data = new HashMap<>();
        data.put("id", want.getId());
        return ResultUtil.success(data);
    }

    @PutMapping("/{id}")
    public Result update(@PathVariable Long id, @RequestBody WantDto.SaveWantRequest req, Authentication auth) {
        Integer userId = (Integer) auth.getPrincipal();
        WantRequest want = wantService.update(id, userId, req);
        Map<String, Object> data = new HashMap<>();
        data.put("id", want.getId());
        return ResultUtil.success(data);
    }

    @PutMapping("/{id}/close")
    public Result close(@PathVariable Long id, Authentication auth) {
        Integer userId = (Integer) auth.getPrincipal();
        wantService.close(id, userId);
        return ResultUtil.success("已关闭该求购信息");
    }

    @GetMapping("/{id}/matches")
    public Result matches(@PathVariable Long id) {
        List<WantDto.MatchItem> matches = wantMatchService.matchForWant(id);
        return ResultUtil.success(matches);
    }

    @PostMapping("/{id}/refresh-matches")
    public Result refreshMatches(@PathVariable Long id) {
        List<WantDto.MatchItem> matches = wantMatchService.matchForWant(id);
        return ResultUtil.success(matches);
    }
}