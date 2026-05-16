# Testing Strategy

> Phase 1 (MVP) で確立したテスト方針。Phase 2 以降に拡張する際はここを更新する。

## Status

Phase 1 (MVP) 中、テスト基盤は smoke 中心の最小構成。

## Tooling

- Test runner: **vitest**
- DOM: **jsdom**
- Component testing: **@testing-library/react**
- Mock strategy: **adapter 層 DI**(MSW は Phase 2 で `/api/translate` 等が増えたら導入)

## Layer-by-layer mock strategy

| Layer | Strategy | Why |
|---|---|---|
| Presentational components | props 直渡し | データソースに依存しない |
| Hook (`useRealtimeSession`) | `RealtimeAdapter` を DI でモック注入 | adapter が抽象境界として既にあり、副作用 (WebRTC / fetch) が adapter の内側に閉じている |
| API route | MSW (Phase 2) | 現状は対象なし |
| WebRTC | テストしない | ブラウザ / 実マイク依存。Playwright + 手動 smoke でカバー |

## What we do NOT test

- `RTCPeerConnection` / `getUserMedia` の挙動(永続的にやらない方針)
- 実 API への E2E(Phase 後半 / デプロイ前)
- `useRealtimeSession` テストから global `fetch` を直接叩く方式 — adapter 層 DI モックが副作用境界として既に存在するため、`fetch` の差し替えは `useEphemeralToken` 単体テストに閉じる

## fetch を扱うテスト

- `useEphemeralToken` 単体テストは `vi.stubGlobal("fetch", mock)` + `afterEach(() => vi.unstubAllGlobals())` で per-test 分離する(global 副作用が次テストに漏れない)
- 同 hook 以外で `fetch` をモックする必要が出たら、それは新しい service hook に切り出すサイン

## Coverage policy

- **Phase 1 (MVP)**: smoke 中心。`rules/common/testing.md` の 80% 要件は適用外。
- **Phase 2 以降**: 80% 目標に戻す。

## File layout

- テストファイルは同居(`Foo.test.tsx` を `Foo.tsx` と並べる) — by-feature コロケーションと整合
- Mock adapter: `src/features/realtime/__mocks__/adapter.ts`(vitest `__mocks__/` 規約)

## 関連

- 命名規約 / hooks 化判断基準 / `_hooks/` 規約 / `src/features/` 配置ルール: [`code-organization.md`](code-organization.md)
- adapter 契約: [`src/features/realtime/README.md`](../src/features/realtime/README.md)
