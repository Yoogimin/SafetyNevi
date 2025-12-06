package com.inha.pro.safetynevi.service.member;

import com.inha.pro.safetynevi.dao.member.AccessLogRepository;
import com.inha.pro.safetynevi.dao.member.InquiryRepository;
import com.inha.pro.safetynevi.dao.member.MemberRepository;
import com.inha.pro.safetynevi.dto.member.MemberSignupDto;
import com.inha.pro.safetynevi.entity.member.AccessLog;
import com.inha.pro.safetynevi.entity.member.Inquiry;
import com.inha.pro.safetynevi.entity.member.Member;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MemberService {

    private final MemberRepository memberRepository;
    private final AccessLogRepository accessLogRepository; // 추가 주입
    private final InquiryRepository inquiryRepository;     // 추가 주입
    private final PasswordEncoder passwordEncoder;

    // =================================================================
    // 1. 회원가입 및 검증 관련
    // =================================================================

    // 회원가입
    public void signup(MemberSignupDto dto) {
        String encodedPassword = passwordEncoder.encode(dto.getPassword());
        String encodedAnswer = passwordEncoder.encode(dto.getPwAnswer());

        Member member = Member.builder()
                .userId(dto.getUserId())
                .email(dto.getEmail())
                .password(encodedPassword)
                .name(dto.getName())
                .nickname(dto.getNickname())
                .address(dto.getAddress())
                .detailAddress(dto.getDetailAddress())
                .areaName(dto.getAreaName())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .emergencyPhone(dto.getEmergencyPhone())
                .pwQuestion(dto.getPwQuestion())
                .pwAnswer(encodedAnswer)
                .build();
        memberRepository.save(member);
    }

    // 중복 체크
    @Transactional(readOnly = true)
    public boolean checkUserIdDuplicate(String userId) { return memberRepository.existsByUserId(userId); }
    @Transactional(readOnly = true)
    public boolean checkEmailDuplicate(String email) { return memberRepository.existsByEmail(email); }
    @Transactional(readOnly = true)
    public boolean checkNicknameDuplicate(String nickname) { return memberRepository.existsByNickname(nickname); }

    // =================================================================
    // 2. 비밀번호 찾기 관련
    // =================================================================

    // 질문 조회
    @Transactional(readOnly = true)
    public Integer findPwQuestion(String userId, String email) {
        Member member = memberRepository.findByUserIdAndEmail(userId, email)
                .orElseThrow(() -> new IllegalArgumentException("일치하는 회원 정보가 없습니다."));
        return member.getPwQuestion();
    }

    // 답변 검증
    @Transactional(readOnly = true)
    public boolean verifyPwAnswer(String userId, String rawAnswer) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("회원이 존재하지 않습니다."));
        return passwordEncoder.matches(rawAnswer, member.getPwAnswer());
    }

    // 비밀번호 재설정 (로그인 전)
    public void resetPassword(String userId, String newPassword) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("회원이 존재하지 않습니다."));
        member.updatePassword(passwordEncoder.encode(newPassword));
    }

    // =================================================================
    // 3. 마이페이지 정보 수정 및 조회 관련
    // =================================================================

    // 내 정보 수정
    public void updateMemberInfo(String userId, String nickname, String phone, String address, String detailAddress) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("회원 정보가 없습니다."));
        member.updateInfo(nickname, phone, address, detailAddress);
    }

    // 비밀번호 변경 (로그인 후, 기존 비밀번호 확인 포함)
    public void changePasswordWithVerification(String userId, String currentPw, String securityAnswer, String newPw) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("회원 정보가 없습니다."));

        if (!passwordEncoder.matches(currentPw, member.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        if (!passwordEncoder.matches(securityAnswer, member.getPwAnswer())) {
            throw new IllegalArgumentException("보안 질문의 답변이 일치하지 않습니다.");
        }

        member.updatePassword(passwordEncoder.encode(newPw));
    }

    // 🌟 [신규] 회원 단건 조회 (마이페이지용)
    @Transactional(readOnly = true)
    public Member getMember(String userId) {
        return memberRepository.findById(userId).orElse(null);
    }

    // 🌟 [신규] 로그인 로그 조회 (마이페이지용)
    @Transactional(readOnly = true)
    public List<AccessLog> getAccessLogs(String userId) {
        return accessLogRepository.findTop20ByUserIdOrderByLogDateDesc(userId);
    }

    // 🌟 [신규] 문의 내역 조회 (마이페이지용)
    @Transactional(readOnly = true)
    public List<Inquiry> getInquiries(String userId) {
        return inquiryRepository.findAllByMember_UserIdOrderByCreatedAtDesc(userId);
    }

    // =================================================================
    // 4. 관리자(Admin) 기능 관련
    // =================================================================

    // 🌟 [신규] 전체 회원 수 조회
    @Transactional(readOnly = true)
    public long countMembers() {
        return memberRepository.count();
    }

    // 🌟 [신규] 전체 회원 목록 조회
    @Transactional(readOnly = true)
    public List<Member> findAllMembers() {
        return memberRepository.findAll();
    }

    // =================================================================
    // 5. 탈퇴 관련
    // =================================================================

    // 일반 회원 탈퇴 (비밀번호 확인 필수)
    public void withdrawMember(String userId, String password) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("회원 정보가 없습니다."));

        if (!passwordEncoder.matches(password, member.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        memberRepository.delete(member);
    }

    // 🌟 관리자용 강제 탈퇴 (비밀번호 확인 없음)
    public void forceWithdraw(String userId) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("회원이 존재하지 않습니다."));

        // Cascade 설정에 의해 작성 글, 댓글 등도 함께 삭제됨
        memberRepository.delete(member);
    }
}