package com.inha.pro.safetynevi.dto.map;

import com.inha.pro.safetynevi.entity.Facility;
import com.inha.pro.safetynevi.entity.Hospital;
import com.inha.pro.safetynevi.entity.Shelter;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class FacilityDto {

    private Long id;
    private String type;
    private String name;
    private double latitude;
    private double longitude;
    private String operatingStatus;
    private Integer maxCapacity; // 🌟 [신규] 수용 인원 필드 추가

    public FacilityDto(Facility facility) {
        this.id = facility.getId();
        this.type = facility.getType();
        this.name = facility.getName();
        this.latitude = facility.getLatitude();
        this.longitude = facility.getLongitude();

        if (facility instanceof Hospital) {
            this.operatingStatus = ((Hospital) facility).getOperatingStatus();
            this.maxCapacity = 0;
        } else if (facility instanceof Shelter) {
            this.operatingStatus = ((Shelter) facility).getOperatingStatus();
            // 🌟 대피소일 경우 수용 인원 저장
            this.maxCapacity = ((Shelter) facility).getMaxCapacity();
        } else {
            this.operatingStatus = "N/A";
            this.maxCapacity = 0;
        }
    }
}