# LUMERA LAB — 원페이지 랜딩 MVP

주식회사 루메라랩(LUMERA LAB) 회사소개 원페이지 랜딩입니다.

## 구성

- **Hero** — 브랜드 필름 배경 영상
- **About** — 회사 소개
- **Products** — 제품 3종 (N°01~03)
- **Research** — 연구소 배경 영상
- **Trust** — 품질·투명성
- **Contact** — 일반/B2B 문의 폼

## 사용 자산

`source/` 폴더의 이미지·영상만 사용합니다.

| 파일 | 용도 |
|------|------|
| V-01_Hero_Film.mp4 | Hero 배경 |
| V-02_Research_Loop.mp4 | Research 배경 |
| V-03_Texture_Loop.mp4 | Trust 배경 |
| HERO.jpeg, RESEARCH.jpeg, M-03_Researcher.jpeg | 영상 poster/대체 |
| M-04_Skin_Macro.jpeg | About |
| P_01~P_03_product_*.jpeg | 제품 카드 |
| CONTACT.jpeg | Contact 배경 |

## 로컬 실행

```bash
npx serve .
```

브라우저에서 `http://localhost:8080` (또는 serve가 안내하는 포트) 접속

## Supabase 문의 연동

문의 폼 제출 시 Supabase `submit_inquiry` RPC로 `inquiries` 테이블에 저장됩니다.

1. [`../6.lumera-lab-admin/supabase/README.md`](../6.lumera-lab-admin/supabase/README.md) — DB·Auth
2. 로컬: `js/config.js` (예: `js/config.example.js` 복사 또는 sync 스크립트)
3. Vercel: `SUPABASE_URL`, `SUPABASE_ANON_KEY` 환경 변수

## 배포 (Vercel)

```bash
npx vercel deploy --prod --scope 1959kimik-4270
```

`vercel.json`의 `buildCommand`가 배포 시 `js/config.js`를 생성합니다.

## 기술 스택

- HTML5 / CSS3 / Vanilla JavaScript
- Supabase JS
- Google Fonts (Cormorant Garamond, Noto Sans KR)

## 2차 확장 (미구현)

- GA4, reCAPTCHA
- 다국어(KR/EN)
