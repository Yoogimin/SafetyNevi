package com.inha.pro.safetynevi.dao.calamity;

import com.inha.pro.safetynevi.entity.calamity.DisasterZone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface DisasterZoneRepository extends JpaRepository<DisasterZone, Long> {

    /**
     * 현재 시간을 기준으로, 아직 만료되지 않은(활성화된) 모든 재난 구역을 찾습니다.
     * @param currentTime 현재 시간 (Instant.now())
     * @return 활성화된 재난 구역 리스트
     */
    List<DisasterZone> findByExpiryTimeAfter(Instant currentTime);
}