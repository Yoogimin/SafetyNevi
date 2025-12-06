package com.inha.pro.safetynevi.dto.map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteDto {
    private Long facilityId;
    private String name;
    private String type;      // shelter, hospital 등
    private double latitude;
    private double longitude;
    
    // 추천 사유 (예: "최단 거리", "최적 수용", "안전 추천")
    private String recommendationType; 
    
    // 계산된 정보
    private double distanceMeter; // 거리 (m)
    private int timeWalk;         // 도보 시간 (분)
    private int timeCar;          // 차량 시간 (분)
    
    // 시설 상세 정보
    private String operatingStatus;
    private Integer maxCapacity;
}