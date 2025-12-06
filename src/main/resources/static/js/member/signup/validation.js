document.addEventListener('DOMContentLoaded', function() {

    /* =========================================
       1. 아이디 검사 (수정 시 재검사 강제)
       ========================================= */
    const idInput = document.getElementById('user_id');
    const idMsg = document.getElementById('id-msg');
    const checkIdBtn = document.getElementById('check-id-btn');

    idInput.addEventListener('input', function() {
        this.classList.remove('valid', 'invalid');
        idMsg.style.display = 'none';
    });

    checkIdBtn.addEventListener('click', function() {
        const val = idInput.value;
        const idRegex = /^[A-Za-z0-9]{4,12}$/;

        if (!idRegex.test(val)) {
            alert("아이디는 영문, 숫자 4~12자로 입력해주세요.");
            idInput.focus(); return;
        }

        fetch(`/api/check/id?userId=${val}`)
            .then(response => response.json())
            .then(data => {
                idMsg.style.display = 'block';
                if (data.available) {
                    idInput.classList.add('valid'); idInput.classList.remove('invalid');
                    idMsg.className = 'kb-input-msg success';
                    idMsg.innerText = "사용 가능한 아이디입니다.";
                } else {
                    idInput.classList.add('invalid'); idInput.classList.remove('valid');
                    idMsg.className = 'kb-input-msg error';
                    idMsg.innerText = "이미 사용 중인 아이디입니다.";
                }
            })
            .catch(error => console.error('Error:', error));
    });


    /* =========================================
       2. 이메일 검사 (도메인 제한 추가) 🌟
       ========================================= */
    const emailInput = document.getElementById('email');
    const emailMsg = document.getElementById('email-msg');
    const checkEmailBtn = document.getElementById('check-email-btn');

    emailInput.addEventListener('input', function() {
        this.classList.remove('valid', 'invalid');
        emailMsg.style.display = 'none';
    });

    checkEmailBtn.addEventListener('click', function() {
        const val = emailInput.value;

        // 🌟 수정된 정규식: 네이버, 다음, 카카오, 지메일만 허용
        const emailRegex = /^[A-Za-z0-9._%+-]+@(naver\.com|kakao\.com|daum\.net|gmail\.com)$/;

        if (!emailRegex.test(val)) {
            alert("네이버, 카카오, 다음, 구글 이메일만 사용 가능합니다.");
            emailInput.focus(); return;
        }

        fetch(`/api/check/email?email=${val}`)
            .then(response => response.json())
            .then(data => {
                emailMsg.style.display = 'block';
                if (data.available) {
                    emailInput.classList.add('valid'); emailInput.classList.remove('invalid');
                    emailMsg.className = 'kb-input-msg success';
                    emailMsg.innerText = "사용 가능한 이메일입니다.";
                } else {
                    emailInput.classList.add('invalid'); emailInput.classList.remove('valid');
                    emailMsg.className = 'kb-input-msg error';
                    emailMsg.innerText = "이미 가입된 이메일입니다.";
                }
            })
            .catch(error => console.error('Error:', error));
    });


    /* =========================================
       3. 닉네임 검사
       ========================================= */
    const nickInput = document.getElementById('nickname');
    const nickMsg = document.getElementById('nick-msg');
    const checkNickBtn = document.getElementById('check-nick-btn');

    nickInput.addEventListener('input', function() {
        this.classList.remove('valid', 'invalid');
        nickMsg.style.display = 'none';
    });

    checkNickBtn.addEventListener('click', function() {
        const val = nickInput.value;
        // 한글, 영문, 숫자 2~10자
        const nickRegex = /^[가-힣a-zA-Z0-9]{2,10}$/;

        if (!nickRegex.test(val)) {
            alert("닉네임은 특수문자 제외 2~10자여야 합니다.");
            return;
        }

        fetch(`/api/check/nickname?nickname=${val}`)
            .then(response => response.json())
            .then(data => {
                nickMsg.style.display = 'block';
                if (data.available) {
                    nickInput.classList.add('valid'); nickInput.classList.remove('invalid');
                    nickMsg.className = 'kb-input-msg success';
                    nickMsg.innerText = "사용 가능한 닉네임입니다.";
                } else {
                    nickInput.classList.add('invalid'); nickInput.classList.remove('valid');
                    nickMsg.className = 'kb-input-msg error';
                    nickMsg.innerText = "이미 사용 중인 닉네임입니다.";
                }
            })
            .catch(error => console.error('Error:', error));
    });


    /* =========================================
       4. 이름 실시간 검사 (추가됨) 🌟
       ========================================= */
    const nameInput = document.getElementById('name');
    const nameMsg = document.getElementById('name-msg'); // HTML에 추가한 ID

    nameInput.addEventListener('input', function() {
        const val = this.value;
        const nameRegex = /^[가-힣a-zA-Z]{2,20}$/; // 한글 or 영문 2~20자

        nameMsg.style.display = 'block';

        if(val === '') {
            this.classList.remove('valid', 'invalid');
            nameMsg.style.display = 'none';
            return;
        }

        if (nameRegex.test(val)) {
            this.classList.add('valid'); this.classList.remove('invalid');
            nameMsg.className = 'kb-input-msg success';
            nameMsg.innerText = "올바른 이름 형식입니다.";
        } else {
            this.classList.add('invalid'); this.classList.remove('valid');
            nameMsg.className = 'kb-input-msg error';
            nameMsg.innerText = "이름은 한글 또는 영문 2자 이상 입력해주세요.";
        }
    });


    /* =========================================
       5. 비상 연락처 실시간 검사 (추가됨) 🌟
       ========================================= */
    const phoneInput = document.getElementById('emergency_contact');
    const phoneMsg = document.getElementById('phone-msg'); // HTML에 추가한 ID

    phoneInput.addEventListener('input', function() {
        let val = this.value;
        // 숫자만 남기기 (혹시 모를 붙여넣기 대응)
        val = val.replace(/[^0-9]/g, '');
        this.value = val;

        const phoneRegex = /^010\d{8}$/; // 010으로 시작하는 11자리 숫자

        phoneMsg.style.display = 'block';

        if(val === '') {
            // 선택 항목이므로 비어있으면 에러 아님 (초기화)
            this.classList.remove('valid', 'invalid');
            phoneMsg.style.display = 'none';
            return;
        }

        if (phoneRegex.test(val)) {
            this.classList.add('valid'); this.classList.remove('invalid');
            phoneMsg.className = 'kb-input-msg success';
            phoneMsg.innerText = "올바른 전화번호 형식입니다.";
        } else {
            this.classList.add('invalid'); this.classList.remove('valid');
            phoneMsg.className = 'kb-input-msg error';
            phoneMsg.innerText = "010으로 시작하는 11자리 숫자를 입력해주세요.";
        }
    });


    /* =========================================
       6. 비밀번호 로직 (기존 유지)
       ========================================= */
    const pwInput = document.getElementById('password');
    const pwConfirm = document.getElementById('password-confirm');
    const pwMatchMsg = document.getElementById('pw-match-msg');
    const pwBar = document.getElementById('pw-meter-bar');

    pwInput.addEventListener('input', function() {
        const val = this.value;
        let strength = 0;

        if(val.length >= 8) strength++;
        if(/[A-Z]/.test(val)) strength++;
        if(/[0-9]/.test(val)) strength++;
        if(/[^A-Za-z0-9]/.test(val)) strength++;

        if(val.length === 0) { pwBar.style.width = '0%'; }
        else if(val.length < 8) { pwBar.style.width = '20%'; pwBar.style.backgroundColor = '#dc3545'; }
        else {
            if(strength < 3) { pwBar.style.width = '50%'; pwBar.style.backgroundColor = '#ffc107'; }
            else { pwBar.style.width = '100%'; pwBar.style.backgroundColor = '#28a745'; }
        }
        checkPwMatch();
    });

    pwConfirm.addEventListener('input', checkPwMatch);

    function checkPwMatch() {
        if(pwConfirm.value === '') {
            pwMatchMsg.innerText = '';
            pwConfirm.classList.remove('valid', 'invalid');
            return;
        }
        if(pwInput.value === pwConfirm.value) {
            pwMatchMsg.className = 'kb-input-msg success'; pwMatchMsg.innerText = '비밀번호가 일치합니다.';
            pwConfirm.classList.add('valid'); pwConfirm.classList.remove('invalid');
        } else {
            pwMatchMsg.className = 'kb-input-msg error'; pwMatchMsg.innerText = '비밀번호가 일치하지 않습니다.';
            pwConfirm.classList.add('invalid'); pwConfirm.classList.remove('valid');
        }
    }
});