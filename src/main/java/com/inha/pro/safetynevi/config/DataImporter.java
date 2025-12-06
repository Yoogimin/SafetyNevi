package com.inha.pro.safetynevi.config;

// ◀ Entity 임포트
import com.inha.pro.safetynevi.entity.FireStation;
import com.inha.pro.safetynevi.entity.Hospital;
import com.inha.pro.safetynevi.entity.Police;
import com.inha.pro.safetynevi.entity.Shelter;
// ◀ DAO(Repository) 임포트
import com.inha.pro.safetynevi.dao.map.FacilityRepository;
import com.inha.pro.safetynevi.dao.map.FireStationRepository;
import com.inha.pro.safetynevi.dao.map.HospitalRepository;
import com.inha.pro.safetynevi.dao.map.PoliceRepository;
import com.inha.pro.safetynevi.dao.map.ShelterRepository;

import com.opencsv.CSVReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import java.io.InputStreamReader;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataImporter implements CommandLineRunner {

    private final FacilityRepository facilityRepository;
    private final PoliceRepository policeRepository;
    private final FireStationRepository fireStationRepository;
    private final HospitalRepository hospitalRepository;
    private final ShelterRepository shelterRepository;

    @Override
    public void run(String... args) throws Exception {
        if (facilityRepository.count() > 0) {
            log.info("Facility data already exists. Skipping data import.");
            return;
        }
        log.info("Starting CSV data import...");

        // 확인된 인코딩으로 설정
        importPoliceData("data/police_data.csv", "UTF-8");
        importFireStationData("data/fire_station_data.csv", "EUC-KR");
        importHospitalData("data/hospital_data.csv", "EUC-KR");
        importShelterData("data/shelter_data.csv", "UTF-8");

        log.info("========== All facility CSV data imported successfully! ==========");
    }

    // ----- CSV 임포트 메소드 -----

    /**
     * 경찰서 CSV (image_6914c1.png) 기준 (정상)
     */
    private void importPoliceData(String filePath, String encoding) {
        log.info("Importing Police Data from {} (Encoding: {})...", filePath, encoding);
        try {
            List<String[]> records = readCsvFile(filePath, encoding);
            records.stream().skip(1).forEach(row -> {
                try {
                    String facilityName = row[3]; // [3] 관서명
                    if (facilityName == null || facilityName.isBlank()) {
                        log.warn("Skipping row with empty NAME: {}", String.join(",", row));
                        return;
                    }
                    Police newPolice = new Police();
                    newPolice.setName(facilityName);
                    newPolice.setAddress(row[6]); // [6] 주소
                    newPolice.setLatitude(parseDoubleDefault(row[7]));  // [7] 위도 (Y)
                    newPolice.setLongitude(parseDoubleDefault(row[8])); // [8] 경도 (X)
                    newPolice.setPhoneNumber(row[5]); // [5] 전화번호
                    newPolice.setGubun(row[4]); // [4] 구분
                    newPolice.setSidoCheong(row[1]); // [1] 시도청
                    policeRepository.save(newPolice);
                } catch (Exception e) {
                    log.warn("Skipping bad police data row: {}", String.join(",", row), e);
                }
            });
        } catch (Exception e) {
            log.error("Failed to import police data: {}", e.getMessage());
        }
    }

    /**
     * 소방서 CSV (image_7479a8.png) 기준 [수정됨]
     */
    private void importFireStationData(String filePath, String encoding) {
        log.info("Importing Fire Station Data from {} (Encoding: {})...", filePath, encoding);
        try {
            List<String[]> records = readCsvFile(filePath, encoding);

            records.stream().skip(1).forEach(row -> {
                try {
                    // [1] 소방서 및 119안전센터 이름 (B열)
                    String facilityName = row[1];
                    if (facilityName == null || facilityName.isBlank()) {
                        return; // 이름 없으면 건너뜀
                    }

                    FireStation newFireStation = new FireStation();

                    // 1. 기본 정보 (Facility)
                    newFireStation.setName(facilityName);
                    newFireStation.setAddress(row[2]); // [2] 주소 (C열) - 이제 진짜 주소가 들어감

                    // 2. 좌표 정보 (헤더는 X,Y지만 실제 데이터 값에 따라 매핑)
                    // 데이터 예시: X=35.85...(위도), Y=128.62...(경도)
                    newFireStation.setLatitude(parseDoubleDefault(row[5]));  // [5] F열 -> 위도
                    newFireStation.setLongitude(parseDoubleDefault(row[6])); // [6] G열 -> 경도

                    // 3. 상세 정보 (FireStationDetail)
                    // ★ 중요: 엔티티 수정에 따라 'addressInPhoneColumn' 필드에 '전화번호'를 넣습니다.
                    // (DB 컬럼 PHONE_NUMBER_HQ에 실제 전화번호 데이터가 저장됨)
                    newFireStation.setAddressInPhoneColumn(row[4]); // [4] 전화번호 (E열)

                    newFireStation.setSubType(row[7]); // [7] 유형 (H열)

                    fireStationRepository.save(newFireStation);

                } catch (Exception e) {
                    log.warn("Skipping bad fire station data row: {}", String.join(",", row), e);
                }
            });
        } catch (Exception e) {
            log.error("Failed to import fire station data: {}", e.getMessage());
        }
    }

    /**
     * 병원 CSV (image_69151e.png) 기준 (정상)
     */
    private void importHospitalData(String filePath, String encoding) {
        log.info("Importing Hospital Data from {} (Encoding: {})...", filePath, encoding);
        try {
            List<String[]> records = readCsvFile(filePath, encoding);
            records.stream().skip(1).forEach(row -> {
                try {
                    String facilityName = row[1]; // [1] 사업장명
                    if (facilityName == null || facilityName.isBlank()) {
                        log.warn("Skipping row with empty NAME: {}", String.join(",", row));
                        return;
                    }
                    Hospital newHospital = new Hospital();
                    newHospital.setName(facilityName);
                    newHospital.setAddress(row[6]); // [6] 소재지전체주소
                    newHospital.setLatitude(parseDoubleDefault(row[2]));  // [2] 위도 (Y)
                    newHospital.setLongitude(parseDoubleDefault(row[3])); // [3] 경도 (X)
                    newHospital.setPhoneNumber(row[5]); // [5] 소재지전화
                    newHospital.setRoadAddress(row[7]); // [7] 도로명전체주소
                    newHospital.setSubType(row[8]); // [8] 의료기관종별명
                    newHospital.setBedCount(parseIntegerDefault(row[10])); // [10] 병상수
                    newHospital.setOperatingStatus(row[4]); // [4] 영업상태명
                    newHospital.setStaffCount(parseIntegerDefault(row[9])); // [9] 의료인수
                    hospitalRepository.save(newHospital);
                } catch (Exception e) {
                    log.warn("Skipping bad hospital data row: {}", String.join(",", row), e);
                }
            });
        } catch (Exception e) {
            log.error("Failed to import hospital data: {}", e.getMessage());
        }
    }

    /**
     * 대피시설 CSV (image_69155e.png / image_747e27.png) 기준 [수정됨]
     */
    private void importShelterData(String filePath, String encoding) {
        log.info("Importing Shelter Data from {} (Encoding: {})...", filePath, encoding);
        try {
            List<String[]> records = readCsvFile(filePath, encoding);

            records.stream().skip(1).forEach(row -> {
                try {
                    String facilityName = row[5]; // [5] 시설명
                    if (facilityName == null || facilityName.isBlank()) {
                        log.warn("Skipping row with empty NAME: {}", String.join(",", row));
                        return;
                    }
                    Shelter newShelter = new Shelter();
                    newShelter.setName(facilityName);
                    newShelter.setAddress(row[8]); // [8] 소재지전체주소

                    // [수정] W열(22), X열(23) 기준
                    newShelter.setLatitude(parseDoubleDefault(row[22]));  // W열 [22] 위도
                    newShelter.setLongitude(parseDoubleDefault(row[23])); // X열 [23] 경도

                    newShelter.setOperatingStatus(row[4]); // [4] 운영여부
                    newShelter.setAreaM2(parseDoubleDefault(row[11])); // [11] 시설면적
                    newShelter.setMaxCapacity(parseIntegerDefault(row[12])); // [12] 최대수용인원
                    newShelter.setLocationType(row[10]); // [10] 시설위치구분
                    shelterRepository.save(newShelter);
                } catch (Exception e) {
                    log.warn("Skipping bad shelter data row: {}", String.join(",", row), e);
                }
            });
        } catch (Exception e) {
            log.error("Failed to import shelter data: {}", e.getMessage());
        }
    }

    // ----- [필수] 헬퍼(Helper) 메소드 3개 -----

    private List<String[]> readCsvFile(String filePath, String encoding) throws Exception {
        ClassPathResource resource = new ClassPathResource(filePath);
        try (InputStreamReader reader = new InputStreamReader(resource.getInputStream(), encoding);
             CSVReader csvReader = new CSVReader(reader)) {
            return csvReader.readAll();
        }
    }

    private Integer parseIntegerDefault(String value) {
        if (value == null || value.isBlank()) {
            return 0;
        }
        try {
            return (int) Double.parseDouble(value.trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private Double parseDoubleDefault(String value) {
        if (value == null || value.isBlank()) {
            return 0.0;
        }
        try {
            return Double.parseDouble(value.trim());
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}