package com.inha.pro.safetynevi.controller.map;

import com.inha.pro.safetynevi.service.map.MapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/map") // 🌟 공통 주소가 /api/map 입니다.
@RequiredArgsConstructor
public class MapApiController {

    private final MapService mapService;

    // 1. 내 장소 조회
    @GetMapping("/my-places")
    public ResponseEntity<?> getMyPlaces(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(mapService.getMyAllPlaces(user.getUsername()));
    }

    // 2. 집/회사 등록
    @PostMapping("/special-place")
    public ResponseEntity<?> saveSpecialPlace(@RequestBody Map<String, Object> payload, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        try {
            String type = (String) payload.get("type");
            String address = (String) payload.get("address");
            Double lat = Double.parseDouble(payload.get("latitude").toString());
            Double lon = Double.parseDouble(payload.get("longitude").toString());
            mapService.saveSpecialPlace(user.getUsername(), type, address, lat, lon);
            return ResponseEntity.ok("saved");
        } catch (Exception e) { return ResponseEntity.badRequest().build(); }
    }

    // 3. 즐겨찾기 추가
    @PostMapping("/favorite")
    public ResponseEntity<?> addFavorite(@RequestBody Map<String, Object> payload, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        try {
            String name = (String) payload.get("name");
            String address = (String) payload.get("address");
            Double lat = Double.parseDouble(payload.get("latitude").toString());
            Double lon = Double.parseDouble(payload.get("longitude").toString());
            mapService.addFavorite(user.getUsername(), name, address, lat, lon);
            return ResponseEntity.ok("added");
        } catch (Exception e) { return ResponseEntity.badRequest().build(); }
    }

    // 4. 장소 삭제
    @DeleteMapping("/place/{id}")
    public ResponseEntity<?> deletePlace(@PathVariable Long id) {
        mapService.deletePlace(id);
        return ResponseEntity.ok("deleted");
    }

    // ==========================================
    // 🌟 [이동됨] 가족/지인 API (이제 주소가 맞습니다!)
    // URL: /api/map/family
    // ==========================================

    @GetMapping("/family")
    public ResponseEntity<?> getFamilyList(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(mapService.getFamilyList(user.getUsername()));
    }

    @PostMapping("/family")
    public ResponseEntity<?> addFamily(@RequestBody Map<String, String> payload, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        try {
            mapService.addFamily(user.getUsername(), payload.get("name"), payload.get("phone"));
            return ResponseEntity.ok("added");
        } catch (Exception e) { return ResponseEntity.badRequest().build(); }
    }

    @DeleteMapping("/family/{id}")
    public ResponseEntity<?> deleteFamily(@PathVariable Long id) {
        mapService.deleteFamily(id);
        return ResponseEntity.ok("deleted");
    }
}