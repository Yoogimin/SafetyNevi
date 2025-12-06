package com.inha.pro.safetynevi.dao.map;

import com.inha.pro.safetynevi.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface FacilityRepository extends JpaRepository<Facility, Long> {
    @Query("SELECT f FROM Facility f WHERE " +
            "f.type = :type AND " +
            "f.latitude BETWEEN :swLat AND :neLat AND " +
            "f.longitude BETWEEN :swLng AND :neLng")
    List<Facility> findFacilitiesInBounds(
            @Param("type") String type,
            @Param("swLat") double swLat,
            @Param("swLng") double swLng,
            @Param("neLat") double neLat,
            @Param("neLng") double neLng
    );

    List<Facility> findByNameContaining(String name);
}