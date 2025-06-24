/*
 * @Descript:
 * @Author: yaoyun
 * @Date: 2025-06-20 17:23:00
 * @FilePath: /tiny-agent/packages/ai-client/src/ai-client.ts
 */
/*
 * @Descript:
 * @Author: yaoyun
 * @Date: 2025-06-20 17:23:00
 * @FilePath: /tiny-agent/packages/ai-client/src/ai-client.ts
 */
import type { ChatCompleteParams, ChatCompleteResponse, IAIClient, Provider } from './types';

export class AIClient implements IAIClient {
  provider: Provider;

  constructor() {}

  chatCompletions(payload: ChatCompleteParams): Promise<ChatCompleteResponse> {
    
  }
}
