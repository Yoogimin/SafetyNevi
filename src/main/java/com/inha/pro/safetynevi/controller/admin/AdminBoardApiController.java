package com.inha.pro.safetynevi.controller.admin;

import com.inha.pro.safetynevi.dto.map.BoardDto;
import com.inha.pro.safetynevi.service.map.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminBoardApiController {

    private final BoardService boardService;

    @GetMapping("/board/{id}")
    public ResponseEntity<?> getBoardById(@PathVariable Long id) {
        BoardDto dto = boardService.getBoardDetail(id, null);
        return ResponseEntity.ok(dto);
    }
}
