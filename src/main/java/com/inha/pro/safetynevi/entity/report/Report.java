package com.inha.pro.safetynevi.entity.report;

import com.inha.pro.safetynevi.entity.member.Member;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "SAFETY_REPORT")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "REPORT_ID")
    private Long id;

    // 신고한 사용자
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "REPORTER_ID", nullable = false)
    private Member reporter;

    // FACILITY, BOARD 등
    @Column(name = "TARGET_TYPE", nullable = false)
    private String targetType;

    // 신고 대상 ID (게시글 ID, 시설 ID 등)
    @Column(name = "TARGET_ID")
    private Long targetId;

    // 신고 대상 사용자 (게시글 작성자)
    @Column(name = "TARGET_USER")
    private String targetUser;

    // abuse, spam, false_info 등
    @Column(name = "REASON", nullable = false)
    private String reason;

    // 상세 설명
    @Column(name = "DESCRIPTION", columnDefinition = "CLOB")
    private String description;

    // RECEIVED, PROCESSING, DONE
    @Column(name = "STATUS", nullable = false)
    private String status;

    // 생성시간
    @CreationTimestamp
    @Column(name = "CREATED_AT", updatable = false)
    private LocalDateTime createdAt;

    // 상태 변경 메서드
    public void updateStatus(String newStatus) {
        this.status = newStatus;
    }
}
