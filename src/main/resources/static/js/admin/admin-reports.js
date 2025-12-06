// ================================
// 관리자 신고 관리 JS
// 파일명: admin-reports.js
// ================================


// ------- Toast 메시지 -------
function showAdminToast(msg, isError = false) {
    let t = document.getElementById('admin-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'admin-toast';
        t.style.position = 'fixed';
        t.style.left = '50%';
        t.style.bottom = '40px';
        t.style.transform = 'translateX(-50%)';
        t.style.padding = '10px 16px';
        t.style.borderRadius = '6px';
        t.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
        t.style.zIndex = 99999;
        t.style.fontSize = '13px';
        t.style.transition = 'opacity 0.3s';
        document.body.appendChild(t);
    }

    t.innerText = msg;
    t.style.background = isError ? '#dc2626' : '#0f172a';
    t.style.color = '#fff';
    t.style.opacity = '1';

    setTimeout(() => t.style.opacity = '0', 2200);
}



// ================================
//  게시글 상세 모달 띄우기
// ================================
async function openPostModal(id) {
    const modal = document.getElementById('postModal');
    const contentEl = document.getElementById('modal-content');

    modal.style.display = 'flex';
    contentEl.innerHTML = `<div style="color:#6b7280;">불러오는 중...</div>`;

    try {
        const res = await fetch(`/api/admin/board/${id}`);
        if (!res.ok) throw new Error("게시글을 불러올 수 없습니다");

        const b = await res.json();
        contentEl.innerHTML = buildPostHtml(b);

    } catch (e) {
        console.error(e);
        contentEl.innerHTML =
            `<div style="color:#dc2626;">게시글 불러오기 실패<br><small>${escapeHtml(e.message)}</small></div>`;
        showAdminToast("게시글 불러오기 실패", true);
    }
}


// ------- 모달 닫기 -------
function closePostModal() {
    document.getElementById('postModal').style.display = 'none';
}



// ================================
//  게시글 HTML 렌더링
// ================================
function buildPostHtml(b) {
    const title = escapeHtml(b.title || '(제목 없음)');
    const writer = escapeHtml(b.writer || '(작성자 없음)');
    const date = escapeHtml(b.createdAt || '');
    const content = escapeHtml(b.content || '');
    const locationType = b.locationType ? `<div class="meta">위치유형: ${escapeHtml(b.locationType)}</div>` : '';
    const image = b.imageUrl ? `<img src="${escapeAttr(b.imageUrl)}">` : '';

    return `
        <div>
            <div class="title">${title}</div>
            <div class="meta">작성자: ${writer} · ${date}</div>

            <div class="body">${content}</div>

            ${image}
            ${locationType}

            <div style="margin-top:18px; text-align:right;">
                <button class="btn-action-sm" onclick="closePostModal()">닫기</button>
            </div>
        </div>
    `;
}



// ================================
// 신고 상태 업데이트
// ================================
async function updateStatus(reportId, newStatus) {
    if (!confirm("정말 처리 완료 표시를 하시겠습니까?")) return;

    try {
        const res = await fetch(`/api/admin/reports/${reportId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });

        if (!res.ok) throw new Error("상태 변경 실패");

        showAdminToast("처리되었습니다.");
        setTimeout(() => location.reload(), 600);

    } catch (e) {
        console.error(e);
        alert("처리 실패: " + e.message);
    }
}



// ================================
// 안전 HTML escape
// ================================
function escapeHtml(s) {
    if (!s) return "";
    return String(s).replace(/[&<>"'`=/]/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#x2F;",
        "=": "&#x3D;",
        "`": "&#x60;"
    }[c]));
}

function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "&quot;");
}



// ================================
// 전역 함수 등록
// ================================
window.openPostModal = openPostModal;
window.closePostModal = closePostModal;
window.updateStatus = updateStatus;
