package com.inha.pro.safetynevi.service.map;

import com.fasterxml.jackson.databind.JsonNode;
import com.inha.pro.safetynevi.dto.map.WeatherDto;
import com.inha.pro.safetynevi.util.map.GpsConverter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeatherService {

    private final GpsConverter gpsConverter;
    private final WebClient webClient = WebClient.create();

    @Value("${api.kma.serviceKey}")
    private String kmaServiceKey;

    @Value("${api.kakao.restKey}")
    private String kakaoRestKey;

    public Mono<WeatherDto> getWeatherInfo(double lat, double lon) {

        Mono<String> addressMono = getAddressFromKakao(lat, lon);
        GpsConverter.LatXLngY grid = gpsConverter.convertGpsToGrid(lat, lon);
        Mono<JsonNode> weatherMono = getKmaWeather(grid.x, grid.y);

        return Mono.zip(addressMono, weatherMono)
                .map(tuple -> {
                    String address = tuple.getT1();
                    JsonNode weatherData = tuple.getT2();

                    log.info("기상청 API 원본 응답: {}", weatherData.toString());

                    Map<String, String> weatherMap = parseKmaWeather(weatherData);

                    String weatherStatus = combineWeatherStatus(
                            weatherMap.getOrDefault("PTY", "0"),
                            weatherMap.getOrDefault("SKY", "0")
                    );

                    return WeatherDto.builder()
                            .address(address)
                            .temp(weatherMap.getOrDefault("T1H", "N/A"))
                            .weatherStatus(weatherStatus)
                            .build();
                });
    }

    private Mono<String> getAddressFromKakao(double lat, double lon) {
        String url = "https://dapi.kakao.com/v2/local/geo/coord2address.json?x=" + lon + "&y=" + lat;
        return webClient.get()
                .uri(url)
                .header("Authorization", "KakaoAK " + kakaoRestKey)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(jsonNode -> {
                    try {
                        JsonNode doc = jsonNode.get("documents").get(0).get("address");
                        return doc.get("region_2depth_name").asText() + " " + doc.get("region_3depth_name").asText();
                    } catch (Exception e) {
                        log.error("Kakao 주소 변환 실패", e);
                        return "주소정보 없음";
                    }
                });
    }

    private Mono<JsonNode> getKmaWeather(int nx, int ny) {
        LocalDateTime now = LocalDateTime.now().minusMinutes(30);
        String baseDate = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String baseTime = now.format(DateTimeFormatter.ofPattern("HH00"));

        String url = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst" +
                "?serviceKey=" + kmaServiceKey +
                "&pageNo=1&numOfRows=10" +
                "&dataType=JSON" +
                "&base_date=" + baseDate +
                "&base_time=" + baseTime +
                "&nx=" + nx +
                "&ny=" + ny;

        return webClient.get().uri(url).retrieve().bodyToMono(JsonNode.class);
    }

    private Map<String, String> parseKmaWeather(JsonNode weatherData) {
        Map<String, String> map = new HashMap<>();
        try {
            JsonNode items = weatherData.get("response").get("body").get("items").get("item");
            for (JsonNode item : items) {
                String category = item.get("category").asText();
                String value = item.get("obsrValue").asText();

                if (category.equals("T1H") || category.equals("SKY") || category.equals("PTY")) {
                    map.put(category, value);
                }
            }
        } catch (Exception e) { log.error("기상청 날씨 파싱 실패", e); }
        return map;
    }

    private String combineWeatherStatus(String ptyCode, String skyCode) {
        // 1. 강수(비/눈) 상태 우선 체크
        switch (ptyCode) {
            case "1": return "비";
            case "2": return "비/눈";
            case "3": return "눈";
            case "5": return "빗방울";
            case "6": return "빗방울/눈날림";
            case "7": return "눈날림";
            case "0":
            default:
                break;
        }

        // 2. 비가 안 올 때, 하늘 상태 체크
        return switch (skyCode) {
            case "1" -> "맑음";
            case "3" -> "구름많음";
            case "4" -> "흐림";
            // [수정] "0"일 때 "맑음" 반환
            case "0" -> "맑음";
            // 그 외 모든 경우(default) "맑음" 반환
            default -> "맑음";
        };
    }
}