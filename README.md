# eikaiwa-mate

AI と英語で音声会話しながら、自分と AI の発話を字幕として画面表示する英会話練習用 Web アプリ。OpenAI Realtime API を使って、ブラウザのマイクから双方向の音声会話 + リアルタイム字幕を実現する。

スマホブラウザをメインターゲットにしたモバイルファースト設計(PC ブラウザでも動作)。MVP は localhost 動作のみ、デプロイは未対応。

## Requirements

- [Node.js](https://nodejs.org/) 24(`.node-version` を Single Source of Truth とする)
- [pnpm](https://pnpm.io/) 10.33.3(`package.json` の `packageManager` フィールドで固定。[Corepack](https://nodejs.org/api/corepack.html) を有効にすると自動で揃う)
- [OpenAI API key](https://platform.openai.com/api-keys)(Realtime API を呼ぶ ephemeral token 発行用)

## Setup

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
# .env.local を開いて OPENAI_API_KEY を埋める
```

`.env.example` には必要な環境変数のキー(`OPENAI_API_KEY` / `APP_ORIGIN`)とコメントが揃っている。実値は `.env.local` 側に書く。

## Development

```bash
pnpm dev              # 開発サーバ起動(http://localhost:3000)
pnpm tsc --noEmit     # 型チェック
pnpm build            # 本番ビルド
pnpm test             # vitest run(単発実行)
pnpm test:watch       # vitest watch モード
```

開発サーバ・ビルドとも [Turbopack](https://nextjs.org/docs/app/api-reference/turbopack) がデフォルト(Next.js 16)。

## Architecture

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router、Turbopack デフォルト)
- **UI**: [React 19](https://react.dev/) + [Tailwind CSS v4](https://tailwindcss.com/)(CSS-first 設定、`src/app/globals.css` 内の `@import "tailwindcss"` + `@theme` で完結、`tailwind.config.js` は持たない) + [shadcn/ui](https://ui.shadcn.com/)
- **音声 + LLM**: [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)(WebRTC / ephemeral token、薄い adapter 越しに呼ぶ)
- **テスト**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) + jsdom

詳細は以下を参照:

- コード配置・hook 化判断基準: [`docs/code-organization.md`](docs/code-organization.md)
- テスト方針: [`docs/testing.md`](docs/testing.md)
- Realtime adapter 契約: [`src/features/realtime/README.md`](src/features/realtime/README.md)

## License

[MIT](LICENSE)
