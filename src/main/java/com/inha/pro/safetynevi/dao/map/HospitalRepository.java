package com.inha.pro.safetynevi.dao.map;

import com.inha.pro.safetynevi.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HospitalRepository extends JpaRepository<Hospital, Long> {

    // [신규] '영업/정상'인 병원만 검색 (병원 체크박스용)
    @Query("SELECT h FROM Hospital h WHERE " +
            "h.operatingStatus = '영업/정상' AND " +
            "h.latitude BETWEEN :swLat AND :neLat AND " +
            "h.longitude BETWEEN :swLng AND :neLng")
    List<Hospital> findOperationalInBounds(
            @Param("swLat") double swLat,
            @Param("swLng") double swLng,
            @Param("neLat") double neLat,
            @Param("neLng") double neLng
    );

    // [신규] '영업/정상'이 아닌 병원만 검색 (기타 체크박스용)
    @Query("SELECT h FROM Hospital h WHERE " +
            "h.operatingStatus IN ('폐업', '휴업', '취소/말소/만료/정지/중지') AND " +
            "h.latitude BETWEEN :swLat AND :neLat AND " +
            "h.longitude BETWEEN :swLng AND :neLng")
    List<Hospital> findNonOperationalInBounds(
            @Param("swLat") double swLat,
            @Param("swLng") double swLng,
            @Param("neLat") double neLat,
            @Param("neLng") double neLng
    );
}