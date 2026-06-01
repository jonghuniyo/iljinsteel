# 2026-06-01 추가 기능 패치

## 추가된 기능

### 1. 생활 날씨 위젯
- 홈 우측 영역에 `생활 날씨` 카드 추가
- 지역 선택: 익산, 서울, 포항, 부산, 창원
- 현재 기온, 체감온도, 습도, 바람, 날씨 상태 표시
- 12시간 내 강수확률 기반 우산 알림 표시
- PM10/PM2.5 기반 미세먼지 등급 표시
- 선택 지역과 최근 조회값은 localStorage에 저장
- 데이터 소스: Open-Meteo Forecast API / Air Quality API
- 서버 함수: `/api/weather`

### 2. D-day 카운트다운 위젯
- 홈 우측 영역에 `D-day 카운트다운` 카드 추가
- 퇴근까지 남은 시간 자동 계산
- 월급날 D-day 자동 계산
- 주말 D-day 자동 계산
- 사용자가 연휴/기념일 직접 추가 및 삭제 가능
- 월급일, 퇴근시간, 추가 D-day는 localStorage에 저장

## 수정 파일
- `assets/index-fixed-20260601.js`
- `netlify/functions/weather.mjs`
- `FEATURE_NOTES_20260601.md`

## 검증
- `node --check assets/index-fixed-20260601.js` 통과
- `node --check netlify/functions/weather.mjs` 통과
- 현재 작업 환경은 외부 fetch가 제한되어 있어 Open-Meteo 실시간 응답은 배포 환경에서 확인 필요
