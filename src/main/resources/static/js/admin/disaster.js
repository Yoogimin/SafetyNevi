/* /js/admin/disaster.js */
const geocoder = new kakao.maps.services.Geocoder();

// 1. 주소 검색
document.getElementById('search-address-btn').addEventListener('click', () => {
    new daum.Postcode({
        oncomplete: function(data) {
            document.getElementById('address').value = data.address;
            let sigungu = data.sigungu;
            if(!sigungu && data.address.split(' ').length > 1) sigungu = data.address.split(' ')[1];

            document.getElementById('areaName').value = sigungu;
            document.getElementById('areaName-display').value = sigungu || "지역명 확인 불가";

            geocoder.addressSearch(data.address, function(result, status) {
                if (status === kakao.maps.services.Status.OK) {
                    document.getElementById('lat').value = result[0].y;
                    document.getElementById('lon').value = result[0].x;
                }
            });
        }
    }).open();
});

// 2. 현황 로드
async function loadActiveDisasters() {
    const tbody = document.getElementById('disaster-list-body');
    try {
        const response = await fetch('/api/disaster-zones');
        const data = await response.json();
        tbody.innerHTML = '';
        if(data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:#94a3b8;">현재 발령된 재난이 없습니다. ✅</td></tr>';
            return;
        }
        data.forEach(item => {
            const tr = document.createElement('tr');
            let locationText = item.areaName ? `[지역] ${item.areaName}` : `[좌표] ${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`;
            let badgeColor = item.disasterType.includes('fire') ? '#ef4444' : '#3b82f6';

            tr.innerHTML = `
                <td>#${item.id}</td>
                <td><span class="status-badge" style="background-color:${badgeColor}">${item.disasterType}</span></td>
                <td>${locationText}</td>
                <td>진행중</td>
                <td><button class="btn-danger-soft" onclick="deleteDisaster(${item.id})">종료</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error(e); }
}

// 3. 재난 종료
window.deleteDisaster = async function(id) {
    if(!confirm("종료하시겠습니까?")) return;
    try {
        const res = await fetch(`/api/admin/disaster/${id}`, { method: 'DELETE' });
        if(res.ok) loadActiveDisasters();
    } catch(e) { alert("오류 발생"); }
};

// 4. 재난 발령 요청
async function requestSimulate(url, payload) {
    try {
        const params = new URLSearchParams(payload).toString();
        const res = await fetch(url + '?' + params, { method: 'POST' });
        if(!res.ok) throw new Error();
        alert("재난 경보가 발령되었습니다!");
        loadActiveDisasters();
    } catch(e) { alert("발령 실패"); }
}

document.getElementById('simulate-btn-circle').addEventListener('click', () => {
    const lat = document.getElementById('lat').value;
    if(!lat) return alert("주소를 검색하세요.");
    requestSimulate('/api/admin/simulate', {
        lat: lat, lon: document.getElementById('lon').value,
        type: document.getElementById('type-circle').value,
        radius: document.getElementById('radius').value,
        durationMinutes: document.getElementById('duration-circle').value
    });
});

document.getElementById('simulate-btn-area').addEventListener('click', () => {
    const area = document.getElementById('areaName').value;
    if(!area) return alert("지역명을 확인하세요.");
    requestSimulate('/api/admin/simulate-area', {
        areaName: area,
        type: document.getElementById('type-area').value,
        durationMinutes: document.getElementById('duration-area').value
    });
});

loadActiveDisasters();