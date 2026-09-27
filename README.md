# Nutri-Deck Fullstack

뉴트리 덱은 **메뉴젠 음식·재료·조리 정보 Open API + 국가표준식품성분 Database 10.4**를 결합해 음식 카드의 영양정보를 만드는 체험형 영양교육 게임입니다.

```text
nutri-deck/
├─ data/                 # 공공데이터 수집·연계·게임 DB 생성
│  ├─ pipeline/
│  │  ├─ sync_menuzen.py
│  │  └─ validate_game_foods.py
│  ├─ reference/         # 국가표준식품성분 DB 10.4 정규화 기준 데이터
│  └─ processed/
│     └─ game_foods.json # 백엔드가 사용하는 마지막 동기화 결과
├─ backend/              # FastAPI
└─ frontend/             # React/Vite 게임 UI
```

## 1. 공공데이터 동기화

메뉴젠 데이터는 저장된 CSV를 원천으로 사용하지 않고 공공데이터포털 Open API에서 직접 수집합니다. 서비스키는 GitHub에 올리지 않고 `backend/.env`에만 보관합니다.

```powershell
copy backend\.env.example backend\.env
notepad backend\.env
```

`backend/.env`에 발급받은 키를 입력합니다.

```text
DATA_GO_KR_SERVICE_KEY=발급받은_서비스키
MENUZEN_PAGE_SIZE=20
```

프로젝트 루트에서 동기화합니다.

```powershell
.\backend\.venv\Scripts\python.exe data\pipeline\sync_menuzen.py
```

동기화 과정은 다음과 같습니다.

```text
메뉴젠 Open API
→ 메뉴/재료/사용량 수집
→ 국가표준식품성분 DB 10.4 연계
→ 재료별 영양량 계산
→ 메뉴 단위 합산
→ game_foods.json 생성
```

API 장애나 발표 환경을 고려해 저장소에는 마지막 정상 동기화 형식의 실제 공공데이터 메뉴 200건을 캐시해 두며, 위 명령을 실행하면 API 전체 수집 결과로 자동 교체됩니다.

## 2. 백엔드 실행

```powershell
cd backend
py -3.8 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

## 3. 게임 UI 실행

새 PowerShell에서:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

브라우저에서 `http://localhost:5173`을 열면 됩니다.

## 데이터 처리 원칙

- 메뉴젠 `fd_Code`를 완성 음식 카드 식별자로 사용
- 메뉴젠의 재료명·식품군을 국가표준식품성분 DB와 연계
- 재료 영양량 = 국가 DB 100g당 영양값 × 메뉴젠 재료중량(g) / 100
- 모든 재료를 합산하여 완성 메뉴의 영양성분 산출
- 필요한 영양소가 누락되거나 매핑이 불명확한 메뉴는 자동 제외
- API 키와 개인 환경파일은 Git에 커밋하지 않음
