import { map } from './map-core.js';
import { showToast, toggleLoading, openReportModal } from './map-ui.js';

let isWriteMode = false;
let tempMarker = null;
let currentOverlay = null;
let stompClient = null;
let boardMarkers = [];

const BOARD_MARKERS = {
    '제보': '/img/board/report.png',
    '질문': '/img/board/question.png',
    '잡담': '/img/board/talk.png',
    'default': 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png'
};

export function setupBoardLogic() {
    const btnWrite = document.getElementById('btn-mode-write');
    if(btnWrite) {
        btnWrite.addEventListener('click', () => {
            if(isWriteMode) { disableWriteMode(); return; }
            document.getElementById('write-mode-modal').style.display = 'block';
        });
    }

    document.getElementById('btn-mode-gps').onclick = () => {
        document.getElementById('write-mode-modal').style.display = 'none';
        if (!navigator.geolocation) { showToast("GPS 불가", true); return; }
        toggleLoading(true, "위치 인증 중...");
        navigator.geolocation.getCurrentPosition((pos) => {
            toggleLoading(false);
            openWriteModal(pos.coords.latitude, pos.coords.longitude, 'GPS');
        }, () => { toggleLoading(false); showToast("위치 확인 실패", true); });
    };

    document.getElementById('btn-mode-map').onclick = () => {
        document.getElementById('write-mode-modal').style.display = 'none';
        isWriteMode = true;
        btnWrite.classList.add('active');
        showToast("지도 위를 클릭하세요! 🖊️");
        map.setCursor('crosshair');
    };

    kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
        if(!isWriteMode) return;
        openWriteModal(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng(), 'MANUAL');
    });

    const imgModal = document.getElementById('image-view-modal');
    if(imgModal) {
        document.querySelector('.image-view-close').onclick = () => imgModal.style.display = "none";
        imgModal.onclick = (e) => { if(e.target === imgModal) imgModal.style.display = "none"; };
    }

    connectWebSocket();
    loadBoards();

    // 차단 후 새로고침을 위한 전역 함수
    window.reloadBoardData = () => {
        if(currentOverlay) currentOverlay.setMap(null);
        loadBoards();
    };
}

function connectWebSocket() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    stompClient.debug = null;
    stompClient.connect({}, function () {
        stompClient.subscribe('/topic/board/new', function (msg) {
            const newBoard = JSON.parse(msg.body);
            // 차단된 유저 필터링
            const blockedUsers = JSON.parse(localStorage.getItem('safety_blocked_users')) || [];
            if(!blockedUsers.includes(newBoard.writer)) {
                addBoardMarker(newBoard);
                showToast(`새 글 등록: ${newBoard.title}`);
            }
        });
        stompClient.subscribe('/topic/board/delete', function () { loadBoards(); });
        stompClient.subscribe('/topic/board/comment', function (msg) {
            const data = JSON.parse(msg.body);
            const overlay = document.querySelector('.board-overlay');
            if (overlay && overlay.dataset.boardId == data.boardId) {
                appendRealtimeComment(data.comment, data.parentId, data.boardId);
            }
        });
        stompClient.subscribe('/topic/board/like', function (msg) {
            const data = JSON.parse(msg.body);
            const cnt = document.getElementById(`like-count-${data.boardId}`);
            if(cnt) cnt.innerText = data.totalLikes;
        });
    });
}

function openWriteModal(lat, lng, type) {
    if(tempMarker) tempMarker.setMap(null);
    tempMarker = new kakao.maps.Marker({ position: new kakao.maps.LatLng(lat, lng), map: map });
    const modal = document.getElementById('board-modal');
    modal.style.display = 'block';
    document.getElementById('board-lat').value = lat;
    document.getElementById('board-lon').value = lng;
    document.getElementById('board-location-type').value = type;
    document.getElementById('board-image').value = '';
}

function disableWriteMode() {
    isWriteMode = false;
    const btn = document.getElementById('btn-mode-write');
    if(btn) btn.classList.remove('active');
    map.setCursor('default');
    if(tempMarker) { tempMarker.setMap(null); tempMarker = null; }
    document.getElementById('board-modal').style.display = 'none';
    document.getElementById('write-mode-modal').style.display = 'none';
}

export async function saveBoard() {
    const title = document.getElementById('board-title').value;
    const content = document.getElementById('board-content').value;
    const category = document.getElementById('board-category').value;
    const lat = document.getElementById('board-lat').value;
    const lon = document.getElementById('board-lon').value;
    const locType = document.getElementById('board-location-type').value;
    const imageInput = document.getElementById('board-image');

    if(!title || !content) { alert("내용을 입력해주세요."); return; }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    formData.append('latitude', lat);
    formData.append('longitude', lon);
    formData.append('locationType', locType);
    if(imageInput.files[0]) formData.append('imageFile', imageInput.files[0]);

    try {
        const res = await fetch('/api/board', { method: 'POST', body: formData });
        if(res.ok) {
            showToast("게시글 등록 완료!");
            document.getElementById('board-title').value = '';
            document.getElementById('board-content').value = '';
            imageInput.value = '';
            disableWriteMode();
        } else { showToast("로그인 필요", true); }
    } catch(e) { console.error(e); }
}

