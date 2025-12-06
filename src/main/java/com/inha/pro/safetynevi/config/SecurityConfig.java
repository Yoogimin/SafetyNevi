package com.inha.pro.safetynevi.config;

import com.inha.pro.safetynevi.dao.member.MemberRepository;
import com.inha.pro.safetynevi.entity.member.Member;
import com.inha.pro.safetynevi.service.member.CustomUserDetailsService;
import com.inha.pro.safetynevi.util.CustomAccessDeniedHandler;
import com.inha.pro.safetynevi.util.CustomAuthSuccessHandler;
import com.inha.pro.safetynevi.util.CustomLogoutSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final MemberRepository memberRepository;
    private final CustomAuthSuccessHandler customAuthSuccessHandler;
    private final CustomLogoutSuccessHandler customLogoutSuccessHandler;
    private final CustomAccessDeniedHandler customAccessDeniedHandler;

    private final CustomUserDetailsService customUserDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/css/**", "/js/**", "/img/**", "/favicon.ico").permitAll()
                        .requestMatchers("/", "/signup", "/login", "/findAccount").permitAll()
                        .requestMatchers("/api/check/**", "/api/find/**").permitAll()

                        // 관리자 영역
                        .requestMatchers("/admin/**", "/api/admin/**").hasRole("ADMIN")

                        // 나머지는 로그인 필요
                        .anyRequest().authenticated()
                )

                .userDetailsService(customUserDetailsService)

                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/login")
                        .usernameParameter("username")
                        .passwordParameter("password")
                        .successHandler(customAuthSuccessHandler)
                        .failureUrl("/login?error")
                        .permitAll()
                )

                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessHandler(customLogoutSuccessHandler)
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .permitAll()
                )

                .exceptionHandling(exception -> exception
                        .accessDeniedHandler(customAccessDeniedHandler)
                        .authenticationEntryPoint((req, res, ex) -> {
                            res.sendRedirect("/login?error=auth");
                        })
                );

        return http.build();
    }
}
