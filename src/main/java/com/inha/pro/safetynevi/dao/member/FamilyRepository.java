package com.inha.pro.safetynevi.dao.member;

import com.inha.pro.safetynevi.entity.member.Family;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FamilyRepository extends JpaRepository<Family, Long> {
    List<Family> findAllByUserId(String userId);
}