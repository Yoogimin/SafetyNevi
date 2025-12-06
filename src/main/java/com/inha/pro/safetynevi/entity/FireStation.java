package com.inha.pro.safetynevi.entity;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "FIRE_STATION_DETAIL")
@DiscriminatorValue("fire")
@PrimaryKeyJoinColumn(name = "FACILITY_ID")
public class FireStation extends Facility {

    // DB의 PHONE_NUMBER_HQ 컬럼에 실제로는 '주소'가 들어갑니다.
    // Lombok @Getter에 의해 getAddressInPhoneColumn()은 자동 생성됩니다.
    @Column(name = "PHONE_NUMBER_HQ", length = 100)
    private String addressInPhoneColumn;

    @Column(name = "SUB_TYPE", length = 100)
    private String subType;

    // ==============================================================
    // 🛠️ [빌드 오류 해결 및 데이터 보정 메소드]
    // ==============================================================

    /**
     * 1. [빌드 오류 해결]
     * FireStationDetailDto.java 등 기존 코드들이
     * 여전히 getPhoneNumberHq()를 호출하고 있어서 에러가 났습니다.
     * 이를 해결하기 위해 예전 이름으로 메소드를 만들어 데이터를 반환해줍니다.
     */
    public String getPhoneNumberHq() {
        return this.addressInPhoneColumn;
    }

    /**
     * 2. [지도 주소 표시 수정]
     * 부모(Facility)의 address가 아니라,
     * 자식의 addressInPhoneColumn(진짜 주소)을 반환하도록 덮어씁니다.
     */
    @Override
    public String getAddress() {
        return this.addressInPhoneColumn;
    }

    /**
     * 3. [지도 전화번호 표시 수정]
     * 실제 전화번호 데이터는 없으므로 null을 반환하여
     * 화면에 "전화번호 없음"이나 빈 칸으로 나오게 합니다.
     */
    public String getPhoneNumber() {
        return null;
    }
}