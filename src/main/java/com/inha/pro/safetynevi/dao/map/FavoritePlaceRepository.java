package com.inha.pro.safetynevi.dao.map;

import com.inha.pro.safetynevi.entity.map.FavoritePlace;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FavoritePlaceRepository extends JpaRepository<FavoritePlace, Long> {
    // 특정 유저의 특정 타입 장소 찾기 (집, 회사용)
    Optional<FavoritePlace> findByUserIdAndPlaceType(String userId, String placeType);

    // 특정 유저의 모든 즐겨찾기 목록 가져오기
    List<FavoritePlace> findAllByUserId(String userId);
}