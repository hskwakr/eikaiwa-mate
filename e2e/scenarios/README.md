# e2e シナリオ一覧(Phase 1 回帰 baseline)

このフォルダは Phase 1 の受け入れ仕様をシナリオ markdown として固めたもの。各 md が
**単一 source of truth (SoT)**、PR2 で追加する `e2e/specs/*.spec.ts` はこの md の
テスト可能 subset を実装する従属物。書き方・観測子の粒度・superset の定義・SoT ルールは
[docs/testing/e2e.md](../../docs/testing/e2e.md) を参照。

> **出典について**: 本フォルダが参照する `spec.md` / `plan.md`(Phase 1 done 条件・spec
> コア要件の出典)は、本リポジトリ管理外の仕様管理ドキュメント(個人ローカル)にあり、
> リポジトリには含めない運用。リポジトリ単体ではファイルとして辿れない点に留意。

## シナリオ一覧

| シナリオ | 経路 | 主な観測対象 |
| --- | --- | --- |
| [統合 happy path](./phase-1-conversation-happy.md) | token 成功 → mic 許可 → 会話 → 切断 | 状態遷移 `idle→connecting→listening→speaking→listening→idle` / 双方向字幕 |
| [マイク許可拒否](./phase-1-mic-permission-denied.md) | token 成功 → mic 拒否 | `mic_permission_denied` エラー UX / 再試行可能性 |
| [token 取得失敗](./phase-1-token-fetch-failed.md) | `/api/session` 失敗 | `token_fetch_failed` エラー UX / getUserMedia 未呼び出し |

## `RealtimeErrorCode` カバー状況

実装の `RealtimeErrorCode`(`src/features/realtime/types.ts`)4 値に対する本 PR の
シナリオカバー状況:

| エラーコード | カバー | シナリオ / 理由 |
| --- | --- | --- |
| `token_fetch_failed` | ✅ | [token 取得失敗経路](./phase-1-token-fetch-failed.md) |
| `mic_permission_denied` | ✅ | [マイク許可拒否経路](./phase-1-mic-permission-denied.md) |
| `connection_failed` | ❌ | WebRTC レイヤーの失敗。現状 fake adapter で再現する妥当な経路がなく backlog(実 WebRTC 起因の regression が実害になった時に再検討) |
| `unknown` | ❌ | catch-all。シナリオとしての具体性が低く対象外 |

## Phase 1 done 条件 × カバレッジ

plan.md Phase 1 done 条件 4 つと、各条件を観測するシナリオの対応:

| Phase 1 done 条件 | カバーするシナリオ | 備考 |
| --- | --- | --- |
| マイクで自分の英語を AI に送れる | [happy path](./phase-1-conversation-happy.md) | 拒否経路は [mic 拒否](./phase-1-mic-permission-denied.md) で裏面を観測 |
| AI が英語音声で返答する | [happy path](./phase-1-conversation-happy.md) | 実音声再生は superset(PR2 spec.ts カバー外) |
| 自分と AI 双方の発話が字幕表示される | [happy path](./phase-1-conversation-happy.md) | interim → final、role 別バブル |
| ブラウザで動作する(ローカル可) | 全シナリオ | Chromium fake media stack |

## 観測子の方針(要点)

詳細は [docs/testing/e2e.md](../../docs/testing/e2e.md) に集約。要点のみ:

- **安定識別子は exact**: aria role(`alert`)/ `aria-live` / エラーコード文字列
  (`RealtimeErrorCode` 由来)/ `aria-pressed`
- **UI 文言は意味 + 実装ポインタ**: state label は `STATE_LABEL`(`StateBadge.tsx`)、
  button label はマイクトグル(`page.tsx`)/ セッション制御(`SessionControl.tsx`)の文言として
  実装裁量で扱う(exact 文字列で固定しない)
- **behavioral black-box**: 公開型 / DOM / aria / 表示文字列は観測してよいが、hook 内部
  ロジック / class 名 / private には依存しない
- **superset**: fake stack(adapter no-op + fake media)でテスト不能な受け入れ仕様も
  md には残し、`spec.ts` カバー外マーカーを付ける
