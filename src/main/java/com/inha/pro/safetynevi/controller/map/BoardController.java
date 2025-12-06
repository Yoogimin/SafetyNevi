package com.inha.pro.safetynevi.controller.map;

import com.inha.pro.safetynevi.dto.map.BoardDto;
import com.inha.pro.safetynevi.dto.map.BoardRequestDto; // 🌟 DTO 임포트
import com.inha.pro.safetynevi.service.map.BoardService;
import jakarta.validation.Valid; // 🌟 검증 어노테이션
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/board")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;
    private final SimpMessagingTemplate messagingTemplate;

    // 1. 전체 게시글 조회
    @GetMapping
    public ResponseEntity<List<BoardDto>> getBoards(@AuthenticationPrincipal User user) {
        String userId = (user != null) ? user.getUsername() : null;
        return ResponseEntity.ok(boardService.getAllBoards(userId));
    }

    // 2. 내가 쓴 글 조회
    @GetMapping("/my")
    public ResponseEntity<List<BoardDto>> getMyBoards(@AuthenticationPrincipal User user) {
        // SecurityConfig에서 인증된 사용자만 접근 허용하므로 user는 null이 아님
        return ResponseEntity.ok(boardService.getMyBoards(user.getUsername()));
    }

    // 3. 게시글 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<BoardDto> getBoardDetail(@PathVariable Long id, @AuthenticationPrincipal User user) {
        String userId = (user != null) ? user.getUsername() : null;
        return ResponseEntity.ok(boardService.getBoardDetail(id, userId));
    }

    // 4. 🌟 [수정] 게시글 작성 (DTO + Validation 적용)
    // MultipartFile이 포함되어 있으므로 @RequestBody가 아닌 @ModelAttribute를 사용합니다.
    @PostMapping
    public ResponseEntity<String> createBoard(
            @Valid @ModelAttribute BoardRequestDto dto, // 🌟 검증 수행
            @AuthenticationPrincipal User user) {

        BoardDto newBoard = boardService.createBoardReturnDto(
                user.getUsername(),
                dto.getTitle(),
                dto.getContent(),
                dto.getCategory(),
                dto.getLatitude(),
                dto.getLongitude(),
                dto.getLocationType(),
                dto.getImageFile()
        );

        // 소켓 알림 전송
        messagingTemplate.convertAndSend("/topic/board/new", newBoard);
        return ResponseEntity.ok("created");
    }

    // 5. 🌟 [수정] 게시글 삭제 (예외 처리 제거 -> GlobalExceptionHandler 위임)
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteBoard(@PathVariable Long id, @AuthenticationPrincipal User user) {
        boardService.deleteBoard(id, user.getUsername());

        messagingTemplate.convertAndSend("/topic/board/delete", id);
        return ResponseEntity.ok("deleted");
    }

    // 6. 🌟 [수정] 좋아요 토글
    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Boolean>> toggleLike(@PathVariable Long id, @AuthenticationPrincipal User user) {
        boolean liked = boardService.toggleLike(id, user.getUsername());
        int total = boardService.getLikeCount(id);

        messagingTemplate.convertAndSend("/topic/board/like", Map.of("boardId", id, "totalLikes", total));
        return ResponseEntity.ok(Map.of("liked", liked));
    }

    // 7. 🌟 [수정] 댓글 작성
    @PostMapping("/{id}/comment")
    public ResponseEntity<BoardDto.CommentDto> addComment(@PathVariable Long id, @RequestBody Map<String, Object> payload, @AuthenticationPrincipal User user) {
        Long parentId = payload.containsKey("parentId") ? Long.valueOf(payload.get("parentId").toString()) : null;

        BoardDto.CommentDto comment = boardService.addComment(id, user.getUsername(), (String)payload.get("content"), parentId);

        messagingTemplate.convertAndSend("/topic/board/comment",
                Map.of("boardId", id, "comment", comment, "parentId", parentId != null ? parentId : -1));
        return ResponseEntity.ok(comment);
    }
}