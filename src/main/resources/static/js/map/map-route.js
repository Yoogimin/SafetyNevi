/**
 * [Route] 길찾기, 안전 대피소 찾기, 모의주행 시뮬레이션 로직
 */
import { map } from './map-core.js';
import { updateSidebar, toggleLoading, showToast } from './map-ui.js';

let currentPolylines = [];
const geocoder = new kakao.maps.services.Geocoder();

let startPoint = { lat: null, lon: null, name: null };
let endPoint = { lat: null, lon: null, name: null };
let currentMode = 'car';

// 모드별 평균 속도 (km/h)
const SPEEDS = { car: 0, bus: 20, walk: 4, bike: 15 };

// 시뮬레이션용 변수
let simulationMarker = null;
let simulationInterval = null;

export function setupRouteLogic() {
    // 1. 입력창 엘리먼트
    const startInput = document.querySelector('.kb-route-input-wrap .kb-route-line:nth-child(1) input');
    const endInput = document.querySelector('.kb-route-input-wrap .kb-route-line:nth-child(2) input');
    const swapBtn = document.querySelector('.kb-swap-button');
    const clearBtn = document.querySelector('.kb-clear-button');

    // 2. 엔터키 검색 이벤트
    if(startInput) startInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchLocation(startInput.value, 'start'); });
    if(endInput) endInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchLocation(endInput.value, 'end'); });

    // 3. 초기화 버튼
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if(startInput) startInput.value = '';
            if(endInput) endInput.value = '';

            startPoint = { lat: null, lon: null, name: null };
            endPoint = { lat: null, lon: null, name: null };

            // 지도 초기화
            currentPolylines.forEach(line => line.setMap(null));
            currentPolylines = [];

            // 결과창 초기화
            const resultList = document.getElementById('route-result-list');
            if(resultList) resultList.innerHTML = '';

            // 시뮬레이션 초기화
            stopSimulation();
        });
    }

    // 4. 전환(Swap) 버튼
    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            const tempPoint = { ...startPoint }; startPoint = { ...endPoint }; endPoint = tempPoint;
            const tempText = startInput.value; startInput.value = endInput.value; endInput.value = tempText;

            if (startPoint.lat && endPoint.lat) executeRouteSearch();
        });
    }

    // 5. 운송 수단 버튼
    const modeButtons = document.querySelectorAll('.kb-mode-button');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modeButtons.forEach(b => b.classList.remove('kb-active'));
            btn.classList.add('kb-active');
            currentMode = btn.getAttribute('data-mode');

            // 경로가 있다면 재계산
            if (startPoint.lat && endPoint.lat) executeRouteSearch(false);
        });
    });

    // 6. 안전 대피소 찾기 버튼
    const safetyBtn = document.getElementById('btn-safety-search');
    if (safetyBtn) {
        // 이벤트 중복 방지를 위해 재생성
        const newBtn = safetyBtn.cloneNode(true);
        safetyBtn.parentNode.replaceChild(newBtn, safetyBtn);
        newBtn.addEventListener('click', findSafeRoutes);
    }
}

// 주소/장소 검색
function searchLocation(keyword, type) {
    if (!keyword) return;
    toggleLoading(true, "위치 검색 중...");

    geocoder.addressSearch(keyword, function(result, status) {
        toggleLoading(false);
        if (status === kakao.maps.services.Status.OK) {
            setPoint(type, result[0].y, result[0].x, result[0].address_name);
        } else {
            // 주소 실패 시 장소 검색
            const ps = new kakao.maps.services.Places();
            ps.keywordSearch(keyword, (data, status) => {
                if (status === kakao.maps.services.Status.OK) {
                    setPoint(type, data[0].y, data[0].x, data[0].place_name);
                } else {
                    showToast("장소를 찾을 수 없습니다.", true);
                }
            });
        }
    });
}

function setPoint(type, lat, lon, name) {
    if (type === 'start') startPoint = { lat, lon, name };
    else endPoint = { lat, lon, name };

    if (startPoint.lat && endPoint.lat) executeRouteSearch();
}

