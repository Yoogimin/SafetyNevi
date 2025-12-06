/**
 * [Search] 시설명 검색 및 최근 검색어 (LocalStorage)
 */
import { map } from './map-core.js';
import { updateSidebar } from './map-ui.js';

export function setupSearchLogic() {
    const toggleBtn = document.getElementById('btn-search-toggle');
    const closeBtn = document.getElementById('btn-search-close');
    const searchPanel = document.getElementById('kb-search-panel');
    const searchInput = document.getElementById('kb-search-input');
    const searchExecBtn = document.getElementById('btn-search-exec');
    const resultList = document.getElementById('kb-search-results');
    const recentArea = document.getElementById('kb-recent-area');
    const recentClearBtn = document.getElementById('btn-recent-clear');

    if (!toggleBtn || !searchPanel) return;

    // 1. 검색창 열기/닫기
    toggleBtn.addEventListener('click', () => {
        if (searchPanel.style.display === 'none') {
            searchPanel.style.display = 'block';
            searchInput.focus();
            showRecentSearches(); // 열릴 때 최근 검색어 보여주기
        } else {
            searchPanel.style.display = 'none';
        }
    });

    closeBtn.addEventListener('click', () => {
        searchPanel.style.display = 'none';
        resultList.classList.remove('show');
    });

    // 2. 검색 실행
    const executeSearch = async () => {
        const keyword = searchInput.value.trim();
        if (keyword.length < 2) {
            alert("검색어를 2글자 이상 입력하세요.");
            return;
        }

        saveKeyword(keyword); // 🌟 저장
        recentArea.style.display = 'none'; // 최근검색어 숨김

        try {
            const response = await fetch(`/api/facilities/search?keyword=${encodeURIComponent(keyword)}`);
            if (!response.ok) throw new Error("Search failed");
            const results = await response.json();
            renderResults(results, keyword);
        } catch (e) {
            console.error(e);
            alert("검색 중 오류가 발생했습니다.");
        }
    };

    searchExecBtn.addEventListener('click', executeSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            executeSearch();
        }
    });

    // 3. 인풋 포커스 시 최근 검색어 노출
    searchInput.addEventListener('focus', () => {
        if (searchInput.value === '') showRecentSearches();
    });

    // 4. 최근 검색어 전체 삭제
    if (recentClearBtn) {
        recentClearBtn.addEventListener('click', () => {
            localStorage.removeItem('safety_recent_search');
            showRecentSearches();
        });
    }

    // --- Helper Functions ---

    // 최근 검색어 렌더링
    function showRecentSearches() {
        const history = JSON.parse(localStorage.getItem('safety_recent_search')) || [];
        const listEl = document.getElementById('kb-recent-list');

        if (history.length === 0) {
            recentArea.style.display = 'none';
            return;
        }

        listEl.innerHTML = '';
        history.forEach((item) => {
            const li = document.createElement('li');
            li.className = 'kb-recent-item';
            li.innerHTML = `<span>🕒 ${item}</span> <span class="btn-recent-del">✕</span>`;

            // 검색 실행
            li.addEventListener('click', (e) => {
                if(e.target.classList.contains('btn-recent-del')) return;
                searchInput.value = item;
                executeSearch();
            });

            // 개별 삭제
            li.querySelector('.btn-recent-del').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteKeyword(item);
            });

            listEl.appendChild(li);
        });

        resultList.classList.remove('show'); // 기존 결과 숨김
        recentArea.style.display = 'block'; // 최근 검색어 보임
    }

    // 키워드 저장
    function saveKeyword(keyword) {
        let history = JSON.parse(localStorage.getItem('safety_recent_search')) || [];
        // 중복 제거
        history = history.filter(k => k !== keyword);
        // 앞에 추가
        history.unshift(keyword);
        // 5개 제한
        if (history.length > 5) history.pop();
        localStorage.setItem('safety_recent_search', JSON.stringify(history));
    }

    // 키워드 삭제
    function deleteKeyword(keyword) {
        let history = JSON.parse(localStorage.getItem('safety_recent_search')) || [];
        history = history.filter(k => k !== keyword);
        localStorage.setItem('safety_recent_search', JSON.stringify(history));
        showRecentSearches();
    }

    // 결과 렌더링 (기존 로직)
    function renderResults(data, keyword) {
        resultList.innerHTML = '';
        if (data.length === 0) {
            resultList.innerHTML = '<li style="padding:15px; text-align:center; color:#888;">검색 결과가 없습니다.</li>';
            resultList.classList.add('show');
            return;
        }
        data.forEach(item => {
            const li = document.createElement('li');
            li.className = 'kb-search-item';
            const regex = new RegExp(`(${keyword})`, 'gi');
            const highlightedName = item.name.replace(regex, '<span class="highlight-text">$1</span>');

            let typeLabel = item.type === 'police' ? '경찰서' : item.type === 'fire' ? '소방서' : item.type === 'hospital' ? '병원' : '대피소';

            li.innerHTML = `
                <div class="search-item-info">
                    <div class="search-item-name">${highlightedName}</div>
                    <div class="search-item-address">${item.address || '주소 정보 없음'}</div>
                </div>
                <div class="search-item-category">${typeLabel}</div>
            `;

            li.addEventListener('click', async () => {
                if (item.latitude && item.longitude) {
                    const moveLatLon = new kakao.maps.LatLng(item.latitude, item.longitude);
                    map.setCenter(moveLatLon);
                    map.setLevel(3);
                }
                try {
                    const detailRes = await fetch(`/api/facilities/detail/${item.id}`);
                    if(detailRes.ok) {
                        const detailData = await detailRes.json();
                        updateSidebar(detailData);
                    }
                } catch(e) { console.error(e); }
            });
            resultList.appendChild(li);
        });
        resultList.classList.add('show');
    }
}