async function deleteBoard(id) {
    if(!confirm("삭제하시겠습니까?")) return;
    try {
        const res = await fetch(`/api/board/${id}`, { method: 'DELETE' });
        if(res.ok) {
            showToast("삭제되었습니다.");
            if(currentOverlay) currentOverlay.setMap(null);
        } else { showToast("삭제 권한 없음", true); }
    } catch(e) { console.error(e); }
}
window.deleteBoardPost = deleteBoard;

async function loadBoards() {
    try {
        const res = await fetch('/api/board');
        if(!res.ok) return;
        const boards = await res.json();

        const blockedUsers = JSON.parse(localStorage.getItem('safety_blocked_users')) || [];

        boardMarkers.forEach(m => m.setMap(null));
        boardMarkers = [];

        boards.forEach(board => {
            if(!blockedUsers.includes(board.writer)) {
                addBoardMarker(board);
            }
        });
    } catch(e) {}
}

function addBoardMarker(board) {
    const pos = new kakao.maps.LatLng(board.latitude, board.longitude);
    const imgSrc = BOARD_MARKERS[board.category] || BOARD_MARKERS.default;
    const imageSize = new kakao.maps.Size(60, 60);

    const marker = new kakao.maps.Marker({
        position: pos,
        map: map,
        image: new kakao.maps.MarkerImage(imgSrc, imageSize)
    });

    kakao.maps.event.addListener(marker, 'click', () => showBoardOverlay(marker, board));
    boardMarkers.push(marker);
}

// 🌟 [핵심 수정] 오버레이 표시 함수
export function showBoardOverlay(marker, data) {
    if(currentOverlay) currentOverlay.setMap(null);

    const imageHtml = data.imageUrl ? `<img src="${data.imageUrl}" class="board-image-thumbnail" alt="이미지">` : '';
    const verifiedHtml = data.locationType === 'GPS' ? `<span class="verified-badge">✅ 현위치</span>` : '';

    // 삭제 버튼 (내 글인 경우)
    const deleteHtml = data.canDelete ? `<span class="board-delete-btn" onclick="window.deleteBoardPost(${data.id})">🗑️</span>` : '';

    // 🌟 [수정] 신고 버튼 (내 글이 아닐 때만 표시)
    // data.canDelete가 true이면(내 글 or 관리자) 신고 버튼을 아예 생성하지 않음 -> 차단 불가
    const reportHtml = !data.canDelete ?
        `<span class="board-report-btn" id="btn-report-${data.id}" title="신고하기" style="cursor:pointer; margin-left:8px; font-size:14px;">🚨</span>`
        : '';

    const commentHtml = renderComments(data.comments, 3);

    const content = document.createElement('div');
    content.className = 'board-overlay';
    content.dataset.boardId = data.id;
    content.dataset.boardData = JSON.stringify(data);

    content.innerHTML = `
        <div class="board-header">
            <div class="board-writer">
                <span class="board-badge ${data.category}">${data.category}</span> 
                ${data.writer} ${verifiedHtml}
            </div>
            <div style="display:flex; align-items:center;">
                <span class="board-date">${data.date}</span>
                ${deleteHtml}
                ${reportHtml} <!-- 🌟 조건부 렌더링 -->
                <span class="board-close" style="margin-left:10px;">✕</span>
            </div>
        </div>
        <div class="board-body">
            ${imageHtml}
            <span class="board-title">${data.title}</span>
            <div class="board-content">${data.content}</div>
        </div>
        <div class="board-actions">
            <div class="action-btn like-btn ${data.liked ? 'liked' : ''}" id="like-btn-${data.id}">
                ${data.liked ? '❤️' : '🤍'} <span id="like-count-${data.id}">${data.likeCount}</span>
            </div>
            <div class="action-btn">💬 <span id="comment-count-${data.id}">${data.comments.length}</span></div>
        </div>
        <div class="board-comments">
            <ul class="comment-list" id="main-comment-list-${data.id}">${commentHtml}</ul>
            <div class="comment-form">
                <input type="text" class="comment-input" placeholder="댓글..." id="comment-input-${data.id}">
                <button class="comment-submit" onclick="window.submitComment(${data.id}, null)">게시</button>
            </div>
        </div>
    `;

    if (data.imageUrl) {
        content.querySelector('.board-image-thumbnail').onclick = () => {
            document.getElementById('full-image').src = data.imageUrl;
            document.getElementById('image-view-modal').style.display = "flex";
        };
    }
    content.querySelector('.board-close').onclick = () => overlay.setMap(null);

    // 🌟 [수정] 내 글이 아닐 때만 신고 이벤트 연결
    if (!data.canDelete) {
        const reportBtn = content.querySelector(`#btn-report-${data.id}`);
        if(reportBtn) {
            reportBtn.onclick = () => {
                openReportModal('BOARD', data.id, data.title, data.writer);
            };
        }
    }

    content.querySelector('.like-btn').onclick = async function() {
        const res = await fetch(`/api/board/${data.id}/like`, { method: 'POST' });
        if(!res.ok) showToast("로그인 필요", true);
    };

    const overlay = new kakao.maps.CustomOverlay({
        content: content, map: map, position: marker.getPosition(), yAnchor: 1.15, zIndex: 10000
    });
    currentOverlay = overlay;
}

