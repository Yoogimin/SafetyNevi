document.addEventListener('DOMContentLoaded', function() {
    const mapContainer = document.getElementById('mini-map');
    let map = null;
    let marker = null;

    document.getElementById('search-address-btn').addEventListener('click', function() {
        // 카카오 지도 API 로드 체크
        if (typeof kakao === 'undefined' || !kakao.maps) {
            alert("지도 API 로딩 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        new daum.Postcode({
            oncomplete: function(data) {
                // 주소 입력
                document.getElementById('address').value = data.address;

                // 지역명(구/군) 추출
                let sigungu = data.sigungu || (data.address.split(' ')[1]);
                document.getElementById('areaName').value = sigungu;

                // 좌표 변환 및 지도 표시
                const geocoder = new kakao.maps.services.Geocoder();
                geocoder.addressSearch(data.address, function(result, status) {
                    if (status === kakao.maps.services.Status.OK) {
                        const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                        document.getElementById('lat').value = result[0].y;
                        document.getElementById('lon').value = result[0].x;

                        // 미니맵 표시
                        mapContainer.style.display = 'block';
                        if (!map) {
                            map = new kakao.maps.Map(mapContainer, { center: coords, level: 3 });
                            marker = new kakao.maps.Marker({ position: coords, map: map });
                        } else {
                            map.relayout();
                            map.setCenter(coords);
                            marker.setPosition(coords);
                        }
                    }
                });
                document.getElementById('detailAddress').focus();
            }
        }).open();
    });
});