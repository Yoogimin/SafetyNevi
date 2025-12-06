/**
 * [Main] SafetyNevi 지도 애플리케이션 진입점
 */
import { initMap } from './map-core.js';
import { setupTabNavigation, setupCheckboxLogic, setupDetailViewEvents, setupGlobalUI } from './map-ui.js';
import { setupMarkerImages, setupMapEventListeners, updateMarkers } from './map-marker.js';
import { loadCurrentLocationAndWeather } from './map-weather.js';
import { setupDisasterMarkerImages, updateDisasterZones } from './map-disaster.js';
import { setupSearchLogic } from './map-search.js';
import { setupRouteLogic } from './map-route.js';
import { setupMyPlaceLogic } from './map-myplace.js';
import { setupBoardLogic } from './map-board.js';

document.addEventListener('DOMContentLoaded', function () {
    console.log("[MapApp] 시작됨...");

    // 1. 지도 객체 생성 및 이미지 리소스 로딩 (가장 먼저!)
    try {
        initMap();

        // 🌟 마커 이미지 로딩이 반드시 먼저 실행되어야 함
        setupMarkerImages();
        setupDisasterMarkerImages();

        console.log("[MapApp] 지도 및 이미지 리소스 로드 완료");
    } catch (e) { console.error("지도 초기화 실패:", e); }

    // 2. UI 설정
    try {
        setupTabNavigation();
        setupCheckboxLogic();
        setupDetailViewEvents();
        setupGlobalUI();
    } catch (e) { console.error("UI 설정 실패:", e); }

    // 3. 기능 로직
    try {
        setupSearchLogic();
        setupRouteLogic();
        setupMyPlaceLogic();
        setupBoardLogic();
    } catch (e) { console.error("기능 로직 실패:", e); }

    // 4. 데이터 로드 (마커 표시 등)
    try {
        // 마커 이미지가 로드된 후 실행됨
        setupMapEventListeners();
        loadCurrentLocationAndWeather();
    } catch (e) { console.error("위치/이벤트 로직 실패:", e); }

    // 5. 주기적 작업
    setInterval(() => {
        try { updateDisasterZones(); } catch(e) {}
    }, 10000);

    try { updateDisasterZones(); } catch(e) {}
});