package com.inha.pro.safetynevi.controller.admin;

import com.inha.pro.safetynevi.service.dashboard.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AdminRestController {

    private final DashboardService dsvc; // final 붙여야 RequiredArgsConstructor 작동

    // dashboardChart
    @PostMapping("/dashboardChart")
    public Map<String, Object> dashboardChart() {
        // Service에서 사용자 정보를 집계한 Map을 받아옴
        return dsvc.dashboardChart();
    }
}