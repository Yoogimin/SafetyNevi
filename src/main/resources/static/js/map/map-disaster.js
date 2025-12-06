/**
 * [Disaster] 재난 구역 관리 및 알림
 * - DB 데이터 매핑: 한글('호우'), 콤마 구분 다중 지역('부산,중구,서구'), 전체/상세 지역 자동 판별
 * - 재난 유형별 색상 및 아이콘 차별화
 * - 지역(Polygon) 재난 시 중심점에 마커 표시
 */
import { map } from './map-core.js';

let disasterMarkerImages = {};
let currentDisasterZones = [];
let sigunguGeoJson = null;
let isModalShowing = false;
let processedDisasterIds = [];

// 🌟 1. 재난 명칭 매핑
const disasterNames = {
    'fire': '🔥 화재/산불',
    'missile': '🚀 미사일/공습',
    'lightning': '⚡ 낙뢰',
    'quake': '🌋 지진',
    'typhoon': '🌀 태풍',
    'heatwave': '☀️ 폭염',
    'heavyrain': '🌧️ 호우/장마',
    'tsunami': '🌊 해일',
    'flood': '🌊 홍수',
    'snow': '❄️ 대설',
    'coldwave': '🥶 한파',
    'dust': '🌫️ 황사/미세먼지',
    '화재': '🔥 화재/산불',
    '산불': '🔥 화재/산불',
    '미사일': '🚀 미사일/공습',
    '공습': '🚀 미사일/공습',
    '낙뢰': '⚡ 낙뢰',
    '지진': '🌋 지진',
    '산사태': '🌋 산사태',
    '태풍': '🌀 태풍',
    '폭염': '☀️ 폭염',
    '호우': '🌧️ 호우/장마',
    '폭우': '🌧️ 호우/장마',
    '장마': '🌧️ 호우/장마',
    '해일': '🌊 해일',
    '지진해일': '🌊 해일',
    '홍수': '🌊 홍수',
    '대설': '❄️ 대설',
    '폭설': '❄️ 대설',
    '한파': '🥶 한파',
    '황사': '🌫️ 황사',
    '미세먼지': '🌫️ 미세먼지'
};

// 🌟 2. 마커 이미지 설정 (전체 이미지 매칭 완성 버전)
export function setupDisasterMarkerImages() {
    const imageSize = new kakao.maps.Size(100, 100);
    const options = { offset: new kakao.maps.Point(50, 90) };
    const path = '/img/disaster/';

    const defaultImg = new kakao.maps.MarkerImage(path + 'etc.png', imageSize, options);

    disasterMarkerImages.fire = new kakao.maps.MarkerImage(path + 'fire.png', imageSize, options);
    disasterMarkerImages.missile = new kakao.maps.MarkerImage(path + 'missile.png', imageSize, options);
    disasterMarkerImages.lightning = new kakao.maps.MarkerImage(path + 'lightning.png', imageSize, options);
    disasterMarkerImages.quake = new kakao.maps.MarkerImage(path + 'quake.png', imageSize, options);
    disasterMarkerImages.typhoon = new kakao.maps.MarkerImage(path + 'typhoon.png', imageSize, options);
    disasterMarkerImages.heatwave = new kakao.maps.MarkerImage(path + 'heatwave.png', imageSize, options);
    disasterMarkerImages.heavyrain = new kakao.maps.MarkerImage(path + 'heavyrain.png', imageSize, options);
    disasterMarkerImages.flood = new kakao.maps.MarkerImage(path + 'flood.png', imageSize, options);
    disasterMarkerImages.tsunami = new kakao.maps.MarkerImage(path + 'tsunami.png', imageSize, options);
    disasterMarkerImages.snow = new kakao.maps.MarkerImage(path + 'snow.png', imageSize, options);
    disasterMarkerImages.coldwave = new kakao.maps.MarkerImage(path + 'coldwave.png', imageSize, options);
    disasterMarkerImages.dust = new kakao.maps.MarkerImage(path + 'dust.png', imageSize, options);

    disasterMarkerImages.default = defaultImg;
}

