document.addEventListener('DOMContentLoaded', function() {

    const questions = {
        1: "인생 좌우명?",
        2: "보물 1호?",
        3: "기억에 남는 선생님?",
        4: "졸업한 초등학교?",
        5: "다시 태어나면 되고싶은 것?"
    };

    let currentUserId = '';

    /* STEP 1: 아이디 조회 */
    document.getElementById('btn-step1').addEventListener('click', () => {
        const userId = document.getElementById('find_id').value;
        const email = document.getElementById('find_email').value;

        if (!userId || !email) { alert("정보를 모두 입력해주세요."); return; }

        fetch('/api/find/question', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId, email })
        })
            .then(res => {
                if (!res.ok) throw new Error('Not Found');
                return res.json();
            })
            .then(data => {
                currentUserId = userId;
                document.getElementById('question-display').innerText = "Q. " + questions[data.question];

                document.getElementById('step-1').classList.add('hidden-step');
                document.getElementById('step-2').classList.remove('hidden-step');
                document.getElementById('step-2').classList.add('fade-in');
            })
            .catch(() => alert("일치하는 회원 정보가 없습니다."));
    });

    /* STEP 2: 답변 검증 */
    document.getElementById('btn-step2').addEventListener('click', () => {
        const answer = document.getElementById('find_answer').value;
        if (!answer) { alert("답변을 입력해주세요."); return; }

        fetch('/api/find/verify', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: currentUserId, answer })
        })
            .then(res => {
                if (!res.ok) throw new Error('Wrong Answer');
                return res.text();
            })
            .then(() => {
                alert("본인 인증되었습니다.\n비밀번호를 재설정해주세요.");
                document.getElementById('step-2').classList.add('hidden-step');
                document.getElementById('step-3').classList.remove('hidden-step');
                document.getElementById('step-3').classList.add('fade-in');
            })
            .catch(() => alert("답변이 일치하지 않습니다."));
    });

    /* 🌟 STEP 3: 비밀번호 실시간 검사 및 변경 */
    const newPwInput = document.getElementById('new_pw');
    const confirmPwInput = document.getElementById('new_pw_confirm');
    const matchMsg = document.getElementById('pw-match-msg');

    // 🌟 실시간 일치 확인 로직
    function checkMatch() {
        const pw = newPwInput.value;
        const confirm = confirmPwInput.value;

        if(confirm === "") {
            confirmPwInput.classList.remove('valid', 'invalid');
            matchMsg.className = 'kb-input-msg';
            matchMsg.innerText = "";
            return;
        }

        if(pw === confirm) {
            // 일치 시: 초록색 테두리 + 체크 아이콘 + 성공 메시지
            confirmPwInput.classList.add('valid');
            confirmPwInput.classList.remove('invalid');
            matchMsg.className = 'kb-input-msg success';
            matchMsg.innerText = "비밀번호가 일치합니다.";
        } else {
            // 불일치 시: 빨간색 테두리 + 에러 메시지
            confirmPwInput.classList.add('invalid');
            confirmPwInput.classList.remove('valid');
            matchMsg.className = 'kb-input-msg error';
            matchMsg.innerText = "비밀번호가 일치하지 않습니다.";
        }
    }

    newPwInput.addEventListener('input', checkMatch);
    confirmPwInput.addEventListener('input', checkMatch);


    // 변경 버튼 클릭 시 최종 전송
    document.getElementById('btn-step3').addEventListener('click', () => {
        const pw = newPwInput.value;
        const confirm = confirmPwInput.value;

        // 🌟 정규식 수정: 대문자 필수 조건 제거
        // 영문(A-Z, a-z) + 숫자 + 특수문자 포함, 8자 이상
        const pwRegex = /^(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

        if (!pwRegex.test(pw)) {
            alert("비밀번호는 8자 이상이며, 영문/숫자/특수문자를 포함해야 합니다.");
            newPwInput.focus();
            return;
        }
        if (pw !== confirm) {
            alert("비밀번호가 일치하지 않습니다.");
            confirmPwInput.focus();
            return;
        }

        fetch('/api/find/reset', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: currentUserId, password: pw })
        })
            .then(res => {
                if (!res.ok) throw new Error('Reset Failed');
                return res.text();
            })
            .then(() => {
                alert("비밀번호가 성공적으로 변경되었습니다. 🎉\n로그인 페이지로 이동합니다.");
                window.location.href = "/login";
            })
            .catch(() => alert("비밀번호 변경 중 오류가 발생했습니다."));
    });
});