function renderComments(comments, limit = 0) {
    if (!comments || comments.length === 0) return '';
    let list = comments;
    let hidden = 0;
    if (limit > 0 && comments.length > limit) {
        list = comments.slice(0, limit);
        hidden = comments.length - limit;
    }

    let html = list.map(c => `
        <li class="comment-item" id="comment-${c.id}">
            <div class="comment-bubble">
                <div class="comment-header">
                    <span class="comment-writer" style="color:#337cf4;">${c.writer}</span>
                    <span class="comment-time">${c.timeAgo}</span>
                    <span class="btn-reply" onclick="window.toggleReplyForm(${c.id})">답글</span>
                </div>
                <div class="comment-text">${c.content}</div>
            </div>
            <ul class="reply-list" id="reply-list-${c.id}">${renderComments(c.replies)}</ul>
            <div id="reply-form-${c.id}" style="display:none;"></div>
        </li>
    `).join('');

    if (hidden > 0) {
        html += `<button class="btn-more-comments" onclick="window.expandComments(this)">댓글 ${hidden}개 더보기 ▼</button>`;
    }
    return html;
}

window.expandComments = function(btn) {
    const overlay = btn.closest('.board-overlay');
    const data = JSON.parse(overlay.dataset.boardData);
    const list = overlay.querySelector('.comment-list');
    list.innerHTML = renderComments(data.comments, 0);
};

window.submitComment = async function(boardId, parentId) {
    const inputId = parentId ? `reply-input-${parentId}` : `comment-input-${boardId}`;
    const input = document.getElementById(inputId);
    if(!input.value) return;

    const payload = { content: input.value };
    if(parentId) payload.parentId = parentId;

    const res = await fetch(`/api/board/${boardId}/comment`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
    });
    if(res.ok) input.value = '';
    else showToast("로그인 필요", true);
};

function appendRealtimeComment(comment, parentId, boardId) {
    const html = `
        <li class="comment-item" id="comment-${comment.id}">
            <div class="comment-bubble">
                <div class="comment-header">
                    <span class="comment-writer" style="color:#337cf4;">${comment.writer}</span>
                    <span class="comment-time">${comment.timeAgo}</span>
                    <span class="btn-reply" onclick="window.toggleReplyForm(${comment.id})">답글</span>
                </div>
                <div class="comment-text">${comment.content}</div>
            </div>
            <ul class="reply-list" id="reply-list-${comment.id}"></ul>
            <div id="reply-form-${comment.id}" style="display:none;"></div>
        </li>`;

    if(parentId && parentId !== -1) {
        const pList = document.getElementById(`reply-list-${parentId}`);
        if(pList) {
            pList.insertAdjacentHTML('beforeend', html);
            const form = document.getElementById(`reply-form-${parentId}`);
            if(form) form.style.display = 'none';
        }
    } else {
        const list = document.getElementById(`main-comment-list-${boardId}`);
        if(list) {
            const moreBtn = list.querySelector('.btn-more-comments');
            if(moreBtn) moreBtn.insertAdjacentHTML('beforebegin', html);
            else list.insertAdjacentHTML('beforeend', html);
            list.scrollTop = list.scrollHeight;
        }
    }
    const cnt = document.getElementById(`comment-count-${boardId}`);
    if(cnt) cnt.innerText = parseInt(cnt.innerText) + 1;
}

window.toggleReplyForm = function(cid) {
    const box = document.getElementById(`reply-form-${cid}`);
    if(box.style.display === 'block') { box.style.display = 'none'; }
    else {
        const overlay = box.closest('.board-overlay');
        const boardId = overlay.dataset.boardId;
        box.innerHTML = `
            <div class="reply-form">
                <input type="text" class="reply-input" placeholder="답글..." id="reply-input-${cid}">
                <button class="reply-submit" onclick="window.submitComment(${boardId}, ${cid})">등록</button>
            </div>`;
        box.style.display = 'block';
        document.getElementById(`reply-input-${cid}`).focus();
    }
};