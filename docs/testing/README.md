# Testing Strategy

> Phase 1 (MVP) で確立したテスト方針の入口。レイヤー別の詳細は
> [unit.md](./unit.md) / [e2e.md](./e2e.md) に分割している。Phase 2 以降に拡張する際は
> このフォルダを更新する。

## テストの動機(layer を決める前に動機を決める)

「とりあえずテストを書く」と layer が中途半端になる。書く前に、どの動機なのかを 1 つ
選んでから layer を決める。

| 動機 | 主な layer | eikaiwa-mate での位置づけ |
| --- | --- | --- |
| Regression(回帰検知) | e2e | **本フォルダの主軸**。Phase 1 既存挙動の baseline を固め、Phase 2 で `/api/translate` 等が増える前のズレ検知に使う |
| Acceptance(受け入れ条件の継続検証) | e2e シナリオ | spec.md / plan.md done 条件を [e2e/scenarios](../../e2e/scenarios/README.md) で言語化 |
| Contract(設計契約の言語化) | unit | adapter / hook の公開型・状態遷移を白箱で固定([unit.md](./unit.md)) |
| Fast feedback(開発中の高速検証) | unit | hook ロジックの race など e2e で出しにくい点 |
| TDD ガイド | unit | Phase 2 の未実装機能(翻訳)着手時に RED→GREEN |

> 実装済み機能(Phase 1)は **e2e で回帰検知**、未実装機能(Phase 2 翻訳)は
> **unit から TDD** という使い分けが現状の基本線。

## Coverage policy

- **Phase 1 (MVP)**: smoke 中心。`rules/common/testing.md` の 80% 要件は適用外。
- **Phase 2 以降**: 80% 目標に戻す。

## レイヤー別 mock 戦略(一覧)

| Layer | Strategy | 詳細 |
| --- | --- | --- |
| Presentational components | props 直渡し | [unit.md](./unit.md) |
| Hook (`useRealtimeSession`) | `RealtimeAdapter` を DI でモック注入 | [unit.md](./unit.md) |
| `useEphemeralToken` の fetch | `vi.stubGlobal` + `vi.unstubAllGlobals` で per-test 分離 | [unit.md](./unit.md) |
| API route | MSW(Phase 2 で `/api/translate` 等が増えたら導入) | — |
| WebRTC / getUserMedia | unit ではテストしない。e2e は Chromium fake media stack で実体を動かす | [e2e.md](./e2e.md) |
| Realtime adapter(e2e) | fake adapter(`createAdapter.ts` factory 経由、PR2 で実装) | [e2e.md](./e2e.md) |

## 関連

- 命名規約 / hooks 化判断基準 / `_hooks/` 規約 / `src/features/` 配置ルール: [`code-organization.md`](../code-organization.md)
- adapter 契約: [`src/features/realtime/README.md`](../../src/features/realtime/README.md)
- シナリオ markdown 一覧 / 横断マップ: [`e2e/scenarios/README.md`](../../e2e/scenarios/README.md)
