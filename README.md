# mynews-2609

RSS 뉴스를 2시간마다 수집해 대시보드로 보여주고, 매일 오전 9시(KST)에 Discord로 요약을 보내는 GitHub Actions 기반 자동화입니다.

## 구성

- `scripts/feeds.mjs` — 수집할 RSS 피드 목록 (이름 / URL / 카테고리)
- `scripts/collect.mjs` — 피드를 수집해 `docs/data/latest.json`(최근 3일)과 `docs/data/archive/YYYY-MM.json`(월별 전체 히스토리)에 저장
- `scripts/digest.mjs` — 최근 24시간 뉴스를 카테고리별로 정리해 Discord 웹훅으로 발송
- `docs/` — GitHub Pages로 서비스되는 정적 대시보드 (최신 뉴스 + 히스토리 검색)
- `.github/workflows/collect.yml` — 2시간마다 수집 후 데이터 커밋/푸시
- `.github/workflows/digest.yml` — 매일 00:00 UTC(=09:00 KST)에 Discord 요약 발송

## 로컬 실행

```bash
npm install
npm run collect          # RSS 수집 → docs/data/*.json 갱신
DISCORD_WEBHOOK_URL=... npm run digest   # Discord로 요약 발송 테스트
```

## GitHub Pages 활성화

저장소 Settings → Pages → Source를 "Deploy from a branch", Branch를 `main` / `docs` 폴더로 지정하면
`https://<username>.github.io/mynews-2609/` 에서 대시보드를 볼 수 있습니다.

## Discord 웹훅

저장소 Settings → Secrets and variables → Actions에 `DISCORD_WEBHOOK_URL` 시크릿이 등록되어 있어야 합니다.

## 피드 추가/변경

`scripts/feeds.mjs`의 `FEEDS` 배열에 `{ id, name, url, category }` 형식으로 추가하면 됩니다.
