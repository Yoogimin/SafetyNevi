/**
 * [Core] 지도 객체, 컨트롤, 트래킹 로직 (그리기 제거됨)
 */
export let map = null;
export let clusterer = null;
// let drawingManager = null; // 삭제됨
let currentCircles = [];
let watchId = null;
let isRoadviewMode = false;

export function initMap() {
    const mapContainer = document.getElementById('map');
    const mapOption = { center: new kakao.maps.LatLng(37.566826, 126.9786567), level: 4 };
    map = new kakao.maps.Map(mapContainer, mapOption);
    clusterer = new kakao.maps.MarkerClusterer({ map: map, averageCenter: true, minLevel: 5, gridSize: 35 });

    const zoomControl = new kakao.maps.ZoomControl();
    map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

    setupMapControls();

    // 🌟 [삭제됨] 그리기 라이브러리 초기화 코드 제거
    // drawingManager = new kakao.maps.drawing.DrawingManager(options); ...

    return map;
}

function setupMapControls() {
    const btnTraffic = document.getElementById('btn-mode-traffic');
    const btnCctv = document.getElementById('btn-mode-cctv');
    const btnSkyview = document.getElementById('btn-mode-skyview');
    const btnDark = document.getElementById('btn-mode-dark');
    const btnRadius = document.getElementById('btn-mode-radius');
    const btnTrack = document.getElementById('btn-mode-track');
    const btnSms = document.getElementById('btn-sms-report');
    const btnRoadview = document.getElementById('btn-mode-roadview');

    // 🌟 [삭제됨] 그리기 버튼 변수 제거 (btnDraw)

    if (btnTraffic) {
        btnTraffic.addEventListener('click', () => {
            const isActive = btnTraffic.classList.toggle('active');
            isActive ? map.addOverlayMapTypeId(kakao.maps.MapTypeId.TRAFFIC) : map.removeOverlayMapTypeId(kakao.maps.MapTypeId.TRAFFIC);
        });
    }
    if (btnCctv) {
        btnCctv.addEventListener('click', () => {
            const isActive = btnCctv.classList.toggle('active');
            isActive ? map.addOverlayMapTypeId(kakao.maps.MapTypeId.TERRAIN) : map.removeOverlayMapTypeId(kakao.maps.MapTypeId.TERRAIN);
        });
    }
    if (btnSkyview) {
        btnSkyview.addEventListener('click', () => {
            const isActive = btnSkyview.classList.toggle('active');
            map.setMapTypeId(isActive ? kakao.maps.MapTypeId.HYBRID : kakao.maps.MapTypeId.ROADMAP);
        });
    }

    if (btnRoadview) {
        btnRoadview.addEventListener('click', () => {
            isRoadviewMode = !isRoadviewMode;
            if (isRoadviewMode) {
                map.addOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);
                btnRoadview.classList.add('active');
                map.setCursor('url(https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/arrow_white.png), auto');
            } else {
                map.removeOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);
                btnRoadview.classList.remove('active');
                map.setCursor('default');
            }
        });

        kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
            if (!isRoadviewMode) return;
            const lat = mouseEvent.latLng.getLat();
            const lng = mouseEvent.latLng.getLng();
            if (window.openRoadview) window.openRoadview(lat, lng);
        });
    }

    if (btnDark) {
        btnDark.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            btnDark.innerHTML = document.body.classList.contains('dark-mode') ? "☀️ 주간" : "🌙 야간";
            btnDark.classList.toggle('active');
        });
    }
    if (btnRadius) {
        btnRadius.addEventListener('click', () => {
            if (btnRadius.classList.contains('active')) {
                currentCircles.forEach(c => c.setMap(null));
                currentCircles = [];
                btnRadius.classList.remove('active');
            } else {
                const center = map.getCenter();
                [500, 1000].forEach((r, i) => {
                    const color = i === 0 ? '#337cf4' : '#ff5050';
                    const circle = new kakao.maps.Circle({
                        center: center, radius: r, strokeWeight: 1, strokeColor: color, strokeOpacity: 0.5, fillColor: color, fillOpacity: 0.1
                    });
                    circle.setMap(map);
                    currentCircles.push(circle);
                });
                btnRadius.classList.add('active');
            }
        });
    }
    if (btnTrack) {
        btnTrack.addEventListener('click', () => {
            if (btnTrack.classList.contains('active')) {
                if (watchId) navigator.geolocation.clearWatch(watchId);
                watchId = null;
                btnTrack.classList.remove('active');
                btnTrack.innerHTML = "📍 고정";
            } else {
                if (navigator.geolocation) {
                    btnTrack.classList.add('active');
                    btnTrack.innerHTML = "🔒 해제";
                    watchId = navigator.geolocation.watchPosition((pos) => {
                        map.panTo(new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
                    }, null, { enableHighAccuracy: true });
                } else { alert("GPS 불가"); }
            }
        });
    }

    // 🌟 [삭제됨] 그리기 버튼 이벤트 리스너 제거 (btnDraw)

    if (btnSms) {
        btnSms.addEventListener('click', () => {
            const center = map.getCenter();
            const confirmMsg = confirm("🚨 긴급 신고 문자를 작성하시겠습니까?\n(가상 번호로 연결됩니다)");
            if(confirmMsg) {
                const msg = `[구조요청] 위급상황 발생! 위치: 위도${center.getLat().toFixed(4)}, 경도${center.getLng().toFixed(4)}`;
                window.location.href = `sms:01000000000?body=${encodeURIComponent(msg)}`;
            }
        });
    }
}