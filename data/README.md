# 데이터 영역

뉴트리 덱의 공공데이터 수집·연계·게임용 데이터 생성 영역입니다.

## 실제 서비스 데이터 흐름

```text
메뉴젠 Open API (data.go.kr 15143502)
        │ 메뉴/재료/재료중량
        ▼
food_Code crosswalk + 식품명 검증
        │
        ▼
국가표준식품성분 Database 10.4
        │ 100g당 영양성분 × 메뉴젠 재료중량 / 100
        ▼
완성 메뉴별 영양성분 계산
        │
        ├─ data/processed/game_foods.json
        └─ frontend/data/foods.json
```

메뉴젠은 정적 CSV를 읽는 방식이 아니라 `data/pipeline/sync_menuzen.py` 실행 시 **공공데이터포털 Open API를 직접 호출**합니다. API 호출 결과는 전처리·검증 후 게임용 캐시로 저장하여, 사용자가 카드를 누를 때마다 공공 API를 다시 호출하지 않습니다. 이 방식은 API 장애·응답속도·일일 호출량에 게임 플레이가 직접 영향을 받지 않게 합니다.

## 동기화

`backend/.env`에 공공데이터포털 서비스키를 넣은 뒤 프로젝트 루트에서:

```bash
python data/pipeline/sync_menuzen.py
```

동기화 결과와 매핑 통계는 `data/processed/data_sync_meta.json`에 저장됩니다.

## 게임 데이터 필드

- `food_code`: 메뉴젠 음식코드 (`fd_Code`)
- `food_name`: 메뉴젠 음식명
- `category`: 메뉴젠 음식 분류
- `energy_kcal`: 열량
- `carbohydrate_g`: 탄수화물
- `protein_g`: 단백질
- `fat_g`: 지방
- `fiber_g`: 식이섬유
- `sugar_g`: 당류
- `sodium_mg`: 나트륨
- `image`: 프론트엔드 이미지 경로
