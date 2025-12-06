package com.inha.pro.safetynevi.service.ai;

import com.inha.pro.safetynevi.dto.ai.AiRequestDto;
import com.inha.pro.safetynevi.dto.ai.AiResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiClientService {

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String AI_URL = "http://localhost:8000/predict";

    public AiResponseDto analyze(String text) {
        AiRequestDto req = new AiRequestDto(text);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<AiRequestDto> entity = new HttpEntity<>(req, headers);

        try {
            ResponseEntity<AiResponseDto> response =
                    restTemplate.postForEntity(AI_URL, entity, AiResponseDto.class);

            return response.getBody();

        } catch (Exception e) {
            log.error("🔥 AI 서버 호출 실패: {}", e.getMessage());
            return new AiResponseDto("UNKNOWN", "SAFE", 0.0);
        }
    }

    public boolean isCritical(String text) {
        AiResponseDto result = analyze(text);
        return "DANGER".equalsIgnoreCase(result.getSafety());
    }
}
