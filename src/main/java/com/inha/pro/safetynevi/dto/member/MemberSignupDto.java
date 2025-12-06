package com.inha.pro.safetynevi.dto.member;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class MemberSignupDto {

    @NotBlank
    @Pattern(regexp = "^[A-Za-z0-9]{4,12}$", message = "아이디는 영문, 숫자 4~12자여야 합니다.")
    private String userId;

    @NotBlank
    // 🌟 이메일 도메인 제한 정규식 (네이버, 카카오, 다음, 지메일)
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@(naver\\.com|kakao\\.com|daum\\.net|gmail\\.com)$",
            message = "네이버, 카카오, 다음, 구글 이메일만 사용 가능합니다.")
    private String email;

    @NotBlank
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$",
            message = "비밀번호는 8자 이상, 대문자/숫자/특수문자 포함")
    private String password;

    @NotBlank
    // 🌟 이름 정규식 (한글 또는 영문 2~20자)
    @Pattern(regexp = "^[가-힣a-zA-Z]{2,20}$", message = "이름은 한글 또는 영문 2~20자여야 합니다.")
    private String name;

    @NotBlank
    @Pattern(regexp = "^[가-힣a-zA-Z0-9]{2,10}$", message = "닉네임은 특수문자 제외 2~10자")
    private String nickname;

    private String address;
    private String detailAddress;
    private String areaName;
    private Double latitude;
    private Double longitude;

    // 🌟 비상 연락처 정규식 (선택 항목이지만 입력 시 형식 체크)
    // ^$ : 빈 값 허용 OR 010으로 시작하는 11자리 숫자
    @Pattern(regexp = "^$|^010\\d{8}$", message = "휴대폰 번호 형식이 올바르지 않습니다. (-제외)")
    private String emergencyPhone;

    private Integer pwQuestion;
    private String pwAnswer;
}