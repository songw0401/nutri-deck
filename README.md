# Nutri-Deck

공공데이터 기반 체험형 영양교육 게임입니다. 프로젝트는 **데이터 / FastAPI 백엔드 / React UI**로 분리되어 있습니다.

```text
nutri-deck/
├─ data/
│  ├─ pipeline/sync_menuzen.py
│  ├─ processed/game_foods.json
│  └─ reference/
├─ backend/
│  └─ app/
└─ frontend/
```

## 데이터 구조

뉴트리 덱은 두 공공데이터를 역할별로 사용합니다.

- **메뉴젠 Open API (data.go.kr 15143502)**: 음식코드, 음식명, 분류, 구성 재료, 재료중량
- **국가표준식품성분 Database 10.4**: 식품별 100g 기준 영양성분

서비스는 사용자가 카드를 누를 때마다 공공 API를 호출하지 않습니다. **메뉴젠 API를 수집·검증해 게임용 캐시를 만든 뒤 FastAPI가 그 캐시를 제공**합니다. 따라서 API 지연이나 일일 호출량이 실제 게임 플레이에 직접 영향을 주지 않습니다.

`menuzen_ingredient.csv`는 런타임 데이터가 아니라 기존 API 수집본을 이용해 `food_Code` crosswalk를 검증하기 위한 개발 자료입니다.

## 1. 메뉴젠 API 연결

`backend/.env.example`을 `backend/.env`로 복사하고 공공데이터포털에서 발급받은 서비스키를 입력합니다.

```env
DATA_GO_KR_SERVICE_KEY=발급받은_서비스키
MENUZEN_PAGE_SIZE=20
SYNC_MENUZEN_ON_STARTUP=false
ENABLE_DATA_SYNC_ENDPOINT=false
```

프로젝트 루트에서 공공데이터를 갱신하려면:

```bash
python data/pipeline/sync_menuzen.py
```

성공하면 다음 파일이 갱신됩니다.

- `data/processed/game_foods.json`
- `frontend/data/foods.json`
- `data/processed/data_sync_meta.json`

배포 환경에서 서버 시작 시 자동 갱신하려면 `SYNC_MENUZEN_ON_STARTUP=true`로 설정할 수 있습니다. API가 일시적으로 실패해도 기존 검증 캐시가 있으면 서비스는 계속 실행됩니다.

## 2. 백엔드 실행

Windows PowerShell 기준:

```powershell
cd backend
py -3.8 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

## 3. UI 실행

새 PowerShell에서:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

브라우저에서 `http://localhost:5173`을 열면 됩니다.

프론트는 백엔드의 `/api/foods`에서 게임 카드 데이터를 불러옵니다. 백엔드가 꺼져 있으면 저장된 검증 캐시를 사용하여 시연이 계속됩니다.

## 데이터 검증 방식

- 기존 메뉴젠 API 수집본의 고유 `food_Code` 1,425개를 국가표준식품성분 DB와 식품명 exact match로 검증
- 메뉴젠에 출처가 존재하는 항목은 국가DB 출처와도 일치하는지 추가 확인
- 런타임에서는 `food_Code` crosswalk를 우선 사용
- API에 새로운 식품코드가 추가되면 국가DB의 고유한 동일 식품명으로만 fallback
- 매핑 불가, 재료중량 오류, 필수 영양성분 결측이 있는 메뉴는 게임 데이터에서 제외
- 메뉴 영양량은 `100g당 영양성분 × 실제 재료중량(g) / 100`으로 계산 후 메뉴 단위 합산
