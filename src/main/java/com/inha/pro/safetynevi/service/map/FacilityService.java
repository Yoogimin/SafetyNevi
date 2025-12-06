package com.inha.pro.safetynevi.service.map;

import com.inha.pro.safetynevi.entity.Facility;
import com.inha.pro.safetynevi.dao.map.*; // 5개 Repository 모두 임포트
import com.inha.pro.safetynevi.dto.map.FacilityDto;
// (상세 DTO 임포트 ...)
import com.inha.pro.safetynevi.entity.FireStation;
import com.inha.pro.safetynevi.entity.Hospital;
import com.inha.pro.safetynevi.entity.Police;
import com.inha.pro.safetynevi.entity.Shelter;
import com.inha.pro.safetynevi.dto.map.FireStationDetailDto;
import com.inha.pro.safetynevi.dto.map.HospitalDetailDto;
import com.inha.pro.safetynevi.dto.map.PoliceDetailDto;
import com.inha.pro.safetynevi.dto.map.ShelterDetailDto;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList; // ◀ List 임포트
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FacilityService {

    // [수정] 모든 Repository 주입
    private final FacilityRepository facilityRepository;
    private final HospitalRepository hospitalRepository;
    private final ShelterRepository shelterRepository;

    /**
     * [수정] type에 따라 검색 로직을 분기
     */
    public List<FacilityDto> findFacilitiesInBounds(
            String type, double swLat, double swLng, double neLat, double neLng) {

        List<Facility> facilities = new ArrayList<>();

        switch (type) {
            case "police":
                // 경찰서는 상태값이 없으므로 기존 로직 사용
                facilities.addAll(facilityRepository.findFacilitiesInBounds("police", swLat, swLng, neLat, neLng));
                break;
            case "fire":
                // 소방서도 상태값이 없으므로 기존 로직 사용
                facilities.addAll(facilityRepository.findFacilitiesInBounds("fire", swLat, swLng, neLat, neLng));
                break;
            case "hospital":
                // 병원은 '운영중'인 시설만 검색
                facilities.addAll(hospitalRepository.findOperationalInBounds(swLat, swLng, neLat, neLng));
                break;
            case "shelter":
                // 대피소는 '사용중'인 시설만 검색
                facilities.addAll(shelterRepository.findOperationalInBounds(swLat, swLng, neLat, neLng));
                break;
            case "etc":
                // 기타는 '운영중이 아닌' 병원과 대피소를 모두 검색
                facilities.addAll(hospitalRepository.findNonOperationalInBounds(swLat, swLng, neLat, neLng));
                facilities.addAll(shelterRepository.findNonOperationalInBounds(swLat, swLng, neLat, neLng));
                break;
        }

        // 2. 조회된 Entity 목록을 FacilityDto 목록으로 변환
        return facilities.stream()
                .map(FacilityDto::new) // 생성자가 알아서 operatingStatus를 채워줌
                .collect(Collectors.toList());
    }

    /**
     * [수정] 상세 정보 조회를 위해 Entity 경로 수정
     */
    public Object findDetailById(Long id) {
        Facility facility = facilityRepository.findById(id)
                .orElse(null);

        if (facility == null) {
            return null;
        }

        if (facility instanceof Police) {
            return new PoliceDetailDto((Police) facility);
        } else if (facility instanceof FireStation) {
            return new FireStationDetailDto((FireStation) facility);
        } else if (facility instanceof Hospital) {
            return new HospitalDetailDto((Hospital) facility);
        } else if (facility instanceof Shelter) {
            return new ShelterDetailDto((Shelter) facility);
        }

        return new FacilityDto(facility);
    }

    // [신규] 시설 이름 검색 (Controller에서 로직 이동)
    public List<Facility> searchFacilitiesByName(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        // Repository 호출
        return facilityRepository.findByNameContaining(keyword.trim());
    }
}