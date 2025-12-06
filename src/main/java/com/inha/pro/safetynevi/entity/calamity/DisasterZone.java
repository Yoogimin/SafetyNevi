package com.inha.pro.safetynevi.entity.calamity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString; // ◀ 1. [신규] ToString 임포트

import java.time.Instant;

@Getter
@Setter
@ToString // ◀ 2. [신규] @ToString 어노테이션 추가
@Entity
@Table(name = "DISASTER_ZONE")
public class DisasterZone {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "disaster_zone_seq")
    @SequenceGenerator(name = "disaster_zone_seq", sequenceName = "DISASTER_ZONE_SEQ", allocationSize = 1)
    private Long id;

    @Column(name = "DISASTER_TYPE", nullable = false, length = 100)
    private String disasterType;

    @Column(name = "LATITUDE")
    private Double latitude;

    @Column(name = "LONGITUDE")
    private Double longitude;

    @Column(name = "RADIUS")
    private Double radius;

    @Column(name = "AREA_NAME", length = 100)
    private String areaName;

    @Column(name = "START_TIME")
    private Instant startTime;

    @Column(name = "EXPIRY_TIME", nullable = false)
    private Instant expiryTime;

    @PrePersist
    protected void onCreate() {
        if (startTime == null) {
            startTime = Instant.now();
        }
    }
}