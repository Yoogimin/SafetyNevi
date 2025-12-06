package com.inha.pro.safetynevi.controller.ai;

import com.inha.pro.safetynevi.service.ai.AiClientService;
import com.inha.pro.safetynevi.dto.ai.AiResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ai-test")
public class AiTestController {

    private final AiClientService aiClientService;

    /**
     * AI 분석 테스트 페이지
     * 사용 예:
     *   http://localhost:9090/ai-test/analyze?text=[속보] 부산 전역 화재 발생
     *
     * 주의:
     *   URL에 한글 또는 특수문자(특히 대괄호[])가 있으면 반드시 URL 인코딩 필요
     */
    @GetMapping("/analyze")
    public String analyze(@RequestParam(required = false) String text) {

        // Null 방지
        if (text == null || text.trim().isEmpty()) {
            text = "(입력 없음)";
        }

        // AI 서버 호출
        AiResponseDto result = aiClientService.analyze(text);

        String color = result.getSafety().equals("DANGER") ? "red" : "blue";
        String icon = result.getSafety().equals("DANGER") ? "⚠️" : "✅";

        String html = """
                <html>
                <head>
                    <meta charset='UTF-8'>
                    <title>AI 분석 결과</title>
                    <style>
                        body { font-family: 'Malgun Gothic', sans-serif; padding: 20px; }
                        h2 { font-size: 28px; }
                        ul { font-size: 20px; }
                        li { margin-bottom: 8px; }
                    </style>
                </head>
                <body>
                    <h2> %s AI 분석 결과</h2>
                    <ul>
                        <li><b>재난 유형:</b> %s</li>
                        <li><b>위험 여부:</b> <span style='color:%s;'>%s</span></li>
                        <li><b>신뢰도:</b> %.2f%%</li>
                        <li><b>입력 문장:</b> %s</li>
                    </ul>
                </body>
                </html>
                """;

        return String.format(
                html,
                icon,
                result.getDisasterType(),
                color,
                result.getSafety(),
                result.getConfidence() * 100,
                text
        );
    }
}
