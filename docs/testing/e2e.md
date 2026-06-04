# E2E テスト方針

> 入口・動機の整理は [README.md](./README.md)、unit は [unit.md](./unit.md)。
> 本ファイルは e2e の**規範(どう書くか / 何を観測するか / 何を SoT とするか)**を定める。
> シナリオ本体は [`e2e/scenarios/`](../../e2e/scenarios/README.md)。
>
> **本 PR (PR1) のスコープ**: 本ファイル(方針)+ シナリオ markdown 3 本 + 横断 README のみ。
> Playwright 依存 / `playwright.config.ts` / fake adapter 実装 / `spec.ts` / WAV fixture /
> CI workflow は **PR2 (`chore/e2e-implementation`)** で追加する。本ファイルは PR2 の実装が
> 従う設計ラインを先に固定するもの。

## なぜ Playwright Test なのか(Q1)

- 採用: **`@playwright/test`**(Playwright のテストランナー)。実 Chromium でアプリを起動し、
  ユーザー観測に近い形で受け入れ条件を検証する。
- fake adapter で Realtime/WebRTC 副作用を抑え、`page.route()` で `/api/session` を握る。
- 不採用: 手動 playwright-cli のみ(再現性なし)/ 半自動。**回帰検知(README の主軸動機)**には
  自動で繰り返せるランナーが要る。

## WebRTC / マイクの扱い(Q2 — Chromium fake media stack)

- 実 `RTCPeerConnection` の完全 mock サーバは自前実装が重く、OSS の実用品も無いため**採用しない**
  (S2 として Out of scope。実 WebRTC 起因の regression が実害化した時に再検討)。
- 代わりに **Chromium fake media stack** を使う:
  - `--use-fake-device-for-media-stream`(getUserMedia を実際に通すが、合成デバイスを使う)
  - `--use-fake-ui-for-media-stream`(許可ダイアログを自動承認)/ 拒否シナリオは権限を明示的に deny
  - WAV fixture を合成入力として流す(PR2 で追加)
- adapter は e2e では **no-op**(実 WebRTC を張らない)。「実音声が再生される」類の受け入れ条件は
  fake stack では検証できない → **superset**(後述)として扱う。

## fake adapter の e2e 連携(Q9 — PR2 で実装予定)

PR1 では実装しないが、PR2 が従う API 方針をここで固定する。

- 共通 fake: `src/features/realtime/fakes/createFakeAdapter.ts`(unit / e2e 共用、命名は
  `createFakeAdapter`。旧 `createMockAdapter` は廃止、`__mocks__/` も削除 — Martin Fowler 分類で
  Fake が正)。
- factory: `src/features/realtime/createAdapter.ts` が環境変数で実 adapter / fake を分岐する
  (`NEXT_PUBLIC_REALTIME_MOCK=true` で fake)。
- e2e 制御サーフェス: `window.__realtimeFake__`(例: `window.__realtimeFake__.emit(event)`)で
  spec.ts 側から transcript / state / error イベントを注入する。`RealtimeEvent` 型に従う。
- これにより spec.ts は「ユーザーが話した → AI が返した」を実 API なしに決定論的に再現できる。

## フォルダ構成(Q3 — 並列 markdown スタイル)

```
e2e/
├── scenarios/          # 受け入れ仕様(markdown、SoT)。本 PR で作成
│   ├── README.md       # 横断マップ(一覧 / エラーコード網羅 / カバレッジ)
│   ├── phase-1-conversation-happy.md
│   ├── phase-1-mic-permission-denied.md
│   └── phase-1-token-fetch-failed.md
└── specs/              # 実装(`*.spec.ts`)。PR2 で追加。各 scenario md に対応
```

- `scenarios/<name>.md` と `specs/<name>.spec.ts` を名前で対応づける(BDD/Gherkin は採用しない。
  シナリオ 10+ になったら playwright-bdd 移行を再検討 = Out of scope)。

## シナリオ markdown の書き方

各シナリオは core 5 セクションで構成する:

