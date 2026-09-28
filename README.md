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

정적 파일이므로 로컬 서버로 열면 됩니다.

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

브라우저에서 `http://localhost:8080` 접속

## 배포 (Vercel)

1. [Vercel](https://vercel.com)에 프로젝트 연결
2. Root Directory: 이 폴더
3. Build Command / Output Directory: 비워두기 (정적 사이트)
4. Deploy

## 기술 스택

- HTML5 / CSS3 / Vanilla JavaScript
- Google Fonts (Cormorant Garamond, Noto Sans KR)

## Supabase 문의 연동

문의 폼 제출 시 Supabase `submit_inquiry` RPC로 `inquiries` 테이블에 저장됩니다.

1. [`../6.lumera-lab-admin/supabase/README.md`](../6.lumera-lab-admin/supabase/README.md) 에서 DB·Auth 설정
2. `js/config.js` 에 Project URL·anon key 입력
3. 프론트: `js/main.js` (Supabase JS)

레거시 Google Sheets·이메일 알림은 `apps-script/Code.gs` 참고 (현재 런타임 경로 아님).

## 2차 확장 (미구현)

- GA4, reCAPTCHA
- 다국어(KR/EN)
