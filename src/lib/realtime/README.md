# Realtime adapter

OpenAI Realtime API などの音声会話プロバイダを **provider-agnostic な session API** で抽象化する層。

UI からは「会話セッションの開始・停止・マイク切替・字幕イベント」だけが見える状態にし、WebRTC / WebSocket / ephemeral token などのプロトコル詳細は各実装(`createOpenAIRealtimeAdapter` 等)に閉じる。Phase 3 で Pi 等への差し替えを検討する際、UI コードを触らずに済むことを担保する。

## 公開型

- `RealtimeAdapter` — `connect(options): Promise<RealtimeSession>` の 1 メソッドのみ
- `RealtimeSession` — `getState()` / `setMicEnabled(enabled)` / `disconnect()`
- `SessionState` — `idle | connecting | listening | speaking | error`(design.md オーブ状態 3 つ + connecting / error)
- `RealtimeEvent` — `state` / `transcript` / `error` の discriminated union
- `TranscriptTurn` — 累積 text + `isFinal`(delta は adapter 内で累積)

## 設計上の契約(実装者向け)

1. **token 取得は adapter の外**: `ConnectOptions.fetchEphemeralToken` を呼ぶ。adapter は `/api/session` のパスや HTTP 詳細を知らない
2. **DOM 生成しない**: `HTMLAudioElement` は呼び出し側から渡す。adapter は `audioElement.srcObject` に AI 音声を attach するだけ
3. **イベントは単一 onEvent に集約**: 複数購読が必要なら呼び出し側で fan-out する。将来必要になれば `subscribe(): unsubscribe` を追加可能(non-breaking 拡張として設計余地あり)
4. **transcript は累積**: API が delta で来る場合も、adapter が同 turn 内で累積し、UI には常に「現在の累積 text」を渡す
5. **状態は 5 値に絞る**: reconnecting / paused 等は MVP スコープ外
6. **接続方式を表面に漏らさない**: `RealtimeSession` API に `peerConnection` 等を出さない

## 使い方(将来の利用イメージ — 実装は Sprint 2 [7][8])

```ts
import { createRealtimeAdapter } from '@/lib/realtime';

const adapter = createRealtimeAdapter();
const session = await adapter.connect({
  fetchEphemeralToken: async () => {
    const res = await fetch('/api/session', { method: 'POST' });
    const { token } = await res.json();
    return token;
  },
  audioElement: audioRef.current!,
  onEvent: (e) => {
    if (e.type === 'state') setOrbState(e.state);
    if (e.type === 'transcript') upsertTurn(e.turn);
    if (e.type === 'error') showError(e.error);
  },
});

session.setMicEnabled(false);
await session.disconnect();
```

## ファイル構成

- `types.ts` — 公開型。実装はここを import する
- `adapter.ts` — `createRealtimeAdapter()` の factory 入口(MVP は OpenAI 固定)
- `createOpenAIRealtimeAdapter.ts` — OpenAI Realtime API 実装(Sprint 2 [7][8] で中身を埋める)
- `index.ts` — barrel
