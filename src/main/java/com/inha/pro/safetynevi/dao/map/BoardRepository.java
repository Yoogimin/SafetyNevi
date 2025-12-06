package com.inha.pro.safetynevi.dao.map;

import com.inha.pro.safetynevi.entity.board.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BoardRepository extends JpaRepository<Board, Long> {

    // 1. 전체 조회용 (기존에 추가해 드린 것)
    @Query("SELECT DISTINCT b FROM Board b " +
            "LEFT JOIN FETCH b.writer " +
            "LEFT JOIN FETCH b.comments " +
            "LEFT JOIN FETCH b.likes " +
            "ORDER BY b.createdAt DESC")
    List<Board> findAllWithAllAssociations();

    // 🌟 2. [신규 추가] 내 글 조회용 (WHERE 조건 + 페치 조인)
    @Query("SELECT DISTINCT b FROM Board b " +
            "LEFT JOIN FETCH b.writer " +
            "LEFT JOIN FETCH b.comments " +
            "LEFT JOIN FETCH b.likes " +
            "WHERE b.writer.userId = :userId " + // 👈 DB 레벨에서 필터링!
            "ORDER BY b.createdAt DESC")
    List<Board> findAllByWriterWithAssociations(@Param("userId") String userId);
}