# 데이터 영역

뉴트리 덱의 데이터 분석/전처리 산출물을 관리하는 영역입니다.

## 폴더 구조

- `processed/game_foods.json`: 백엔드와 게임이 실제로 사용하는 완성 메뉴 단위 데이터
- `pipeline/validate_game_foods.py`: 게임용 데이터 스키마/중복/영양값 검증

실제 공공데이터 분석 단계에서는 메뉴젠의 메뉴·재료·중량 정보와 국가표준식품성분 DB를 전처리·연계한 뒤, 최종 산출물만 `processed/game_foods.json` 형식으로 내보내면 됩니다.

## 최종 데이터 필드

- `food_code`: 게임 내부 음식 식별자
- `food_name`: 음식명
- `category`: 음식 분류
- `energy_kcal`: 열량
- `carbohydrate_g`: 탄수화물
- `protein_g`: 단백질
- `fat_g`: 지방
- `fiber_g`: 식이섬유
- `sugar_g`: 당류
- `sodium_mg`: 나트륨
- `image`: 프론트엔드 이미지 경로
