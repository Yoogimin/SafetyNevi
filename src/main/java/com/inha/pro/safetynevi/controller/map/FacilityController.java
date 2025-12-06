package com.inha.pro.safetynevi.controller.map;

import com.inha.pro.safetynevi.dto.map.FacilityDto;
import com.inha.pro.safetynevi.entity.Facility;
import com.inha.pro.safetynevi.service.map.FacilityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/facilities")
public class FacilityController {

    private final FacilityService facilityService;
    // 🌟 Repository 제거됨

    // 1. 지도 범위 내 시설 조회
    @GetMapping
    public ResponseEntity<List<FacilityDto>> getFacilitiesInBounds(
            @RequestParam String type,
            @RequestParam double swLat, @RequestParam double swLng,
            @RequestParam double neLat, @RequestParam double neLng
    ) {
        return ResponseEntity.ok(facilityService.findFacilitiesInBounds(type, swLat, swLng, neLat, neLng));
    }

    // 2. 시설 상세 조회
    @GetMapping("/detail/{id}")
    public ResponseEntity<?> getFacilityDetail(@PathVariable Long id) {
        Object detailDto = facilityService.findDetailById(id);
        return (detailDto != null) ? ResponseEntity.ok(detailDto) : ResponseEntity.notFound().build();
    }

    // 3. 시설명 검색 API (리팩토링됨)
    @GetMapping("/search")
    public ResponseEntity<List<Facility>> searchFacilities(@RequestParam String keyword) {
        log.info("시설 검색 요청: keyword={}", keyword);
        // 🌟 서비스 호출로 변경
        return ResponseEntity.ok(facilityService.searchFacilitiesByName(keyword));
    }
}