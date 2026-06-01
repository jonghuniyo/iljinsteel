# ILJIN Portal 버그 픽스 내역 (2026-06-01)

## 수정한 문제

### 1. 홈 대시보드 광물 시세/유가 정보 미출력
- 원인: 프론트엔드는 `category` 필드로 `metal`, `steel`, `oil`을 필터링했지만, Vercel API Route `metals.mjs`는 `cat` 필드만 반환했습니다.
- 수정: `cat`과 `category`를 모두 반환하도록 변경했습니다.
- 추가 수정: 천연가스 Yahoo Finance 심볼 오타 `GNF=F`를 `NG=F`로 변경했습니다.
- 보완: 외부 API 연결 실패 시 화면 전체가 비지 않도록 `(샘플)` 표시가 붙은 fallback 데이터를 반환합니다.

### 2. 광물 시세 페이지 차트 미출력
- 원인: `FRED_API_KEY`가 없으면 `series` 메타데이터만 반환하고 `observations`가 없어 차트에 표시할 데이터가 없었습니다.
- 수정: `FRED_API_KEY`가 있으면 공식 FRED API를 우선 사용하고, 키가 없거나 실패하면 FRED CSV fallback을 시도합니다.
- 보완: 모든 외부 호출이 실패해도 샘플 fallback을 반환하여 UI가 깨지지 않게 했습니다.

### 3. 식단표 등록 기능 실패
- 원인: 카카오 채널 게시물에서 `og:image`가 추출되지 않으면 저장 로직이 중단되었습니다.
- 수정: 이미지 URL 자동 추출 성공 시 이미지를 저장하고, 실패 시 카카오 게시물 링크 카드로 저장되도록 번들 JS를 패치했습니다.
- 기본 주간 식단표 링크: https://pf.kakao.com/_uFfAX/posts
- 기본 게시물 링크: https://pf.kakao.com/_uFfAX/113306857

## 변경 파일
- `netlify/functions/metals.mjs`
- `netlify/functions/mineral.mjs`
- `netlify/functions/meal.mjs`
- `assets/index-fixed-20260601.js`
- `index.html`

## 검증
- `node --check assets/index-fixed-20260601.js` 통과
- `metals.mjs`, `mineral.mjs`, `meal.mjs` 핸들러 로컬 호출 통과
- 로컬 환경은 외부 인터넷 연결이 제한되어 실제 Yahoo/FRED/Kakao fetch는 fallback으로 검증했습니다.
