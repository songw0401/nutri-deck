# Nutri-Deck Fullstack

기존 목업 UI를 유지하면서 프로젝트를 **데이터 / 백엔드 / UI** 세 영역으로 분리한 버전입니다.

```text
nutri-deck/
├─ data/                 # 데이터 분석·전처리 및 최종 게임용 데이터
│  ├─ processed/
│  │  └─ game_foods.json
│  └─ pipeline/
│     └─ validate_game_foods.py
├─ backend/              # FastAPI
│  └─ app/
└─ frontend/             # 기존 React/Vite 목업 UI
```

## 1. 데이터 검증

```bash
python data/pipeline/validate_game_foods.py
```

## 2. 백엔드 실행

```bash
cd backend
python -m venv .venv
# Windows
.venv\\Scripts\\activate
# macOS/Linux
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API 문서: `http://localhost:8000/docs`

## 3. UI 실행

새 터미널에서:

```bash
cd frontend
npm install
# .env.example을 .env로 복사
npm run dev
```

UI: `http://localhost:5173`

백엔드가 켜져 있으면 실제 FastAPI를 사용합니다. 백엔드가 꺼져 있어도 기존 목업 로직으로 폴백하므로 발표 시연은 유지됩니다.

## 구현된 백엔드 기능

- 음식 전체/개별 조회
- 선택 음식 영양성분 합산
- 레벨별 게임 문제 생성
- LEVEL 1~3 정답 및 미션 조건 평가
- 점수 산출
- 게임 결과 저장(SQLite)
- 게임 기록/랭킹 조회
