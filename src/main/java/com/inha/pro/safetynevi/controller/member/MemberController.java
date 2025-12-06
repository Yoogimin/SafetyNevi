package com.inha.pro.safetynevi.controller.member;

import com.inha.pro.safetynevi.dto.inquiry.InquiryDTO;
import com.inha.pro.safetynevi.dto.map.BoardDto;
import com.inha.pro.safetynevi.dto.member.MemberSignupDto;
import com.inha.pro.safetynevi.entity.member.AccessLog;
import com.inha.pro.safetynevi.entity.member.Inquiry;
import com.inha.pro.safetynevi.entity.member.Member;
import com.inha.pro.safetynevi.service.inquiry.InquiryService;
import com.inha.pro.safetynevi.service.map.BoardService;
import com.inha.pro.safetynevi.service.member.MemberService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class MemberController {

    // 🌟 Repository 제거됨! Service만 남음
    private final MemberService memberService;
    private final BoardService boardService;
    private final InquiryService inquiryService;

    private final Map<Integer, String> questionMap = Map.of(
            1, "인생 좌우명?", 2, "보물 1호?", 3, "기억에 남는 선생님?", 4, "졸업한 초등학교?", 5, "다시 태어나면 되고싶은 것?"
    );

    @GetMapping("/login") public String loginPage() { return "member/login"; }
    @GetMapping("/signup") public String signupPage() { return "member/signup"; }
    @GetMapping("/findAccount") public String findAccountPage() { return "member/findAccount"; }

    // 🌟 [수정] 마이페이지: Repository 직접 호출 -> Service 호출로 변경
    @GetMapping("/myInfo")
    public String myInfoPage(Model model, @AuthenticationPrincipal User user) {
        if (user != null) {
            String userId = user.getUsername();

            // Service를 통해 회원 정보 조회
            Member member = memberService.getMember(userId);

            if (member != null) {
                model.addAttribute("member", member);

                // 1. 보안 질문
                String qText = questionMap.getOrDefault(member.getPwQuestion(), "알 수 없는 질문");
                model.addAttribute("questionText", qText);

                // 2. 로그인 기록 (Service 호출)
                List<AccessLog> loginLogs = memberService.getAccessLogs(userId);
                model.addAttribute("loginLogs", loginLogs);

                // 3. 문의 내역 (Service 호출)
                List<InquiryDTO> myInquiries = inquiryService.getMyInquiries(userId);
                model.addAttribute("myInquiries", myInquiries);

                // 4. 내가 쓴 글 (Service 호출)
                List<BoardDto> myBoards = boardService.getMyBoards(userId);
                model.addAttribute("myBoards", myBoards);
            }
        }
        return "member/myInfo";
    }

    // ... (아래 API 메소드들은 이미 Service를 쓰고 있어서 수정 불필요) ...
    @PostMapping("/signup")
    @ResponseBody
    public ResponseEntity<String> signupProcess(@RequestBody MemberSignupDto signupDto) {
        try {
            memberService.signup(signupDto);
            return ResponseEntity.ok("success");
        } catch (Exception e) { return ResponseEntity.badRequest().body("fail"); }
    }

    @PostMapping("/api/myinfo/update")
    @ResponseBody
    public ResponseEntity<?> updateInfo(@RequestBody Map<String, String> req, @AuthenticationPrincipal User user) {
        try {
            memberService.updateMemberInfo(user.getUsername(), req.get("nickname"), req.get("phone"), req.get("address"), req.get("detailAddress"));
            return ResponseEntity.ok("success");
        } catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @PostMapping("/api/myinfo/change-pw")
    @ResponseBody
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> req, @AuthenticationPrincipal User user) {
        try {
            memberService.changePasswordWithVerification(
                    user.getUsername(), req.get("currentPassword"), req.get("securityAnswer"), req.get("newPassword")
            );
            return ResponseEntity.ok("success");
        } catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @PostMapping("/api/member/withdraw")
    @ResponseBody
    public ResponseEntity<?> withdrawMember(@RequestBody Map<String, String> req,
                                            @AuthenticationPrincipal User user,
                                            HttpServletRequest request,
                                            HttpServletResponse response) {
        if (user == null) return ResponseEntity.status(401).body("로그인 필요");
        try {
            memberService.withdrawMember(user.getUsername(), req.get("password"));
            new SecurityContextLogoutHandler().logout(request, response, null);
            return ResponseEntity.ok("success");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("오류 발생");
        }
    }

    @PostMapping("/api/find/question")
    @ResponseBody
    public ResponseEntity<?> getQuestion(@RequestBody Map<String, String> request) {
        try {
            Integer qNum = memberService.findPwQuestion(request.get("userId"), request.get("email"));
            return ResponseEntity.ok(Collections.singletonMap("question", qNum));
        } catch (Exception e) { return ResponseEntity.badRequest().body("불일치"); }
    }
    @PostMapping("/api/find/verify")
    @ResponseBody
    public ResponseEntity<?> verifyAnswer(@RequestBody Map<String, String> request) {
        boolean isCorrect = memberService.verifyPwAnswer(request.get("userId"), request.get("answer"));
        return isCorrect ? ResponseEntity.ok("verified") : ResponseEntity.badRequest().body("불일치");
    }
    @PostMapping("/api/find/reset")
    @ResponseBody
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            memberService.resetPassword(request.get("userId"), request.get("password"));
            return ResponseEntity.ok("changed");
        } catch (Exception e) { return ResponseEntity.badRequest().body("실패"); }
    }
}