1. **受け入れ条件** — spec.md / plan.md 由来。なぜこの挙動が要るか
2. **前提** — token 成否 / マイク許可 / fake 化の条件
3. **ユーザー行動** — playwright-cli の操作列ではなく自然言語の行動。実装手順に踏み込まない
4. **観測すべき事項** — DOM / state / aria など、ユーザーが観測できる事象(後述の粒度ルール)
5. **失敗とみなすケース** — 回帰として検出したい逸脱

横断情報(シナリオ一覧 / エラーコード網羅 / done 条件カバレッジ)は各 md に重複させず
[`e2e/scenarios/README.md`](../../e2e/scenarios/README.md) に集約する(Q3 (Y))。

## behavioral black-box 原則(観測の境界)

「実装を見ずに書く」は文字通りの spec-only ではなく、**内部構造に依存しない**と読む。

- **依存してよい**(観測可能なので書いてよい): 公開型 / DOM 構造 / ARIA 属性 / 画面に出る表示文字列
- **依存しない**: hook の内部ロジック / CSS class 名 / private な実装詳細

> Phase 1 は実装済みなので、動機は「ズレ発見」ではなく「現挙動を baseline として固める」
> (Issue #12)。公開型と観測可能 DOM を読んでシナリオを書くのは本原則と整合する。

## 観測子の粒度(Q1 観測子 = (P))

| 種別 | 扱い | 例 |
| --- | --- | --- |
| 安定識別子 | **exact で書く** | aria role(`alert`)/ `aria-live="polite"` / `aria-pressed` / エラーコード文字列(`token_fetch_failed` 等 = `RealtimeErrorCode` 型由来) |
| UI 文言 | **意味 + 実装ポインタで書く** | state label は「接続処理中を示す状態(`STATE_LABEL` 参照)」、button label はマイクトグル(`page.tsx`)/ セッション制御(`SessionControl.tsx`)の文言として実装裁量(exact 文字列で固定しない) |

理由: 文言を exact 固定すると i18n / コピー調整のたびに md と spec.ts が壊れる。a11y 上の安定識別子
だけ exact にすれば回帰検知の精度と保守性が両立する。

## superset(md ⊇ spec.ts)

- シナリオ md は「あるべき受け入れ仕様」を書ききる(M2 = superset)。
- fake stack でテスト不能な項目(例: happy path の「字幕とほぼ同期して実音声が再生される」は
  adapter no-op で実音声が流れない)も仕様として md に残し、**「PR2 spec.ts カバー外」マーカー**を付ける。
- spec.ts は md の**テスト可能 subset** を実装する。テスト不能を理由に「あるべき振る舞い」を md から
  削らない(それは受け入れ仕様の劣化になる)。

## Source of Truth(Q4 同期方向 = (S1))

- **シナリオ md が単一 SoT**、`spec.ts` は従属。spec.ts は md にない assert を勝手に足さない。
- 例外: PR2 で spec.ts 実装中に「md の観測項目が assert 不能」と判明したら、その fb を受けて
  **md 側を修正**する(superset の subset 境界の調整)。md を腐らせない。

## CI 連携(Q7 — 最小 CI、PR2 で追加)

- `.github/workflows/test.yml` を新規(PR2)。`on: pull_request` + `push: main` + `workflow_dispatch`。
- unit (`pnpm test`) と e2e (`pnpm test:e2e`) の両方を **PR 必須チェック**にする。
- 実 API を叩く nightly smoke は別 Issue(fake stack は時間 / 外部依存なしのため nightly の
  現状価値は薄い)。手動キックは `workflow_dispatch` でカバー。

## 関連

- シナリオ本体 / 横断マップ: [`e2e/scenarios/README.md`](../../e2e/scenarios/README.md)
- adapter 契約(公開型 `RealtimeAdapter` / `RealtimeEvent` 等): [`src/features/realtime/README.md`](../../src/features/realtime/README.md)
- unit テスト方針: [unit.md](./unit.md)
