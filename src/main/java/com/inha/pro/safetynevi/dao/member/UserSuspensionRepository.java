package com.inha.pro.safetynevi.dao.member;

import com.inha.pro.safetynevi.entity.member.UserSuspension;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface UserSuspensionRepository extends JpaRepository<UserSuspension, Long> {

    // 현재 정지 상태인지 확인
    boolean existsByTargetUserIdAndStartAtLessThanEqualAndEndAtAfterOrEndAtIsNull(
            String userId,
            LocalDateTime now1,
            LocalDateTime now2
    );

    UserSuspension findTop1ByTargetUserIdOrderByStartAtDesc(String userId);
}
