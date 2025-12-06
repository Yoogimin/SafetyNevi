/**
 * [Marker] 시설물 마커 관리 및 커스텀 오버레이 관리 (크기 복구됨)
 */
import { map, clusterer } from './map-core.js';
import { updateSidebar, toggleLoading } from './map-ui.js';

let markerImages = {};
let currentOverlay = null;

// 🌟 1. 마커 이미지 설정 (크기 100x100 복구)
export function setupMarkerImages() {
    if (typeof kakao === 'undefined') {
        console.error("Kakao Maps API가 로드되지 않았습니다.");
        return;
    }

    const imageSize = new kakao.maps.Size(100, 100); // 🌟 원래 크기로 복구
    const options = { offset: new kakao.maps.Point(50, 90) }; // 🌟 중심점 조정

    // 기본 마커
    markerImages.fire = new kakao.maps.MarkerImage('/img/markers/marker_fire.png', imageSize, options);
    markerImages.police = new kakao.maps.MarkerImage('/img/markers/marker_police.png', imageSize, options);
    markerImages.hospital = new kakao.maps.MarkerImage('/img/markers/marker_hospital.png', imageSize, options);

    // 대피소 기본
    markerImages.shelter = new kakao.maps.MarkerImage('/img/markers/marker_shelter.png', imageSize, options);

    // 상태별 마커
    markerImages.default = new kakao.maps.MarkerImage('/img/markers/marker_default.png', imageSize, options);
    markerImages.resting = new kakao.maps.MarkerImage('/img/markers/marker_resting.png', imageSize, options);

    // 대피소 등급별 마커
    markerImages.shelter_high = new kakao.maps.MarkerImage('/img/markers/marker_shelter_high.png', imageSize, options);
    markerImages.shelter_mid = new kakao.maps.MarkerImage('/img/markers/marker_shelter_mid.png', imageSize, options);
    markerImages.shelter_low = new kakao.maps.MarkerImage('/img/markers/marker_shelter_low.png', imageSize, options);
}

// 2. 마커 업데이트 (API 호출)
export async function updateMarkers() {
    // 방어 코드: 이미지가 로드되지 않았다면 다시 시도
    if (Object.keys(markerImages).length === 0) {
        setupMarkerImages();
    }

    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const boundsParams = `swLat=${sw.getLat()}&swLng=${sw.getLng()}&neLat=${ne.getLat()}&neLng=${ne.getLng()}`;
    const facilityTypes = getCheckedTypes();

    clusterer.clear();
    if(currentOverlay) currentOverlay.setMap(null);

    if (facilityTypes.length === 0) {
        if(window.calculateSafetyScore) window.calculateSafetyScore([]);
        return;
    }

    // toggleLoading(true, "시설 탐색 중..."); // 로딩바가 거슬리면 주석 처리

    const requests = facilityTypes.map(type => {
        return fetch(`/api/facilities?type=${type}&${boundsParams}`).then(res => res.json());
    });

    try {
        const results = await Promise.all(requests);
        const allFacilities = results.flat();

        if (allFacilities.length > 0) {
            drawMarkers(allFacilities);
            if(window.calculateSafetyScore) window.calculateSafetyScore(allFacilities);
        } else {
            if(window.calculateSafetyScore) window.calculateSafetyScore([]);
        }
    } catch (error) {
        console.error('시설 데이터 로드 실패:', error);
    } finally {
        // toggleLoading(false);
    }
}

function drawMarkers(facilities) {
    const newMarkers = facilities.map(facility => {
        const position = new kakao.maps.LatLng(facility.latitude, facility.longitude);

        let markerImage = getMarkerImage(facility);
        if(!markerImage) markerImage = markerImages.default;

        const marker = new kakao.maps.Marker({ position: position, image: markerImage });

        kakao.maps.event.addListener(marker, 'click', function() {
            showCustomOverlay(marker, facility);
        });
        return marker;
    });
    clusterer.addMarkers(newMarkers);
}

// 3. 마커 이미지 결정
function getMarkerImage(facility) {
    const type = (facility.type || "").toLowerCase();
    const status = facility.operatingStatus;
    const capacity = facility.maxCapacity || 0;

    if (status && (status.includes('휴업') || status.includes('일시중지'))) return markerImages.resting;
    if (status && (status.includes('폐업') || status.includes('취소'))) return markerImages.default;

    if (type === 'police') return markerImages.police;
    if (type === 'fire') return markerImages.fire;
    if (type === 'hospital') return markerImages.hospital;

    if (type === 'shelter') {
        if (capacity >= 1000) return markerImages.shelter_high;
        if (capacity >= 300) return markerImages.shelter_mid;
        return markerImages.shelter_low;
    }

    return markerImages.default;
}

