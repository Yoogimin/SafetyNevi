package com.inha.pro.safetynevi.controller.admin;

import com.inha.pro.safetynevi.entity.calamity.DisasterZone;
import com.inha.pro.safetynevi.entity.report.Report;
import com.inha.pro.safetynevi.service.calamity.DisasterService;
import com.inha.pro.safetynevi.service.member.MemberService;
import com.inha.pro.safetynevi.service.report.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final DisasterService disasterService;
    private final MemberService memberService;

    // 1. 원형 재난 시뮬레이션 생성
    @PostMapping("/simulate")
    public ResponseEntity<DisasterZone> createDisaster(
            @RequestParam double lat, @RequestParam double lon,
            @RequestParam String type, @RequestParam double radius,
            @RequestParam int durationMinutes
    ) {
        DisasterZone zone = disasterService.createCircleDisaster(lat, lon, type, radius, durationMinutes);
        return ResponseEntity.ok(zone);
    }

    // 2. 지역(Polygon) 기반 재난 시뮬레이션 생성
    @PostMapping("/simulate-area")
    public ResponseEntity<DisasterZone> createAreaDisaster(
            @RequestParam String areaName,
            @RequestParam String type,
            @RequestParam int durationMinutes
    ) {
        DisasterZone zone = disasterService.createAreaDisaster(areaName, type, durationMinutes);
        return ResponseEntity.ok(zone);
    }

    // 3. 🌟 [수정] 재난 상황 종료 (try-catch 제거)
    @DeleteMapping("/disaster/{id}")
    public ResponseEntity<String> deleteDisaster(@PathVariable Long id) {
        // 예외 발생 시 GlobalExceptionHandler가 처리하므로 바로 호출
        disasterService.deleteDisaster(id);
        return ResponseEntity.ok("삭제 성공");
    }

    // 4. 🌟 [수정] 회원 강제 탈퇴 (try-catch 제거)
    @DeleteMapping("/member/{userId}")
    public ResponseEntity<String> kickMember(@PathVariable String userId) {
        log.info("--- [Admin] 회원 강제 탈퇴 요청: ID={} ---", userId);

        if("admin".equals(userId)) {
            return ResponseEntity.badRequest().body("관리자 계정은 삭제할 수 없습니다.");
        }

        // 예외 발생 시 GlobalExceptionHandler가 처리함
        memberService.forceWithdraw(userId);
        return ResponseEntity.ok("삭제 성공");
    }
}