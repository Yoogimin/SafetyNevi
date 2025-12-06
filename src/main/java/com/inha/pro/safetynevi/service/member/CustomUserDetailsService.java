package com.inha.pro.safetynevi.service.member;

import com.inha.pro.safetynevi.dao.member.MemberRepository;
import com.inha.pro.safetynevi.entity.member.Member;
import com.inha.pro.safetynevi.service.SuspensionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final MemberRepository memberRepository;
    private final SuspensionService suspensionService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        Member member = memberRepository.findById(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다."));

        // 🔥 정지된 계정은 로그인 즉시 차단
        if (suspensionService.isSuspended(username)) {
            throw new DisabledException("정지된 계정입니다.");
        }

        // 역할 설정
        String role = "USER";
        if ("admin".equals(member.getUserId())) {
            role = "ADMIN";
        }

        return User.builder()
                .username(member.getUserId())
                .password(member.getPassword())
                .roles(role)
                .build();
    }
}
