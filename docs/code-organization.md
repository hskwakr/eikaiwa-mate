# Code Organization

> Phase 1 (MVP) で確立した配置ルール。Phase 2 以降の追加 feature でも同パターンに従う。

## src/ レイアウト

```
src/
├── app/                            (Next.js App Router)
│   ├── <route>/
│   │   ├── page.tsx
│   │   ├── _components/            (route 固有 components)
│   │   ├── _hooks/                 (route 固有 hooks、必要時のみ作成)
│   │   └── _actions/               (route 固有 Server Actions、必要時のみ作成)
│   ├── api/<route>/route.ts        (API routes)
│   └── globals.css
├── components/                     (共有 UI components)
│   ├── ui/                         (shadcn 固定)
│   └── <feature>/                  (by-feature 区分け、例: subtitles/, state-badge/)
├── features/                       (feature module = API integration + hooks + types の集約)
│   └── <feature>/
│       ├── hooks/                  (React 利用面、常に sub-folder)
│       ├── actions/                (Server Actions、出現時に sub-folder)
│       ├── server/                 (server-only helper、API route 経由で使用)
│       ├── types.ts                (公開型、複数化したら types/ に昇格)
│       ├── constants.ts            (定数、複数化したら constants/ に昇格)
│       ├── <domain-impl>.ts        (pure domain code、例: adapter.ts)
│       ├── index.ts                (クライアント向け barrel、server/ 除外)
│       └── README.md               (任意、契約ドキュメント)
└── lib/                            (framework-agnostic な真の utility のみ)
    └── utils.ts                    (例: cn)
```

## 配置の判断軸: Hybrid B (by-feature colocation)

- 共有: `src/components/` / `src/features/` / `src/lib/`
- route 固有: `src/app/<route>/_components/` / `_hooks/` / `_actions/`
- ルール: 「**ページ固有と断言できないものは共有**」(迷ったら共有に置き、後で `_components/` に降ろす方が逆より楽)
- shadcn は **`src/components/ui/` 固定**(features へ降ろさない、components 配下に留める)

## features/<feature>/ 内部ルール

**境界フォルダ(常に nested)**: cross-boundary code は folder に閉じる

- `hooks/` — React-bound(`use*`)
- `actions/` — Server-bound(`'use server'`)
- `server/` — Node.js-only helper(API route / Server Action から import、client bundle に含めない)

**Pure data ファイル(flat、複数化したら folder 昇格)**:

- `types.ts` → 複数なら `types/`
- `constants.ts` → 複数なら `constants/`
- `<domain-impl>.ts`(例: `adapter.ts` / `createOpenAIRealtimeAdapter.ts`)→ adapter が複数なら `adapters/`

**barrel**:

- `index.ts` は **クライアント向け公開 API のみ** を re-export。`server/` の中身は別 entry(`@/features/<feature>/server`)から import する

## hooks 化判断基準

API 連携を hook 化するかどうかは、以下 3 軸で判断する。

| 種別 | 例 | 推奨パターン | 配置 |
|------|----|-------------|------|
| Read (one-shot, no-cache) | 初期データ取得 | 純 hook → `() => Promise<T>` を返す | `features/<f>/hooks/` |
| Service call (no persistent state) | token 発行, send email, RPC | 純 hook → `{ fetch, isPending, error }` | `features/<f>/hooks/` |
| Mutate persistent server state | DB 更新, 設定保存 | Next.js Server Actions(revalidation 活用) | `features/<f>/actions/` または `app/<route>/_actions/` |

**判断軸 3 つ**:

1. Read か Service call か Mutation か
2. Mutation の場合、**永続 server state が残るか**(yes → Server Actions / no → hook 化)
3. UI に loading/error を出すか(yes → `{ fetch, isPending, error }` / no → `() => Promise<T>`)

> Read で cache / 共有が要件として出てきたら TanStack Query / SWR の採用を検討。**現状(Phase 1〜2)は採用予定なし**、純 hook で十分。

## 命名規約

| 種類 | パターン | 例 |
|------|---------|----|
| Hook | `use<Resource>` (camelCase) | `useEphemeralToken`, `useRealtimeSession` |
| Server Action | `<verb><Resource>` (camelCase、動詞 prefix) | `createEphemeralSession`, `updateProfile` |
| React Component | `PascalCase` | `SubtitleBubble`, `StateBadge` |
| 境界フォルダ | lowercase | `hooks/`, `actions/`, `server/` |
| Feature folder | lowercase(複合語は kebab-case) | `realtime/`, `translate/`(将来) |
| Route 固有 folder | underscore prefix | `_components/`, `_hooks/`, `_actions/` |

## 参考

- adapter 契約の具体例: [`src/features/realtime/README.md`](../src/features/realtime/README.md)
- テスト方針: [`testing.md`](testing.md)
