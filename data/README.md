# 데이터 영역

뉴트리 덱은 두 공공데이터를 역할별로 분리해 사용합니다.

1. **메뉴젠 음식·재료·조리 정보 Open API**: 음식 코드/명, 음식 분류, 구성 재료, 재료 사용량을 실행 시 수집
2. **국가표준식품성분 Database 10.4**: 재료별 100g 기준 영양성분을 서비스용 기준 데이터로 정규화

## 실제 서비스 데이터 흐름

```text
메뉴젠 Open API
  → 음식/재료 데이터 수집
  → 국가표준식품성분 DB와 식품명·식품군 기준 연계
  → 100g 영양값 × 재료 사용량 / 100
  → 메뉴 단위 합산
  → data/processed/game_foods.json
  → FastAPI / React 게임
```

`menuzen_ingredient.csv`처럼 이전 분석 때 저장한 CSV는 **검증용 과거 스냅샷일 뿐 최종 서비스의 원천 데이터로 사용하지 않습니다.** 최종 구조에서는 `data/pipeline/sync_menuzen.py`가 공공데이터포털 API에서 메뉴젠 데이터를 직접 받아 게임 DB를 다시 생성합니다.

## 폴더 구조

- `reference/national_food_10_4_part*.tsv`: 국가표준식품성분 DB 10.4 중 현재 메뉴젠 재료와 연계되는 기준 영양 데이터
- `processed/game_foods.json`: 마지막 동기화 결과. 저장소에는 시연용 실제 데이터 200건을 캐시
- `processed/data_sync_meta.json`: 데이터 생성·검증 메타정보
- `pipeline/sync_menuzen.py`: 메뉴젠 API 수집 → 연계 → 영양 계산 → 게임 DB 생성
- `pipeline/validate_game_foods.py`: 게임용 데이터 검증

API 동기화 시 필요한 영양항목이 하나라도 누락되거나 식품 매핑이 명확하지 않은 메뉴는 게임 DB에서 제외합니다.
