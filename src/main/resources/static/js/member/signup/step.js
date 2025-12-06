document.addEventListener('DOMContentLoaded', function() {
    // 요소 가져오기
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');

    const dot1 = document.getElementById('dot-1');
    const dot2 = document.getElementById('dot-2');
    const dot3 = document.getElementById('dot-3');

    const title = document.getElementById('page-title');

    const btnStep1Next = document.getElementById('btn-step1-next');
    const btnStep2Prev = document.getElementById('btn-step2-prev');
    const btnStep2Next = document.getElementById('btn-step2-next');
    const btnStep3Prev = document.getElementById('btn-step3-prev');

    /* 1. 약관 동의 로직 */
    const checkAll = document.getElementById('agree_all');
    const check1 = document.getElementById('agreement_required');
    const check2 = document.getElementById('location_agreement');

    function updateAgreementState() {
        if (check1.checked && check2.checked) {
            checkAll.checked = true;
            btnStep1Next.disabled = false;
            btnStep1Next.innerText = "다음 단계로";
        } else {
            checkAll.checked = false;
            btnStep1Next.disabled = true;
            btnStep1Next.innerText = "약관에 모두 동의해주세요";
        }
    }

    checkAll.addEventListener('change', function() {
        const isChecked = checkAll.checked;
        check1.checked = isChecked;
        check2.checked = isChecked;
        updateAgreementState();
    });

    check1.addEventListener('change', updateAgreementState);
    check2.addEventListener('change', updateAgreementState);
    window.updateAgreementState = updateAgreementState;


    /* 2. 단계 이동 로직 */

    // Step 1 -> Step 2
    btnStep1Next.addEventListener('click', function() {
        step1.classList.add('kb-hidden');
        step2.classList.remove('kb-hidden'); step2.classList.add('fade-in');
        title.innerText = "계정 정보를 입력해주세요";
        dot1.classList.remove('active'); dot2.classList.add('active');
    });

    // Step 2 -> Step 1
    btnStep2Prev.addEventListener('click', function() {
        step2.classList.add('kb-hidden');
        step1.classList.remove('kb-hidden'); step1.classList.add('fade-in');
        title.innerText = "서비스 이용 약관에 동의해주세요";
        dot2.classList.remove('active'); dot1.classList.add('active');
    });

    // Step 2 -> Step 3 (꼼수 방지 유효성 검사 포함)
    btnStep2Next.addEventListener('click', function() {
        const idInput = document.getElementById('user_id');
        const emailInput = document.getElementById('email');
        const pwInput = document.getElementById('password');
        const pwConfirm = document.getElementById('password-confirm');

        if(!idInput.value || !emailInput.value || !pwInput.value || !pwConfirm.value) {
            alert("필수 정보를 모두 입력해주세요.");
            return;
        }

        // 'valid' 클래스 여부 확인 (중복체크 통과 여부)
        if (!idInput.classList.contains('valid')) {
            alert("아이디 중복 확인을 완료해주세요.");
            idInput.focus(); return;
        }
        if (!emailInput.classList.contains('valid')) {
            alert("이메일 중복 확인을 완료해주세요.");
            emailInput.focus(); return;
        }
        if (!pwConfirm.classList.contains('valid')) {
            alert("비밀번호가 일치하지 않습니다.");
            pwConfirm.focus(); return;
        }

        step2.classList.add('kb-hidden');
        step3.classList.remove('kb-hidden'); step3.classList.add('fade-in');
        title.innerText = "프로필 정보를 입력해주세요";
        dot2.classList.remove('active'); dot3.classList.add('active');
    });

    // Step 3 -> Step 2
    btnStep3Prev.addEventListener('click', function() {
        step3.classList.add('kb-hidden');
        step2.classList.remove('kb-hidden'); step2.classList.add('fade-in');
        title.innerText = "계정 정보를 입력해주세요";
        dot3.classList.remove('active'); dot2.classList.add('active');
    });


    /* 🌟 3. 최종 가입 완료 처리 (AJAX 전송 -> 알림 -> 이동) */
    const signupForm = document.getElementById('signup-form');

    signupForm.addEventListener('submit', function(e) {
        e.preventDefault(); // 기본 폼 제출 막기

        // 폼 데이터 JSON으로 만들기
        const formData = {
            userId: document.getElementById('user_id').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            name: document.getElementById('name').value,
            nickname: document.getElementById('nickname').value,
            address: document.getElementById('address').value,
            detailAddress: document.getElementById('detailAddress').value,
            areaName: document.getElementById('areaName').value,
            latitude: document.getElementById('lat').value ? parseFloat(document.getElementById('lat').value) : null,
            longitude: document.getElementById('lon').value ? parseFloat(document.getElementById('lon').value) : null,
            emergencyPhone: document.getElementById('emergency_contact').value,
            pwQuestion: parseInt(document.getElementById('pw_question').value),
            pwAnswer: document.getElementById('pw_answer').value
        };

        // 서버로 전송
        fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
            .then(response => {
                if (response.ok) {
                    // 🌟 성공 시 알림창 및 이동
                    alert("회원가입이 완료되었습니다! 🎉\n로그인 페이지로 이동합니다.");
                    window.location.href = "/login";
                } else {
                    alert("회원가입에 실패했습니다. 입력 정보를 다시 확인해주세요.");
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("서버 오류가 발생했습니다.");
            });
    });
});