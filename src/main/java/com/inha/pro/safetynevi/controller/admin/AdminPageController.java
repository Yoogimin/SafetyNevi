package com.inha.pro.safetynevi.controller.admin;

import com.inha.pro.safetynevi.entity.member.Member;
import com.inha.pro.safetynevi.entity.report.Report; // 🌟 추가
import com.inha.pro.safetynevi.service.calamity.DisasterService;
import com.inha.pro.safetynevi.service.map.BoardService;
import com.inha.pro.safetynevi.service.member.MemberService;
import com.inha.pro.safetynevi.service.report.ReportService; // 🌟 추가
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page; // 🌟 추가
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam; // 🌟 추가

import java.util.List;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminPageController {

    private final MemberService memberService;
    private final BoardService boardService;
    private final DisasterService disasterService;
    private final ReportService reportService; // 🌟 [필수] 서비스 주입 추가

    // 모든 페이지에 현재 URL 정보를 자동으로 전달
    @ModelAttribute("requestURI")
    public String requestURI(HttpServletRequest request) {
        return request.getRequestURI();
    }

    // 1. 대시보드 메인
    @GetMapping("")
    public String dashboard(Model model) {
        model.addAttribute("memberCount", memberService.countMembers());
        model.addAttribute("boardCount", boardService.countBoards());
        model.addAttribute("disasterCount", disasterService.countDisasters());
        return "admin/dashboard";
    }

    // 2. 회원 관리 페이지
    @GetMapping("/members")
    public String members(Model model) {
        List<Member> members = memberService.findAllMembers();
        model.addAttribute("members", members);
        return "admin/members";
    }

    // 3. 게시물 관리 페이지
    @GetMapping("/boards")
    public String boards(Model model) {
        return "admin/boards";
    }

    // 4. 공지사항 생성 페이지
//    @GetMapping("/notice/create")
//    public String createNotice(Model model) {
//        return "admin/notice-create";
//    }

    // 5. 문의 관리 페이지
//    @GetMapping("/inquiries")
//    public String inquiries(Model model) {
//        return "admin/inquiries";
//    }

    // 6. 🌟 [수정됨] 신고 관리 페이지 (데이터 연결 및 페이징)
    @GetMapping("/reports")
    public String reports(Model model, @RequestParam(defaultValue = "0") int page) {
        // 페이지당 10개씩 가져오기
        Page<Report> reportPage = reportService.getAllReports(page, 10);

        model.addAttribute("reports", reportPage);
        return "admin/reports";
    }

    // 7. 재난 관리 페이지
    @GetMapping("/disaster")
    public String disasterPage(Model model) {
        model.addAttribute("disasters", disasterService.findAll());
        return "admin/disaster";
    }
}