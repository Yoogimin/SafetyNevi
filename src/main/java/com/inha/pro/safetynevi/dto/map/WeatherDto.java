package com.inha.pro.safetynevi.dto.map;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WeatherDto {
    private String address;
    private String temp; // 온도 (예: "16.3")
    private String weatherStatus; // 날씨 상태 (예: "맑음", "흐림", "비")
    private String weatherIcon; // ◀ [추가] 날씨 아이콘 파일명 (예: "sunny.png")
}