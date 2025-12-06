package com.inha.pro.safetynevi.service.report;

import com.inha.pro.safetynevi.dao.member.MemberRepository;
import com.inha.pro.safetynevi.dao.report.ReportRepository;
import com.inha.pro.safetynevi.dto.report.ReportRequestDto;
import com.inha.pro.safetynevi.entity.member.Member;
import com.inha.pro.safetynevi.entity.report.Report;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ReportService {

    private final ReportRepository reportRepository;
    private final MemberRepository memberRepository;

    // 신고 생성
    public void createReport(String reporterId, ReportRequestDto dto) {
        Member reporter = memberRepository.findById(reporterId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        Report report = Report.builder()
                .reporter(reporter)
                .targetType(dto.getTargetType())
                .targetId(dto.getTargetId())
                .targetUser(dto.getTargetUser())
                .reason(dto.getReason())
                .description(dto.getDescription())
                .status("RECEIVED")
                .build();

        reportRepository.save(report);
    }

    // 🌟 [핵심] 페이징 조회 (페이지번호, 사이즈)
    @Transactional(readOnly = true)
    public Page<Report> getAllReports(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return reportRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    // 상태 변경
    public void updateReportStatus(Long id, String status) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 신고입니다."));
        report.updateStatus(status); // Report 엔티티에 updateStatus 메서드 필요
    }
}