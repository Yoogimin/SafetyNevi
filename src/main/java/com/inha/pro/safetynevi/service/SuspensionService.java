package com.inha.pro.safetynevi.service;

import com.inha.pro.safetynevi.dao.member.UserSuspensionRepository;
import com.inha.pro.safetynevi.entity.member.UserSuspension;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SuspensionService {

    private final UserSuspensionRepository suspensionRepository;

    public void suspendUser(String adminId, String targetUser, String reason, LocalDateTime endAt) {

        UserSuspension s = UserSuspension.builder()
                .targetUserId(targetUser)
                .reason(reason)
                .startAt(LocalDateTime.now())
                .endAt(endAt) // null이면 영구정지
                .createdBy(adminId)
                .createdAt(LocalDateTime.now())
                .build();

        suspensionRepository.save(s);
    }

    public boolean isSuspended(String userId) {
        LocalDateTime now = LocalDateTime.now();

        return suspensionRepository.existsByTargetUserIdAndStartAtLessThanEqualAndEndAtAfterOrEndAtIsNull(
                userId, now, now
        );
    }
}