// 🌟 3. 재난 구역 업데이트 및 그리기
export async function updateDisasterZones() {
    const modal = document.getElementById('disaster-modal');
    const modalMessage = document.getElementById('disaster-modal-message');
    if (!modal || !modalMessage) return;

    try {
        const response = await fetch('/api/disaster-zones');
        if (!response.ok) throw new Error("Failed to fetch disaster zones");
        const zones = await response.json();

        // 초기화
        currentDisasterZones.forEach(graphic => graphic.setMap(null));
        currentDisasterZones = [];

        // 알림창
        if (zones.length > 0) {
            const newDisaster = zones.find(zone => !processedDisasterIds.includes(zone.id));

            if (newDisaster && !isModalShowing) {
                isModalShowing = true;
                processedDisasterIds.push(newDisaster.id);

                let areaName = newDisaster.areaName || "인근 지역";
                let rawType = newDisaster.disasterType || "";
                let disasterDisplay = disasterNames[rawType] || disasterNames[rawType.toLowerCase()] || "⚠️ 기타 재난";

                modalMessage.innerHTML = `🚨 긴급: '${areaName}' 지역에 '${disasterDisplay}' 경보!`;
                modal.classList.add('show');

                modal.onclick = function() {
                    if (newDisaster.latitude && newDisaster.longitude) {
                        const movePos = new kakao.maps.LatLng(newDisaster.latitude, newDisaster.longitude);
                        map.setLevel(7);
                        map.panTo(movePos);
                    }
                };

                setTimeout(() => {
                    modal.classList.remove('show');
                    isModalShowing = false;
                }, 5000);
            }
        } else {
            modal.classList.remove('show');
        }

        // 지도 그리기
        for (const zone of zones) {
            let colors = getDisasterColor(zone.disasterType);
            let markerImg = getDisasterMarkerImage(zone.disasterType);

            // A. 원형
            if (zone.radius > 0 && zone.latitude && zone.longitude) {
                const circle = new kakao.maps.Circle({
                    center: new kakao.maps.LatLng(zone.latitude, zone.longitude),
                    radius: zone.radius,
                    strokeWeight: 2,
                    strokeColor: colors.stroke,
                    strokeOpacity: 0.8,
                    fillColor: colors.fill,
                    fillOpacity: 0.4
                });
                circle.setMap(map);
                currentDisasterZones.push(circle);

                drawMarker(zone.latitude, zone.longitude, markerImg);
            }

            // B. 지역 폴리곤
            if (zone.areaName) {
                await drawPolygonZone(zone.areaName, colors.fill, colors.stroke, markerImg);
            }
        }
    } catch (e) {
        console.error("재난 구역 갱신 오류:", e);
    }
}

// 🌟 4. 색상 결정
function getDisasterColor(type) {
    const t = (type || "").toLowerCase();
    if (t.match(/fire|missile|heat|화재|산불|폭발/)) return { fill: '#FF0000', stroke: '#FF0000' };
    if (t.match(/water|rain|flood|tsunami|호우|홍수|태풍/)) return { fill: '#0000FF', stroke: '#0000FF' };
    if (t.match(/quake|지진|산사태/)) return { fill: '#8B4513', stroke: '#D2691E' };
    if (t.match(/snow|cold|대설|한파/)) return { fill: '#B0C4DE', stroke: '#778899' };
    if (t.match(/dust|황사|미세먼지/)) return { fill: '#FFD700', stroke: '#DAA520' };
    return { fill: '#FFA500', stroke: '#FF8C00' };
}

// 🌟 5. 올바르게 정리된 마커 매칭
function getDisasterMarkerImage(type) {
    if (!type) return disasterMarkerImages.default;
    const t = type.toLowerCase();

    if (t.includes("fire") || t.includes("화재") || t.includes("산불"))
        return disasterMarkerImages.fire;

    if (t.includes("missile") || t.includes("미사일") || t.includes("공습"))
        return disasterMarkerImages.missile;

    if (t.includes("lightning") || t.includes("낙뢰"))
        return disasterMarkerImages.lightning;

    if (t.includes("quake") || t.includes("지진"))
        return disasterMarkerImages.quake;

    if (t.includes("typhoon") || t.includes("태풍"))
        return disasterMarkerImages.typhoon;

    if (t.includes("heat") || t.includes("폭염"))
        return disasterMarkerImages.heatwave;

    if (t.includes("rain") || t.includes("호우") || t.includes("장마"))
        return disasterMarkerImages.heavyrain;

    if (t.includes("flood") || t.includes("홍수"))
        return disasterMarkerImages.flood;

    if (t.includes("tsunami") || t.includes("해일"))
        return disasterMarkerImages.tsunami;

    if (t.includes("snow") || t.includes("대설") || t.includes("폭설"))
        return disasterMarkerImages.snow;

    if (t.includes("cold") || t.includes("한파"))
        return disasterMarkerImages.coldwave;

    if (t.includes("dust") || t.includes("황사") || t.includes("미세먼지"))
        return disasterMarkerImages.dust;

    return disasterMarkerImages.default;
}

