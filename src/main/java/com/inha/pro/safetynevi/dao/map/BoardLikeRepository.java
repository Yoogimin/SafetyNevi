package com.inha.pro.safetynevi.dao.map;

import com.inha.pro.safetynevi.entity.board.Board;
import com.inha.pro.safetynevi.entity.board.BoardLike;
import com.inha.pro.safetynevi.entity.member.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BoardLikeRepository extends JpaRepository<BoardLike, Long> {
    Optional<BoardLike> findByBoardAndUser(Board board, Member user);
}