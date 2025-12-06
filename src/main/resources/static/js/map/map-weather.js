/**
 * [Weather] 현재 위치 및 날씨 로직 (부드러운 이동 적용)
 */
import { map } from './map-core.js';
import { toggleLoading, showToast } from './map-ui.js';

export function loadCurrentLocationAndWeather() {
    // 토스트로 알림 (화면 가리지 않음)
    showToast("내 위치를 찾는 중입니다... 🛰️");

    if (navigator.geolocation) {
        const options = {
            enableHighAccuracy: true,  // 정확도 다시 높임 (오류 방지)
            timeout: 7000,             // 타임아웃 약간 여유있게
            maximumAge: 0              // 항상 최신 위치 조회
        };
        navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    } else {
        errorCallback(new Error("GPS 미지원"));
    }
}

function successCallback(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const locPosition = new kakao.maps.LatLng(lat, lon);

    // 🌟 [수정] 위치 찾음 -> 부드럽게 이동
    displayMarker(locPosition, '현재 위치');

    fetchWeatherAndAddress(lat, lon);
    showToast("내 위치를 찾았습니다! 📍");
}

function errorCallback(error) {
    console.warn("위치 파악 실패:", error);
    showToast("위치를 찾을 수 없어 기본 위치로 이동합니다.", true);

    const defaultLat = 37.566826;
    const defaultLon = 126.9786567;
    const locPosition = new kakao.maps.LatLng(defaultLat, defaultLon);

    displayMarker(locPosition, '기본 위치');
    fetchWeatherAndAddress(defaultLat, defaultLon);
}

function displayMarker(locPosition, message) {
    if (!map) return;

    const content = document.createElement('div');
    content.className = 'kb-radar-wrapper';
    content.innerHTML = `
        <div class="kb-radar-ring"></div>
        <div class="kb-radar-ring"></div>
        <div class="kb-radar-dot"></div>
    `;

    // 기존 오버레이 제거 로직이 필요하면 추가 가능 (여기선 생략)
    const customOverlay = new kakao.maps.CustomOverlay({
        map: map,
        position: locPosition,
        content: content,
        yAnchor: 0.5
    });

    // 🌟 [핵심 수정] 부드럽게 이동 (속도 조절)
    // duration: 800 (0.8초 동안 부드럽게 줌인/이동)
    map.setLevel(4, { animate: { duration: 800 } });

    setTimeout(() => {
        map.panTo(locPosition); // 줌인 후 부드럽게 중심 이동
    }, 300); // 약간의 시차를 두어 더 자연스럽게
}

async function fetchWeatherAndAddress(lat, lon) {
    try {
        const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        if (!response.ok) return; // 조용히 실패
        const weatherDto = await response.json();
        updateWeatherUI(weatherDto);
    } catch (error) { console.error(error); }
}

function updateWeatherUI(data) {
    const addrEl = document.querySelector('#current-address');
    if (addrEl) addrEl.innerText = data.address || "주소정보 없음";
    const tempEl = document.querySelector('#current-temp');
    if (tempEl) tempEl.innerText = data.temp ? `${data.temp}°` : '';
    const weatherStatusEl = document.querySelector('#weather-status');
    if (weatherStatusEl) weatherStatusEl.innerText = data.weatherStatus || "";
    const weatherIconEl = document.querySelector('#weather-icon');
    if (weatherIconEl && data.weatherStatus) {
        const status = data.weatherStatus;
        let iconSrc = 'default.png';
        if (status.includes('맑음')) iconSrc = 'sunny.png';
        else if (status.includes('구름')) iconSrc = 'cloudy.png';
        else if (status.includes('흐림')) iconSrc = 'overcast.png';
        else if (status.includes('비')) iconSrc = 'rain.png';
        else if (status.includes('눈')) iconSrc = 'snow.png';
        weatherIconEl.src = `/img/weather/${iconSrc}`;
        weatherIconEl.style.display = 'inline-block';
    }
}