// 🌟 6. 마커 찍기
function drawMarker(lat, lng, image) {
    const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(lat, lng),
        image: image,
        zIndex: 10
    });
    marker.setMap(map);
    currentDisasterZones.push(marker);
}

// 🌟 7. 시/도 코드 판별
function getSidoCodePrefix(areaName) {
    if (!areaName) return null;
    if (areaName.match(/서울/)) return "11";
    if (areaName.match(/부산/)) return "21";
    if (areaName.match(/대구/)) return "22";
    if (areaName.match(/인천/)) return "23";
    if (areaName.match(/광주/)) return "24";
    if (areaName.match(/대전/)) return "25";
    if (areaName.match(/울산/)) return "26";
    if (areaName.match(/세종/)) return "29";
    if (areaName.match(/경기/)) return "31";
    if (areaName.match(/강원/)) return "32";
    if (areaName.match(/충.*북/)) return "33";
    if (areaName.match(/충.*남/)) return "34";
    if (areaName.match(/전.*북/)) return "35";
    if (areaName.match(/전.*남/)) return "36";
    if (areaName.match(/경.*북/)) return "37";
    if (areaName.match(/경.*남/)) return "38";
    if (areaName.match(/제주/)) return "39";
    return null;
}

// 🌟 8. 폴리곤 그리기
async function drawPolygonZone(areaName, fillColor, strokeColor, markerImg) {
    try {
        if (!sigunguGeoJson) {
            const response = await fetch('/geojson/skorea-municipalities-2018-geo.json');
            if (!response.ok) return;
            sigunguGeoJson = await response.json();
        }

        const nameParts = areaName.split(',').map(s => s.trim());
        const primaryName = nameParts[0];
        let targetFeatures = [];
        const codePrefix = getSidoCodePrefix(primaryName);

        if (codePrefix) {
            const sidoFeatures = sigunguGeoJson.features.filter(f =>
                f.properties.code.startsWith(codePrefix)
            );

            if (nameParts.length > 1) {
                const targetDistricts = nameParts.slice(1);
                targetFeatures = sidoFeatures.filter(f =>
                    targetDistricts.some(d => f.properties.name === d || d.includes(f.properties.name))
                );
            } else {
                const districtFeatures = sidoFeatures.filter(f =>
                    primaryName.includes(f.properties.name)
                );

                if (districtFeatures.length > 0)
                    targetFeatures = districtFeatures;
                else
                    targetFeatures = sidoFeatures;
            }
        } else {
            targetFeatures = sigunguGeoJson.features.filter(f =>
                areaName.includes(f.properties.name)
            );
        }

        if (targetFeatures.length === 0) return;

        let centerLatSum = 0;
        let centerLngSum = 0;
        let pointCount = 0;

        targetFeatures.forEach(feature => {
            const coordinates = feature.geometry.coordinates;
            const type = feature.geometry.type;

            if (type === "Polygon") {
                let paths = coordinates[0].map(p => new kakao.maps.LatLng(p[1], p[0]));
                drawSinglePolygon(paths, fillColor, strokeColor);
                centerLatSum += paths[0].getLat();
                centerLngSum += paths[0].getLng();
                pointCount++;
            } else if (type === "MultiPolygon") {
                coordinates.forEach(polygonCoords => {
                    let subPath = polygonCoords[0].map(p => new kakao.maps.LatLng(p[1], p[0]));
                    drawSinglePolygon(subPath, fillColor, strokeColor);
                    centerLatSum += subPath[0].getLat();
                    centerLngSum += subPath[0].getLng();
                    pointCount++;
                });
            }
        });

        if (pointCount > 0) {
            const avgLat = centerLatSum / pointCount;
            const avgLng = centerLngSum / pointCount;
            drawMarker(avgLat, avgLng, markerImg);
        }

    } catch (e) {
        console.error("폴리곤 그리기 실패:", e);
    }
}

function drawSinglePolygon(paths, fillColor, strokeColor) {
    const polygon = new kakao.maps.Polygon({
        path: paths,
        strokeWeight: 2,
        strokeColor: strokeColor,
        strokeOpacity: 0.8,
        fillColor: fillColor,
        fillOpacity: 0.35
    });
    polygon.setMap(map);
    currentDisasterZones.push(polygon);
}