// 🌟 [핵심] 경로 검색 실행
async function executeRouteSearch() {
    if (!startPoint.lat || !endPoint.lat) return;

    toggleLoading(true, "경로 계산 중...");
    stopSimulation(); // 기존 시뮬레이션 정지

    try {
        const response = await fetch(`/api/route/path?startLat=${startPoint.lat}&startLon=${startPoint.lon}&endLat=${endPoint.lat}&endLon=${endPoint.lon}`);
        if (!response.ok) throw new Error("Path API failed");

        const data = await response.json();
        drawPathOnMap(data); // 지도에 선 그리기

        // 시간/거리 계산
        const distanceMeters = data.routes[0].summary.distance;
        const distanceKm = (distanceMeters / 1000).toFixed(1);
        let durationMin = 0;
        let modeLabel = "";

        if (currentMode === 'car') {
            durationMin = Math.round(data.routes[0].summary.duration / 60);
            modeLabel = "🚗 차량";
        } else {
            const speed = SPEEDS[currentMode];
            durationMin = Math.ceil((distanceKm / speed) * 60);

            if (currentMode === 'bus') modeLabel = "🚌 대중교통(예상)";
            else if (currentMode === 'walk') modeLabel = "🚶 도보";
            else if (currentMode === 'bike') modeLabel = "🚴 자전거";
        }

        // 결과창 표시
        const resultList = document.getElementById('route-result-list');
        if(resultList) {
            resultList.innerHTML = `
                <div style="padding:15px; background:#fff; border:1px solid #ddd; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="font-weight:bold; color:#333; font-size:14px;">${modeLabel} 기준</span>
                        <span style="font-size:12px; color:#888;">${distanceKm}km</span>
                    </div>
                    <div style="font-size:24px; font-weight:bold; color:#337cf4; margin-bottom:10px;">
                        약 ${formatTime(durationMin)}
                    </div>
                    <div style="font-size:13px; color:#666; border-top:1px solid #eee; padding-top:10px;">
                        <span style="color:#337cf4; font-weight:bold;">출발</span> ${startPoint.name || '출발지'}<br>
                        <span style="color:#d9534f; font-weight:bold;">도착</span> ${endPoint.name || '도착지'}
                    </div>
                    
                    <button id="btn-simulate-route" style="width:100%; margin-top:15px; padding:10px; background:#555; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">
                        ▶️ 모의주행 (경로 미리보기)
                    </button>
                </div>`;

            // 버튼 이벤트 연결
            document.getElementById('btn-simulate-route').addEventListener('click', () => {
                startRouteSimulation(data.routes[0].sections[0].roads);
            });
        }

    } catch (e) {
        console.error(e);
        showToast("경로를 찾을 수 없습니다.", true);
    } finally {
        toggleLoading(false);
    }
}

// 🌟 [신규] 모의주행 로직
function startRouteSimulation(roads) {
    stopSimulation(); // 초기화

    // 경로 데이터 평탄화 (점들의 배열로 변환)
    let pathPoints = [];
    roads.forEach(road => {
        for (let i = 0; i < road.vertexes.length; i += 2) {
            pathPoints.push(new kakao.maps.LatLng(road.vertexes[i+1], road.vertexes[i]));
        }
    });

    if(pathPoints.length === 0) return;

    // 마커 생성 (달리는 사람 등)
    const markerImage = new kakao.maps.MarkerImage(
        'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
        new kakao.maps.Size(30, 30)
    );

    simulationMarker = new kakao.maps.Marker({
        position: pathPoints[0],
        image: markerImage,
        map: map,
        zIndex: 1000
    });

    // 애니메이션 루프
    let idx = 0;
    // 전체 점 개수에 따라 속도 조절 (너무 느리지 않게 점프)
    const step = Math.max(1, Math.floor(pathPoints.length / 300));

    simulationInterval = setInterval(() => {
        if (idx >= pathPoints.length) {
            stopSimulation();
            showToast("🏁 목적지에 도착했습니다!");
            return;
        }

        const pos = pathPoints[idx];
        simulationMarker.setPosition(pos);
        map.panTo(pos); // 지도가 마커를 따라감

        idx += step;
    }, 50); // 50ms 간격
}

function stopSimulation() {
    if(simulationMarker) simulationMarker.setMap(null);
    if(simulationInterval) clearInterval(simulationInterval);
}

