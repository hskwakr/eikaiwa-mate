# Unit / Component テスト

> 入口・動機の整理・Coverage policy は [README.md](./README.md)、e2e は [e2e.md](./e2e.md)。
> 本ファイルは白箱の unit / component テスト(設計契約の言語化 + 開発中の fast feedback)
> を扱う。

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
| WebRTC | unit ではテストしない | ブラウザ / 実マイク依存。e2e(Chromium fake media stack)でカバー → [e2e.md](./e2e.md) |

## What we do NOT test(unit で)

- `RTCPeerConnection` / `getUserMedia` の挙動(unit では永続的にやらない方針。e2e に委ねる)
- 実 API への E2E(Phase 後半 / デプロイ前)
- `useRealtimeSession` テストから global `fetch` を直接叩く方式 — adapter 層 DI モックが副作用境界として既に存在するため、`fetch` の差し替えは `useEphemeralToken` 単体テストに閉じる

## fetch を扱うテスト

- `useEphemeralToken` 単体テストは `vi.stubGlobal("fetch", mock)` + `afterEach(() => vi.unstubAllGlobals())` で per-test 分離する(global 副作用が次テストに漏れない)
- 同 hook 以外で `fetch` をモックする必要が出たら、それは新しい service hook に切り出すサイン

## File layout

- テストファイルは同居(`Foo.test.tsx` を `Foo.tsx` と並べる) — by-feature コロケーションと整合
- Mock adapter: `src/features/realtime/__mocks__/adapter.ts`(vitest `__mocks__/` 規約)

> Note: e2e PR2 で fake adapter を `src/features/realtime/fakes/createFakeAdapter.ts`
> に共通化し、`createMockAdapter` → `createFakeAdapter` へ命名統一 + `__mocks__/` 削除を
> 予定している(Martin Fowler 分類で Fake が正)。本ファイルの `__mocks__/` 記述は
> その移行までの現状を表す。詳細は [e2e.md](./e2e.md)。

## 関連

- 命名規約 / hooks 化判断基準 / `_hooks/` 規約 / `src/features/` 配置ルール: [`code-organization.md`](../code-organization.md)
- adapter 契約: [`src/features/realtime/README.md`](../../src/features/realtime/README.md)
