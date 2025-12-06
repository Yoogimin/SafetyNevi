package com.inha.pro.safetynevi.controller.map;

import org.springframework.beans.factory.annotation.Value; // 🌟 추가
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MapController {

    // 🌟 application.yml의 값을 가져옴
    @Value("${api.kakao.jsKey}")
    private String kakaoJsKey;

    @GetMapping("/map")
    public String showMapPage(Model model) {
        // 🌟 HTML로 키 전달
        model.addAttribute("kakaoJsKey", kakaoJsKey);
        return "map/map";
    }
}