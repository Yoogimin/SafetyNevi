package com.inha.pro.safetynevi.dao.member;

import com.inha.pro.safetynevi.entity.member.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, String> {
    boolean existsByUserId(String userId);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);

    // 🌟 비밀번호 찾기용 조회
    Optional<Member> findByUserIdAndEmail(String userId, String email);

    // 1. 오늘 가입한 회원 수 (시간 범위로 검색)
    long countByJoinDateBetween(LocalDateTime start, LocalDateTime end);

    // 2. [변경] 그룹화 쿼리 대신, 주소가 존재하는 회원의 주소 전체 리스트를 가져옵니다.
    // 예: ["서울특별시 강서구...", "경기도 성남시...", "부산광역시 강서구..."]
    @Query("SELECT m.address FROM Member m WHERE m.address IS NOT NULL")
    List<String> findAllAddresses();
}