package com.inha.pro.safetynevi.dao.member;

import com.inha.pro.safetynevi.entity.member.AccessLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AccessLogRepository extends JpaRepository<AccessLog, Long> {
    // 최신순으로 해당 유저의 로그 20개만 가져오기
    List<AccessLog> findTop20ByUserIdOrderByLogDateDesc(String userId);
}