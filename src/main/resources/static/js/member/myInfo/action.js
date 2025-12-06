document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // 1. 공통 변수 및 정규식
    // ============================================================
    const regex = {
        nickname: /^[가-힣a-zA-Z0-9]{2,10}$/,
        phone: /^010\d{8}$/,
        password: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
    };

    // ============================================================
    // 2. 내 정보 수정 (닉네임, 전화번호, 주소)
    // ============================================================
    const infoForm = document.getElementById('info-update-form');
    const nickInput = document.getElementById('nickname');
    const phoneInput = document.getElementById('phone');

    // 닉네임 실시간 검사
    if(nickInput) {
        nickInput.addEventListener('input', function() {
            const msg = document.getElementById('nick-msg');
            if(!regex.nickname.test(this.value)) {
                msg.className = 'kb-val-msg error'; msg.innerText = "특수문자 제외 2~10자";
            } else {
                msg.className = 'kb-val-msg success'; msg.innerText = "사용 가능";
            }
        });
    }

    // 전화번호 실시간 검사 (숫자만)
    if(phoneInput) {
        phoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            const msg = document.getElementById('phone-msg');
            if(!regex.phone.test(this.value)) {
                msg.className = 'kb-val-msg error'; msg.innerText = "010XXXXXXXX 형식";
            } else {
                msg.className = 'kb-val-msg success'; msg.innerText = "올바른 형식";
            }
        });
    }

    // 수정 폼 제출
    if(infoForm) {
        infoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if(!regex.nickname.test(nickInput.value)) { alert("닉네임을 확인해주세요."); return; }
            if(!regex.phone.test(phoneInput.value)) { alert("전화번호를 확인해주세요."); return; }

            const data = {
                nickname: nickInput.value,
                phone: phoneInput.value,
                address: document.getElementById('address').value,
                detailAddress: document.getElementById('detailAddress').value
            };

            fetch('/api/myinfo/update', {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
            }).then(res => res.ok ? res.text() : Promise.reject(res))
                .then(() => alert("수정되었습니다."))
                .catch(() => alert("수정 실패"));
        });
    }

    // ============================================================
    // 3. 비밀번호 변경 (실시간 검사)
    // ============================================================
    const pwForm = document.getElementById('pw-change-form');
    const newPwInput = document.getElementById('new-pw');
    const confirmPwInput = document.getElementById('confirm-pw');
    const pwMsg = document.getElementById('pw-msg');
    const matchMsg = document.getElementById('pw-match-msg');

    if(newPwInput) {
        newPwInput.addEventListener('input', function() {
            if(!regex.password.test(this.value)) {
                if(pwMsg) { pwMsg.className = 'kb-val-msg error'; pwMsg.innerText = "8자 이상, 대문자/숫자/특수문자 포함"; }
            } else {
                if(pwMsg) { pwMsg.className = 'kb-val-msg success'; pwMsg.innerText = "사용 가능"; }
            }
            checkMatch();
        });
    }
    if(confirmPwInput) {
        confirmPwInput.addEventListener('input', checkMatch);
    }

    function checkMatch() {
        if(!confirmPwInput || !matchMsg) return;
        if(confirmPwInput.value === '') { matchMsg.innerText = ''; return; }

        if(newPwInput.value === confirmPwInput.value) {
            matchMsg.className = 'kb-val-msg success'; matchMsg.innerText = "일치합니다.";
        } else {
            matchMsg.className = 'kb-val-msg error'; matchMsg.innerText = "일치하지 않습니다.";
        }
    }

    if(pwForm) {
        pwForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const currentPw = document.getElementById('current-pw').value;
            const securityAnswer = document.getElementById('security-answer').value;
            const newPw = newPwInput.value;

            if(!currentPw || !securityAnswer || !newPw) { alert("모든 정보를 입력해주세요."); return; }
            if(!regex.password.test(newPw)) { alert("새 비밀번호 형식을 확인해주세요."); return; }
            if(newPw !== confirmPwInput.value) { alert("비밀번호가 일치하지 않습니다."); return; }

            const data = { currentPassword: currentPw, securityAnswer: securityAnswer, newPassword: newPw };

            fetch('/api/myinfo/change-pw', {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
            }).then(res => {
                if(res.ok) return res.text();
                return res.text().then(text => { throw new Error(text) });
            })
                .then(() => {
                    alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
                    location.href = "/logout";
                })
                .catch(err => alert(err.message));
        });
    }

    // ============================================================
    // 4. 주소 검색 (Daum Postcode)
    // ============================================================
    const searchBtn = document.getElementById('search-addr-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            new daum.Postcode({
                oncomplete: function(data) {
                    document.getElementById('address').value = data.address;
                    document.getElementById('detailAddress').focus();
                }
            }).open();
        });
    }

    // ============================================================
    // 5. 회원 탈퇴
    // ============================================================
    const withdrawalForm = document.getElementById('withdrawal-form');
    if (withdrawalForm) {
        withdrawalForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const agree = document.getElementById('withdrawal-agree');
            const pwInput = document.getElementById('withdrawal-pw');

            if (!agree.checked) { alert("회원 탈퇴 안내 사항에 동의해주세요."); return; }
            if (!pwInput.value) { alert("비밀번호를 입력해주세요."); pwInput.focus(); return; }
            if (!confirm("정말로 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.")) return;

            try {
                const res = await fetch('/api/member/withdraw', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: pwInput.value })
                });
                if (res.ok) {
                    alert("탈퇴가 완료되었습니다.");
                    window.location.href = "/";
                } else {
                    const msg = await res.text();
                    alert("탈퇴 실패: " + msg);
                }
            } catch (err) { alert("서버 오류가 발생했습니다."); }
        });
    }

    // ============================================================
    // 🌟 6. 문의하기 (신규 기능)
    // ============================================================
    const inquiryForm = document.getElementById('inquiry-form');
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const title = document.getElementById('inq-title').value;
            const content = document.getElementById('inq-content').value;

            if (!title || !content) {
                alert("제목과 내용을 모두 입력해주세요.");
                return;
            }

            // InquiryController의 @ModelAttribute에 맞게 FormData 사용
            const formData = new FormData(inquiryForm);

            try {
                // 기존 InquiryController의 /inquiry/write 주소로 전송
                const res = await fetch('/inquiry/write', {
                    method: 'POST',
                    body: formData // JSON 대신 FormData 전송
                });

                if (res.ok) {
                    alert("문의가 등록되었습니다.");
                    location.reload(); // 페이지 새로고침하여 목록 갱신
                } else {
                    alert("등록에 실패했습니다.");
                }
            } catch (err) {
                console.error(err);
                alert("오류가 발생했습니다.");
            }
        });
    }
});