// 지도에 경로 선 그리기
function drawPathOnMap(data) {
    currentPolylines.forEach(line => line.setMap(null));
    currentPolylines = [];

    const linePath = [];
    const roads = data.routes[0].sections[0].roads;

    roads.forEach(road => {
        const vertexes = road.vertexes;
        for (let i = 0; i < vertexes.length; i += 2) {
            linePath.push(new kakao.maps.LatLng(vertexes[i + 1], vertexes[i]));
        }
    });

    const polyline = new kakao.maps.Polyline({
        path: linePath,
        strokeWeight: 7,
        strokeColor: currentMode === 'walk' ? '#28a745' : '#337cf4', // 도보는 초록, 차는 파랑
        strokeOpacity: 0.8,
        strokeStyle: currentMode === 'walk' ? 'shortdash' : 'solid'
    });

    polyline.setMap(map);
    currentPolylines.push(polyline);

    // 지도 범위 재설정
    const bounds = new kakao.maps.LatLngBounds();
    linePath.forEach(latLng => bounds.extend(latLng));
    map.setBounds(bounds);
}

// 외부 호출용: 상세화면에서 [길찾기] 눌렀을 때
export function setRouteDestination(name, lat, lon) {
    endPoint = { lat: lat, lon: lon, name: name };

    const endInput = document.querySelector('.kb-route-input-wrap .kb-route-line:nth-child(2) input');
    if(endInput) endInput.value = name;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            startPoint = {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                name: "내 위치"
            };
            const startInput = document.querySelector('.kb-route-input-wrap .kb-route-line:nth-child(1) input');
            if(startInput) startInput.value = "내 위치";

            executeRouteSearch(); // 바로 검색 시작
        }, () => showToast("GPS 정보를 가져올 수 없습니다.", true));
    }
}

// 안전 대피소 찾기 (버튼 클릭 시)
async function findSafeRoutes() {
    if (!navigator.geolocation) {
        showToast("GPS를 지원하지 않는 브라우저입니다.", true);
        return;
    }

    toggleLoading(true, "내 주변 안전한 대피소 분석 중...");

    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const res = await fetch(`/api/route/recommend?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
            if(!res.ok) throw new Error("API Error");

            const routes = await res.json();

            if(routes.length > 0) {
                renderRouteResults(routes);

                // 1순위(Best) 경로 자동 그리기
                const best = routes[0];
                endPoint = { lat: best.latitude, lon: best.longitude, name: best.name };
                startPoint = { lat: pos.coords.latitude, lon: pos.coords.longitude, name: "내 위치" }; // 출발지도 설정

                const pathRes = await fetch(`/api/route/path?startLat=${startPoint.lat}&startLon=${startPoint.lon}&endLat=${endPoint.lat}&endLon=${endPoint.lon}`);
                if(pathRes.ok) {
                    const pathData = await pathRes.json();
                    drawPathOnMap(pathData);
                }
            } else {
                showToast("근처에 추천할만한 대피소가 없습니다 😢", true);
            }
        } catch(e) {
            console.error(e);
            showToast("대피소 분석 실패. 잠시 후 시도해주세요.", true);
        } finally {
            toggleLoading(false);
        }
    }, () => {
        toggleLoading(false);
        showToast("위치 확인 실패. GPS를 켜주세요.", true);
    });
}

// 대피소 추천 목록 렌더링
function renderRouteResults(routes) {
    const resultList = document.getElementById('route-result-list');
    resultList.innerHTML = '';
    if (routes.length === 0) return;

    routes.forEach((route, index) => {
        const item = document.createElement('div');
        item.style.cssText = "background:#fff; border:1px solid #ddd; padding:15px; margin-bottom:10px; cursor:pointer; border-radius:8px;";
        item.onmouseover = () => item.style.borderColor = '#337cf4';
        item.onmouseout = () => item.style.borderColor = '#ddd';

        let badgeColor = '#777';
        if (route.recommendationType.includes("최적")) badgeColor = '#28a745';
        else if (route.recommendationType.includes("최단")) badgeColor = '#f0ad4e';

        item.innerHTML = `
             <div style="margin-bottom:5px;"><span style="background:${badgeColor}; color:white; font-size:11px; padding:3px 6px; border-radius:4px; font-weight:bold;">${route.recommendationType}</span></div>
             <div style="font-weight:bold; font-size:16px; margin-bottom:5px;">${index + 1}. ${route.name}</div>
             <div style="font-size:13px; color:#555;">거리: ${formatDistance(route.distanceMeter)} | 도보 ${route.timeWalk}분</div>
         `;

        item.addEventListener('click', () => {
            setRouteDestination(route.name, route.latitude, route.longitude);
        });
        resultList.appendChild(item);
    });
}

// 시간/거리 포맷 헬퍼
function formatDistance(m) { return m>=1000 ? (m/1000).toFixed(1)+"km" : Math.round(m)+"m"; }
function formatTime(minutes) {
    if (minutes < 60) return `${minutes}분`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}시간 ${m}분`;
}