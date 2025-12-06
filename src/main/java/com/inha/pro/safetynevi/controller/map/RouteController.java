package com.inha.pro.safetynevi.controller.map;

import com.fasterxml.jackson.databind.JsonNode;
import com.inha.pro.safetynevi.dto.map.RouteDto;
import com.inha.pro.safetynevi.service.map.RouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/route")
@RequiredArgsConstructor
public class RouteController {

    private final RouteService routeService;

    @GetMapping("/recommend")
    public ResponseEntity<List<RouteDto>> getRecommendedRoutes(
            @RequestParam double lat,
            @RequestParam double lon
    ) {
        return ResponseEntity.ok(routeService.getOptimalShelters(lat, lon));
    }

    @GetMapping("/path")
    public ResponseEntity<?> getRoutePath(
            @RequestParam double startLat, @RequestParam double startLon,
            @RequestParam double endLat, @RequestParam double endLon
    ) {
        JsonNode routeData = routeService.getKakaoRoute(startLat, startLon, endLat, endLon);
        if (routeData == null) {
            return ResponseEntity.status(500).body("길찾기 실패");
        }
        return ResponseEntity.ok(routeData);
    }
}