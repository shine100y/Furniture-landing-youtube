# 가구 키 콘텐츠 랜딩 [유튜브]

유튜브 영상으로 유입된 분들을 위한 배송인그룹 가구조립배송 기사 모집 랜딩페이지와 자체 지원 폼.

- 주소: https://shine100y.github.io/Furniture-landing-youtube/
- 반응형: 모바일(하단 고정 지원 버튼) / PC(상단 지원 버튼, 다단 배치)

## 파일 구성

| 경로 | 내용 |
| --- | --- |
| `index.html` | 페이지 본문 (문구 수정은 여기서) |
| `css/style.css` | 디자인 |
| `js/main.js` | 지원 폼 동작, **구글 시트 연결 주소(`SHEET_URL`)** |
| `js/regions.js` | 거주지역 시·도 / 시·군·구 목록 |
| `apps-script/Code.gs` | 구글 시트에 붙여넣을 앱스 스크립트 |
| `img/` | 이미지 |

## 유입경로 추적

링크 뒤에 utm 값을 붙이면 시트에 함께 저장됩니다.

```
https://shine100y.github.io/Furniture-landing-youtube/?utm_source=youtube&utm_campaign=영상이름
```

## 회사 멤버십 섹션

`index.html` 안의 `[회사 멤버십 섹션 삽입 위치 A]`, `[B]` 주석 자리에 추가 예정.
