import { createOpenAIRealtimeAdapter } from './createOpenAIRealtimeAdapter';
import type { RealtimeAdapter } from './types';

export function createRealtimeAdapter(): RealtimeAdapter {
  return createOpenAIRealtimeAdapter();
}
