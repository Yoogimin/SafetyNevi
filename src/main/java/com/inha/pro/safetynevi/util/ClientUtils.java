package com.inha.pro.safetynevi.util;

import jakarta.servlet.http.HttpServletRequest;

public class ClientUtils {

    /**
     * 클라이언트의 실제 IP 주소를 추출합니다.
     * (프록시, 로드밸런서, IPv6 로컬호스트 대응)
     */
    public static String getRemoteIP(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null) ip = request.getHeader("Proxy-Client-IP");
        if (ip == null) ip = request.getHeader("WL-Proxy-Client-IP");
        if (ip == null) ip = request.getHeader("HTTP_CLIENT_IP");
        if (ip == null) ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        if (ip == null) ip = request.getRemoteAddr();

        // IPv6 로컬호스트 변환
        if ("0:0:0:0:0:0:0:1".equals(ip)) {
            return "127.0.0.1";
        }
        return ip;
    }

    /**
     * 복잡한 User-Agent 문자열을 보기 좋게 파싱합니다.
     * 예: "Mozilla/5.0 (Windows NT 10.0...)" -> "Windows 10 / Chrome"
     */
    public static String getBrowserInfo(String userAgent) {
        if (userAgent == null || userAgent.isEmpty()) return "Unknown";

        String os = "Unknown OS";
        String browser = "Unknown Browser";

        // 1. OS 확인
        if (userAgent.contains("Windows NT 10.0")) os = "Windows 10";
        else if (userAgent.contains("Windows NT 6.3")) os = "Windows 8.1";
        else if (userAgent.contains("Windows NT 6.2")) os = "Windows 8";
        else if (userAgent.contains("Windows NT 6.1")) os = "Windows 7";
        else if (userAgent.contains("Mac OS X")) os = "Mac OS";
        else if (userAgent.contains("iPhone")) os = "iPhone";
        else if (userAgent.contains("iPad")) os = "iPad";
        else if (userAgent.contains("Android")) os = "Android";
        else if (userAgent.contains("Linux")) os = "Linux";

        // 2. 브라우저 확인 (순서 중요: Chrome 문자열은 Edge, Whale 등에도 포함됨)
        if (userAgent.contains("Edg")) browser = "Edge";
        else if (userAgent.contains("Whale")) browser = "Naver Whale";
        else if (userAgent.contains("Chrome")) browser = "Chrome";
        else if (userAgent.contains("Firefox")) browser = "Firefox";
        else if (userAgent.contains("Safari") && !userAgent.contains("Chrome")) browser = "Safari";
        else if (userAgent.contains("Trident") || userAgent.contains("MSIE")) browser = "Internet Explorer";

        return os + " / " + browser;
    }
}