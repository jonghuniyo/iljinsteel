# 2026-06-01 배포 빌드 오류 수정

## 증상
Netlify / Vite / PWA 빌드 단계에서 `assets/index-fixed-20260601.js` 파싱 중 아래 오류로 실패했습니다.

- `Identifier "MT" has already been declared`

## 원인
이전 UI 패치 과정에서 주요 React 컴포넌트가 같은 번들 파일 안에 중복 선언되었습니다.

중복 대상:
- `MT` 사이드바 컴포넌트
- `RT` 상단 헤더 컴포넌트
- `BT` 플로팅 액션 버튼 컴포넌트
- `dA` 레이아웃 루트 컴포넌트
- `xJ` 홈 화면 컴포넌트
- `ILMarketStrip` 홈 시세 스트립 컴포넌트

ES module / Rollup 번들링에서는 같은 스코프의 동일 identifier 중복 선언이 SyntaxError로 처리되므로 Netlify 빌드가 중단되었습니다.

## 수정
최신 기능이 반영된 뒤쪽 컴포넌트 정의만 사용되도록 유지하고, 앞쪽 구버전 중복 정의는 `_OLD` 접미사로 변경해 빌드 파서 충돌을 제거했습니다.

## 검증
- `node --check assets/index-fixed-20260601.js` 통과
- `node --check netlify/functions/*.mjs` 통과
- 중복 대상 함수명 재검사 결과 각 1회만 선언됨
