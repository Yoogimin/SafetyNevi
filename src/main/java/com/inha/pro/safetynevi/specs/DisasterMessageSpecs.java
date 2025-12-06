package com.inha.pro.safetynevi.specs;

import com.inha.pro.safetynevi.dto.crawling.DisasterMessage;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class DisasterMessageSpecs {

    // 지역(area) 필드를 'LIKE' 조건으로 검색 (예: '서울%')
    public static Specification<DisasterMessage> likeArea(String area) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.like(root.get("area"), area + "%");
    }

    // 재난종류(disasterType) 필드를 '=' 조건으로 검색
    public static Specification<DisasterMessage> equalDisasterType(String disasterType) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("disasterType"), disasterType);
    }
}