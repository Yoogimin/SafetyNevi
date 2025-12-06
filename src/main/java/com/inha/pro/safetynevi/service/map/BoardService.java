package com.inha.pro.safetynevi.service.map;

import com.inha.pro.safetynevi.dao.member.MemberRepository;
import com.inha.pro.safetynevi.dao.map.*;
import com.inha.pro.safetynevi.dto.map.BoardDto;
import com.inha.pro.safetynevi.entity.board.*;
import com.inha.pro.safetynevi.entity.member.Member;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardService {

    private final BoardRepository boardRepository;
    private final CommentRepository commentRepository;
    private final BoardLikeRepository boardLikeRepository;
    private final MemberRepository memberRepository;

    @Value("${file.upload.dir}")
    private String uploadDir;

    // 1. 게시글 전체 조회
    @Transactional(readOnly = true)
    public List<BoardDto> getAllBoards(String currentUserId) {
        return boardRepository.findAll().stream()
                .sorted(Comparator.comparing(Board::getCreatedAt).reversed())
                .map(board -> convertToBoardDto(board, currentUserId))
                .collect(Collectors.toList());
    }

    // 2. 내가 쓴 글 조회 (성능 최적화 버전)
    @Transactional(readOnly = true)
    public List<BoardDto> getMyBoards(String userId) {
        return boardRepository.findAllByWriterWithAssociations(userId).stream()
                .map(b -> convertToBoardDto(b, userId))
                .collect(Collectors.toList());
    }

    // 3. 게시글 상세 조회 (단건)
    @Transactional(readOnly = true)
    public BoardDto getBoardDetail(Long boardId, String currentUserId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다."));
        return convertToBoardDto(board, currentUserId);
    }

    // [Helper] Entity -> DTO 변환
    private BoardDto convertToBoardDto(Board board, String currentUserId) {
        boolean isLiked = false;
        boolean canDelete = false;

        if (currentUserId != null) {
            isLiked = board.getLikes().stream().anyMatch(l -> l.getUser().getUserId().equals(currentUserId));
            if (board.getWriter().getUserId().equals(currentUserId) || "admin".equals(currentUserId)) {
                canDelete = true;
            }
        }

        List<BoardDto.CommentDto> comments = board.getComments().stream()
                .filter(c -> c.getParent() == null)
                .map(this::convertToCommentDto)
                .collect(Collectors.toList());

        return BoardDto.builder()
                .id(board.getId())
                .title(board.getTitle())
                .content(board.getContent())
                .category(board.getCategory())
                .writer(board.getWriter().getNickname())
                .latitude(board.getLatitude())
                .longitude(board.getLongitude())
                .imageUrl(board.getImageUrl())
                .locationType(board.getLocationType())
                .date(timeAgo(board.getCreatedAt()))
                .likeCount(board.getLikes().size())
                .liked(isLiked)
                .canDelete(canDelete)
                .comments(comments)
                .build();
    }

    private BoardDto.CommentDto convertToCommentDto(Comment c) {
        return BoardDto.CommentDto.builder()
                .id(c.getId()).writer(c.getWriter().getNickname())
                .content(c.getContent()).timeAgo(timeAgo(c.getCreatedAt()))
                .replies(c.getChildren().stream().map(this::convertToCommentDto).collect(Collectors.toList()))
                .build();
    }

    // 3. 게시글 작성
    public BoardDto createBoardReturnDto(String userId, String title, String content, String category,
                                         Double lat, Double lon, String locationType, MultipartFile file) {
        Member member = memberRepository.findById(userId).orElseThrow();
        String imagePath = null;

        if (file != null && !file.isEmpty()) {
            try {
                String storeName = UUID.randomUUID() + "_" + file.getOriginalFilename();
                File dest = new File(uploadDir + storeName);
                if (!dest.getParentFile().exists()) dest.getParentFile().mkdirs();
                file.transferTo(dest);
                imagePath = "/images/uploads/" + storeName;
            } catch (IOException e) { throw new RuntimeException(e); }
        }

        Board saved = boardRepository.save(Board.builder()
                .title(title).content(content).category(category)
                .latitude(lat).longitude(lon).locationType(locationType)
                .imageUrl(imagePath).writer(member).build());
        return convertToBoardDto(saved, userId);
    }

    public void createBoard(String userId, String title, String content, String category, Double lat, Double lon, String locationType, MultipartFile file) {
        createBoardReturnDto(userId, title, content, category, lat, lon, locationType, file);
    }

    // 4. 삭제
    public void deleteBoard(Long boardId, String userId) {
        Board board = boardRepository.findById(boardId).orElseThrow(() -> new IllegalArgumentException("게시글 없음"));
        if (!board.getWriter().getUserId().equals(userId) && !"admin".equals(userId)) {
            throw new SecurityException("권한 없음");
        }
        boardRepository.delete(board);
    }

    // 5. 좋아요
    public boolean toggleLike(Long boardId, String userId) {
        Board board = boardRepository.findById(boardId).orElseThrow();
        Member member = memberRepository.findById(userId).orElseThrow();
        Optional<BoardLike> like = boardLikeRepository.findByBoardAndUser(board, member);
        if (like.isPresent()) { boardLikeRepository.delete(like.get()); return false; }
        else { boardLikeRepository.save(BoardLike.builder().board(board).user(member).build()); return true; }
    }

    @Transactional(readOnly = true)
    public int getLikeCount(Long boardId) {
        return boardRepository.findById(boardId).map(b -> b.getLikes().size()).orElse(0);
    }

    // 6. 댓글
    public BoardDto.CommentDto addComment(Long boardId, String userId, String content, Long parentId) {
        Board board = boardRepository.findById(boardId).orElseThrow();
        Member member = memberRepository.findById(userId).orElseThrow();
        Comment parent = (parentId != null) ? commentRepository.findById(parentId).orElse(null) : null;
        Comment saved = commentRepository.save(Comment.builder()
                .board(board).writer(member).content(content).parent(parent).build());
        return BoardDto.CommentDto.builder().id(saved.getId()).writer(saved.getWriter().getNickname())
                .content(saved.getContent()).timeAgo("방금 전").replies(new ArrayList<>()).build();
    }

    private String timeAgo(LocalDateTime date) {
        if(date == null) return "";
        long sec = Duration.between(date, LocalDateTime.now()).getSeconds();
        if (sec < 60) return "방금 전";
        if (sec < 3600) return (sec / 60) + "분 전";
        if (sec < 86400) return (sec / 3600) + "시간 전";
        return (sec / 86400) + "일 전";
    }

    // 🌟 [신규] 전체 게시글 수 조회 (Admin용)
    @Transactional(readOnly = true)
    public long countBoards() {
        return boardRepository.count();
    }
}