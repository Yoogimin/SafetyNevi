package com.inha.pro.safetynevi.util;

import com.inha.pro.safetynevi.dao.member.AccessLogRepository;
import com.inha.pro.safetynevi.entity.member.AccessLog;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class CustomAuthSuccessHandler implements AuthenticationSuccessHandler {

    private final AccessLogRepository accessLogRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {

        String userId = authentication.getName();
        String ip = ClientUtils.getRemoteIP(request);
        String rawUA = request.getHeader("User-Agent");
        String simpleUA = ClientUtils.getBrowserInfo(rawUA);

        AccessLog log = AccessLog.builder()
                .userId(userId)
                .accessType("LOGIN")
                .ipAddress(ip)
                .userAgent(simpleUA)
                .build();
        accessLogRepository.save(log);

        response.sendRedirect("/");
    }
}
