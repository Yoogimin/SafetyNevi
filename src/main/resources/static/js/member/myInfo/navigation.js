document.addEventListener('DOMContentLoaded', function() {
    const menuItems = document.querySelectorAll('.kb-menu-item');
    const sections = document.querySelectorAll('.kb-content-section');

    // URL 해시값 체크 (예: myInfo#password -> 비밀번호 탭 열기)
    const hash = window.location.hash.substring(1);
    if(hash) switchTab(hash);

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            switchTab(target);
        });
    });

    function switchTab(targetId) {
        // 메뉴 활성화
        menuItems.forEach(i => i.classList.remove('kb-active'));
        const activeBtn = document.querySelector(`.kb-menu-item[data-target="${targetId}"]`);
        if(activeBtn) activeBtn.classList.add('kb-active');

        // 섹션 전환
        sections.forEach(sec => sec.style.display = 'none');
        const targetSec = document.getElementById(targetId + '-section');
        if(targetSec) targetSec.style.display = 'block';
    }
});