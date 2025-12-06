package com.inha.pro.safetynevi.dao.member;

import com.inha.pro.safetynevi.entity.member.BlockedUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BlockedUserRepository extends JpaRepository<BlockedUser, Long> {

    List<BlockedUser> findAllByUserId(String userId);

    boolean existsByUserIdAndBlockedUserId(String userId, String blockedUserId);
}
