package com.inha.pro.safetynevi.config; // 패키지 확인

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload.dir}") // application.properties 값을 가져옴
    private String uploadDir;


    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 브라우저가 /images/uploads/ 로 요청하면 -> 실제 로컬 폴더로 연결
        registry.addResourceHandler("/images/uploads/**")
                .addResourceLocations("file:///" + uploadDir + "/");

        registry.addResourceHandler("/upload/**")
                .addResourceLocations("file:///" + uploadDir);
    }
}