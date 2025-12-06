package com.inha.pro.safetynevi.entity.board;

import com.inha.pro.safetynevi.entity.member.Member;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet; // 🌟 Set 구현체 임포트
import java.util.List;
import java.util.Set;     // 🌟 Set 인터페이스 임포트

@Entity
@Table(name = "SAFETY_BOARD")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
// 🌟 [핵심 1] 연관 관계 필드는 toString에서 반드시 제외 (무한 루프 방지)
@ToString(exclude = {"comments", "likes", "writer"})
public class Board {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BOARD_ID")
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(length = 50)
    private String category;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "IMAGE_URL")
    private String imageUrl;

    @Column(name = "LOCATION_TYPE")
    private String locationType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_ID")
    private Member writer;

    @CreationTimestamp
    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    // 댓글은 순서가 중요하므로 List 유지
    @Builder.Default
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<Comment> comments = new ArrayList<>();

    // 🌟 [핵심 2] List -> Set 변경 (MultipleBagFetchException 해결)
    // 좋아요는 순서가 크게 중요하지 않고 중복되면 안 되므로 Set이 적합하며,
    // Hibernate에서 List와 함께 Fetch Join 할 수 있게 됩니다.
    @Builder.Default
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<BoardLike> likes = new HashSet<>();
}