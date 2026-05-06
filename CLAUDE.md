@AGENTS.md

# Project: eikaiwa-mate

英会話 Web アプリ MVP。AI と英語で音声会話 + 双方向字幕。仕様・計画・進捗の管理フォルダ絶対パスは `CLAUDE.local.md`(個人ローカル、git 管理外)に集約する。

## Pinned runtime versions

これらは固定。バージョン変更は専用タスクとして扱う。

- Node: `.node-version`(= `24`)を Single Source of Truth とする。`engines.node` は採用しない(重複ドリフト回避)。
- pnpm: `10.33.3`(`package.json` の `packageManager`)。corepack がバージョン強制。
- Next.js: `16.2.4`
- React: `19.2.4`
- Tailwind CSS: `^4`

## Tailwind v4(CSS-first 構成)

`tailwind.config.js` を持たない。設定は `src/app/globals.css` 内で完結する:

- `@import "tailwindcss"` でランタイム取り込み
- `@theme` / `@theme inline` でデザイントークン(`--color-*` / `--font-*` / `--radius-*` 等)を宣言
- shadcn 既定変数の上に `--you` / `--mate` / `--orb-*` 等の拡張トークンを追加する形を取る

トークンの正は `globals.css`。Tailwind ユーティリティ生成も同ファイル経由。

## Next.js 16

- Turbopack が `dev` / `build` 両方でデフォルト
- App Router 前提(`src/app/`)
- 仕様詳細・破壊的変更は `node_modules/next/dist/docs/` を参照(`AGENTS.md` の指示)

## 依存管理

- 標準コマンドは `pnpm install --frozen-lockfile`。lockfile が 1 byte でも変わると失敗する運用。
- rebase / merge 後は必ず `pnpm install --frozen-lockfile` で機能整合をチェック。失敗したら `--no-frozen-lockfile` で regen し、別 commit で切り出す(amend は使わない)。
- `pnpm-lock.yaml` の git auto-merge は textual に通っても functional に壊れる典型例があるため、合流時は必ず再検証する。

## 検証コマンド

merge 前は両方 green を前提とする。

- 型チェック: `pnpm tsc --noEmit`
- ビルド: `pnpm build`

## Realtime adapter 契約

OpenAI Realtime API は薄い adapter 越しに呼ぶ(将来差し替えの可能性あり)。公開型と設計判断 6 箇条は `src/lib/realtime/README.md` を参照。adapter 内部実装は Sprint 2 で進める。

## 並列開発

Sprint 1 は `wtp` で worktree を分けて並列実行する運用。同一ファイル(特に `globals.css` の `@theme inline`)を複数 Track が同時編集しないよう、Track ごとに編集対象を明確に分離する。