// ============================================================
// 🌟 전역 함수들 (HTML onclick에서 호출)
// ============================================================

// 1. 문의 화면 토글 (목록 <-> 작성)
window.toggleInquiryView = function(mode) {
    const listView = document.getElementById('inquiry-view-list');
    const writeView = document.getElementById('inquiry-view-write');

    if (mode === 'write') {
        listView.style.display = 'none';
        writeView.style.display = 'block';
    } else {
        writeView.style.display = 'none';
        listView.style.display = 'block';
        document.getElementById('inquiry-form').reset(); // 입력창 초기화
    }
};

// 2. 게시글 상세 보기 (모달 띄우기)
window.viewPost = async function(boardId) {
    try {
        const res = await fetch(`/api/board/${boardId}`);
        if (res.ok) {
            const data = await res.json();
            showPostModal(data);
        } else { alert("게시글을 불러올 수 없습니다."); }
    } catch (e) { console.error(e); alert("오류가 발생했습니다."); }
};

// 3. 모달 UI 렌더링
function showPostModal(data) {
    const modal = document.getElementById('post-view-modal');
    const body = document.getElementById('post-view-body');

    let badgeClass = 'badge-talk';
    if(data.category === '제보') badgeClass = 'badge-report';
    else if(data.category === '질문') badgeClass = 'badge-qna';

    let imageHtml = '';
    if(data.imageUrl) {
        imageHtml = `<img src="${data.imageUrl}" class="kb-post-img" alt="게시글 이미지">`;
    }

    let commentsHtml = '';
    if(data.comments && data.comments.length > 0) {
        commentsHtml = data.comments.map(c =>
            `<li class="kb-post-comment-item">
                <span class="kb-post-comment-writer">${c.writer}</span>
                <span>${c.content}</span>
            </li>`
        ).join('');
    } else {
        commentsHtml = '<li style="color:#999; text-align:center; padding:10px;">댓글이 없습니다.</li>';
    }

    body.innerHTML = `
        <div class="kb-post-meta">
            <span class="kb-post-badge ${badgeClass}">${data.category}</span>
            <span>${data.writer}</span>
            <span style="color:#ccc;">|</span>
            <span>${data.date}</span>
            <span style="margin-left:auto;">❤️ ${data.likeCount}</span>
        </div>
        <h3 style="margin-bottom:15px; font-size:18px;">${data.title}</h3>
        ${imageHtml}
        <div class="kb-post-text">${data.content}</div>
        
        <div class="kb-post-comments-area">
            <div class="kb-post-comments-title">댓글 (${data.comments.length})</div>
            <ul class="kb-post-comment-list">${commentsHtml}</ul>
        </div>
    `;

    modal.style.display = 'flex';
}

// 4. 모달 닫기
window.closePostModal = function() {
    document.getElementById('post-view-modal').style.display = 'none';
};

// 5. 게시글 삭제
window.deleteBoard = async function(boardId) {
    // 이벤트 버블링 방지
    if(window.event) window.event.stopPropagation();

    if (!confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;

    try {
        const res = await fetch(`/api/board/${boardId}`, { method: 'DELETE' });
        if (res.ok) {
            alert("삭제되었습니다.");
            location.reload(); // 목록 새로고침
        } else {
            alert("삭제에 실패했습니다.");
        }
    } catch (e) {
        console.error(e);
        alert("오류가 발생했습니다.");
    }
};