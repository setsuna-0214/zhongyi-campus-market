package org.example.campusmarket.modules.want.service;

import lombok.RequiredArgsConstructor;
import org.example.campusmarket.modules.admin.dto.AdminDto;
import org.example.campusmarket.modules.want.dto.WantDto;
import org.example.campusmarket.modules.want.entity.WantRequest;
import org.example.campusmarket.modules.want.mapper.WantMapper;
import org.example.campusmarket.modules.want.repository.WantRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 求购业务服务
 */
@Service
@RequiredArgsConstructor
public class WantService {

    private static final String WANT_NOT_FOUND = "求购信息不存在";

    private final WantRequestRepository wantRequestRepository;
    private final WantMapper wantMapper;

    @Transactional(readOnly = true)
    public WantDto.WantPageResult search(String category, String status, String keyword, Integer userId, int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        List<WantDto.WantItem> items = wantMapper.searchWants(category, status, keyword, userId, offset, pageSize);
        long total = wantMapper.countWants(category, status, keyword, userId);
        return new WantDto.WantPageResult(items, total, page, pageSize);
    }

    @Transactional(readOnly = true)
    public WantDto.WantItem getDetail(Long id) {
        return wantMapper.getWantDetail(id);
    }

    @Transactional
    public WantRequest create(Integer userId, WantDto.SaveWantRequest req) {
        WantRequest want = new WantRequest();
        want.setUserId(userId);
        want.setTitle(req.getTitle());
        want.setDescription(req.getDescription());
        want.setCategory(req.getCategory());
        want.setMinPrice(req.getMinPrice());
        want.setMaxPrice(req.getMaxPrice());
        want.setKeywords(req.getKeywords());
        want.setExpectedCondition(req.getExpectedCondition());
        want.setUrgency(req.getUrgency());
        want.setStatus("OPEN");
        return wantRequestRepository.save(want);
    }

    @Transactional
    public WantRequest update(Long id, Integer userId, WantDto.SaveWantRequest req) {
        WantRequest want = wantRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(WANT_NOT_FOUND));
        if (!want.getUserId().equals(userId)) {
            throw new RuntimeException("无权限修改该求购信息");
        }
        want.setTitle(req.getTitle());
        want.setDescription(req.getDescription());
        want.setCategory(req.getCategory());
        want.setMinPrice(req.getMinPrice());
        want.setMaxPrice(req.getMaxPrice());
        want.setKeywords(req.getKeywords());
        want.setExpectedCondition(req.getExpectedCondition());
        want.setUrgency(req.getUrgency());
        return wantRequestRepository.save(want);
    }

    @Transactional
    public void close(Long id, Integer userId) {
        WantRequest want = wantRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(WANT_NOT_FOUND));
        if (!want.getUserId().equals(userId)) {
            throw new RuntimeException("无权限关闭该求购信息");
        }
        want.setStatus("CLOSED");
        wantRequestRepository.save(want);
    }

    @Transactional
    public void adminClose(Long id) {
        WantRequest want = wantRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(WANT_NOT_FOUND));
        want.setStatus("CLOSED");
        wantRequestRepository.save(want);
    }

    @Transactional
    public void adminRestore(Long id) {
        WantRequest want = wantRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(WANT_NOT_FOUND));
        want.setStatus("OPEN");
        wantRequestRepository.save(want);
    }

    @Transactional(readOnly = true)
    public AdminDto.PageResult<AdminDto.AdminWantItem> adminList(int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        List<AdminDto.AdminWantItem> items = wantMapper.listAdminWants(offset, pageSize);
        long total = wantMapper.countAdminWants();
        return new AdminDto.PageResult<>(items, total, page, pageSize);
    }
}