// 4. 커스텀 오버레이 (클릭 수정됨)
function showCustomOverlay(marker, facility) {
    if (currentOverlay) currentOverlay.setMap(null);

    let statusText = "운영중";
    let statusColor = "#28a745";
    const opStatus = facility.operatingStatus || "";

    if(opStatus.includes("휴업") || opStatus.includes("폐업") || opStatus.includes("취소")) {
        statusText = opStatus;
        statusColor = "#d9534f";
    }

    const content = document.createElement('div');
    content.className = 'kb-custom-overlay';

    let capacityInfo = "";
    if(facility.type === 'shelter' && facility.maxCapacity) {
        capacityInfo = `<div style="font-size:11px; color:#666; margin-bottom:5px;">수용: ${facility.maxCapacity}명</div>`;
    }

    content.innerHTML = `
        <div class="overlay-title">${facility.name}</div>
        <div class="overlay-status" style="color:${statusColor}">● ${statusText}</div>
        ${capacityInfo}
        <button class="overlay-btn">자세히 보기 ></button>
    `;

    const btn = content.querySelector('.overlay-btn');
    btn.addEventListener('click', () => {
        handleMarkerClick(facility.id);
        if(currentOverlay) currentOverlay.setMap(null);
    });

    const overlay = new kakao.maps.CustomOverlay({
        content: content,
        map: map,
        position: marker.getPosition(),
        yAnchor: 1.35, // 마커 크기가 커졌으므로 yAnchor도 조정 필요할 수 있음 (1.35 ~ 1.5)
        zIndex: 100,
        clickable: true
    });

    currentOverlay = overlay;

    kakao.maps.event.addListener(map, 'click', function() {
        if(currentOverlay) currentOverlay.setMap(null);
    });
}

async function handleMarkerClick(facilityId) {
    if (!facilityId) return;
    try {
        const response = await fetch(`/api/facilities/detail/${facilityId}`);
        if (!response.ok) throw new Error(`API error`);
        const detailData = await response.json();

        import('./map-ui.js').then(ui => ui.updateSidebar(detailData));

    } catch (error) { console.error(error); }
}

function getCheckedTypes() {
    const types = [];
    document.querySelectorAll('.kb-target-checkbox:checked').forEach(cb => types.push(cb.getAttribute('data-type')));
    return types;
}

export function setupMapEventListeners() {
    const reSearchBtn = document.getElementById('btn-re-search');
    kakao.maps.event.addListener(map, 'dragend', () => { if(reSearchBtn) reSearchBtn.style.display = 'block'; });
    kakao.maps.event.addListener(map, 'zoom_changed', () => { if(reSearchBtn) reSearchBtn.style.display = 'block'; });
    if(reSearchBtn) reSearchBtn.addEventListener('click', function() { updateMarkers(); this.style.display = 'none'; });

    document.querySelectorAll('.kb-target-checkbox').forEach(cb => {
        cb.addEventListener('change', () => { updateMarkers(); });
    });

    // 안전 점수 함수 전역 등록
    window.calculateSafetyScore = calculateSafetyScore;

    updateMarkers();
}

// 안전 점수 계산
function calculateSafetyScore(facilities) {
    const panel = document.getElementById('safety-score-panel');
    const valEl = document.getElementById('safety-score-val');
    const gradeEl = document.getElementById('safety-grade');
    if (!panel) return;

    let score = 0;
    facilities.forEach(f => {
        const t = (f.type || "").toLowerCase();
        if (t === 'police') score += 10;
        else if (t === 'fire') score += 10;
        else if (t === 'hospital') score += 5;
        else if (t === 'shelter') score += 2;
    });
    if (score > 99) score = 99;

    if(valEl) valEl.innerText = score;

    if(gradeEl) {
        if (score >= 80) {
            gradeEl.innerText = "매우 안전 🛡️"; gradeEl.style.color = "#28a745"; if(valEl) valEl.style.backgroundColor = "#28a745";
        } else if (score >= 50) {
            gradeEl.innerText = "보통 😐"; gradeEl.style.color = "#ffc107"; if(valEl) valEl.style.backgroundColor = "#ffc107";
        } else {
            gradeEl.innerText = "취약 ⚠️"; gradeEl.style.color = "#d9534f"; if(valEl) valEl.style.backgroundColor = "#d9534f";
        }
    }
    panel.style.display = 'flex';
}