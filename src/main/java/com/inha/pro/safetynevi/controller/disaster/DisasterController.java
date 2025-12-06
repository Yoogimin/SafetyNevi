package com.inha.pro.safetynevi.controller.disaster;

import com.inha.pro.safetynevi.entity.calamity.DisasterZone;
import com.inha.pro.safetynevi.service.calamity.DisasterService; // 🌟 Service 사용
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
public class DisasterController {

    private final DisasterService disasterService;

    @GetMapping("/api/disaster-zones")
    public List<DisasterZone> getActiveDisasterZones() {
        return disasterService.findActiveDisasters();
    }
}