import type { GenerateTextResult, TextStreamPart, ToolSet } from 'ai';
import type { ChatCompleteResponse, StreamingChoice } from '../types/index.js';
import { Role } from '../types/index.js';
import type { LanguageModel } from '../types/ai-SDK.js';

export function transformChatResult(
  result: GenerateTextResult<ToolSet, unknown>,
  model: LanguageModel,
): ChatCompleteResponse {
  const response: ChatCompleteResponse = {
    id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    created: Math.floor(Date.now() / 1000),
    object: 'chat.completion',
    model: typeof model === 'string' ? model : model.modelId,
    choices: [
      {
        message: {
          role: Role.ASSISTANT,
          content: result.text,
          tool_calls: result.toolCalls.map((toolCall) => ({
            id: toolCall.toolCallId,
            type: 'function',
            function: {
              name: toolCall.toolName,
              arguments: JSON.stringify(toolCall.input),
            },
          })),
        },
        finish_reason: result.finishReason,
        native_finish_reason: result.finishReason,
      },
    ],
  };

  if (result.usage) {
    response.usage = {
      prompt_tokens: result.usage.inputTokens || 0,
      completion_tokens: result.usage.outputTokens || 0,
      total_tokens: result.usage.totalTokens || 0,
    };
  }

  return response;
}

export function toOpenAIChunk(chunk: TextStreamPart<ToolSet>, model: LanguageModel): ChatCompleteResponse {
  const choice: StreamingChoice = {
    finish_reason: '',
    native_finish_reason: '',
    delta: {
      content: '',
      role: Role.ASSISTANT,
    },
  };
  const result: ChatCompleteResponse = {
    id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    created: Math.floor(Date.now() / 1000),
    object: 'chat.completion.chunk',
    model: typeof model === 'string' ? model : model.modelId,
    choices: [choice],
  };

  switch (chunk.type) {
    case 'tool-call':
      choice.delta.tool_calls = [
        {
          id: chunk.toolCallId,
          type: 'function',
          function: {
            name: chunk.toolName,
            arguments: JSON.stringify(chunk.input),
          },
        },
      ];
      break;
    case 'text-delta':
      choice.delta.content = chunk.text;
      break;
    case 'finish':
      choice.finish_reason = chunk.finishReason;
      choice.native_finish_reason = chunk.finishReason;
      result.usage = {
        prompt_tokens: chunk.totalUsage.inputTokens || 0,
        completion_tokens: chunk.totalUsage.outputTokens || 0,
        total_tokens: chunk.totalUsage.totalTokens || 0,
      };
      break;
    default:
      break;
  }

  return result;
}
