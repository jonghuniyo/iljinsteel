# ILJIN Portal - Vercel 배포 안내

이 ZIP은 Netlify용 함수 경로를 Vercel용 `/api/*` 경로로 변환한 배포본입니다.

## 배포 방법

1. 이 ZIP을 압축 해제합니다.
2. GitHub 저장소에 파일 전체를 업로드합니다.
3. Vercel에서 `Add New Project`를 누르고 해당 GitHub 저장소를 Import합니다.
4. Framework Preset은 자동 감지 또는 Other 그대로 둡니다.
5. Build Command는 `npm run build`, Output Directory는 `dist`입니다. `vercel.json`에 이미 들어 있습니다.
6. 환경변수가 필요한 경우 Project Settings > Environment Variables에 추가합니다.
7. Deploy를 누릅니다.

## 필요한 환경변수

- `OPINET_API_KEY`: 국내 휘발유/경유 평균가 표시용. 없으면 해당 값만 안내 문구로 표시됩니다.
- `FRED_API_KEY`: FRED 광물 월간 지수 안정 호출용. 없으면 CSV fallback을 시도합니다.
- `METALS_DEV_KEY`: metals.dev 니켈 실시간 가격용. 없으면 표시 가능한 다른 참고값만 표시됩니다.
- `KBO_TEAM`: KBO 선호팀 설정용. 선택 사항입니다.

## 주요 변환 내용

- `/.netlify/functions/weather` -> `/api/weather`
- `/.netlify/functions/metals` -> `/api/metals`
- `/.netlify/functions/news` -> `/api/news`
- `/.netlify/functions/fx` -> `/api/fx`
- `/.netlify/functions/mineral` -> `/api/mineral`
- `/.netlify/functions/meal` -> `/api/meal`
