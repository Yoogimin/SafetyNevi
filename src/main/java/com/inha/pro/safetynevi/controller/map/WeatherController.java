package com.inha.pro.safetynevi.controller.map;

import com.inha.pro.safetynevi.dto.map.WeatherDto;
import com.inha.pro.safetynevi.service.map.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono; // ◀ 1. 이 줄을 추가하세요.

@RestController
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    @GetMapping("/api/weather")
    public Mono<WeatherDto> getWeather(
            @RequestParam double lat, // ◀ 2. 이 파라미터가 필요합니다.
            @RequestParam double lon  // ◀ 3. 이 파라미터가 필요합니다.
    ) {
        return weatherService.getWeatherInfo(lat, lon);
    }
}